import { getStorageProvider } from '../storage';
import type { Recipe } from '../types/recipe';

const RECIPES_DIR = 'recipes';
const RECIPES_INDEX_FILE = 'recipes_index.json';
const BULK_WRITE_CONCURRENCY = 50;

export type RecipeDeleteHook = (recipes: Recipe[]) => Promise<void> | void;

export function slugifyRecipeTitle(title: string | undefined, fallbackId: string): string {
  if (!title) return fallbackId;
  return (
    title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || fallbackId
  );
}

function parseTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  const ts = Date.parse(dateStr);
  return Number.isNaN(ts) ? 0 : ts;
}

export class RecipeRepository {
  private static deleteHooks: RecipeDeleteHook[] = [];
  private static indexOperationQueue: Promise<unknown> = Promise.resolve();

  /**
   * Đảm bảo các tác vụ cập nhật file chỉ mục recipes_index.json được xếp hàng tuần tự (Mutex lock)
   */
  private static async withIndexLock<T>(fn: () => Promise<T>): Promise<T> {
    const next = RecipeRepository.indexOperationQueue.then(fn, fn);
    RecipeRepository.indexOperationQueue = next.then(() => {}, () => {});
    return next;
  }

  /**
   * Chuẩn hoá công thức khi lưu vào file chỉ mục:
   * Giữ trọn vẹn thông tin hiển thị, nhưng loại bỏ các trường quá nặng như recipe_snapshot trong cooking_history.
   */
  private static sanitizeForIndex(recipe: Recipe): Recipe {
    const sanitizedHistory = recipe.cooking_history?.map(h => {
      const { recipe_snapshot: _snapshot, ...rest } = h;
      return rest;
    });

    return {
      ...recipe,
      cooking_history: sanitizedHistory,
    };
  }

  /**
   * Bảo toàn recipe_snapshot từ file chi tiết trên đĩa nếu bản ghi truyền vào đến từ chỉ mục (đã bị lược bỏ snapshot)
   */
  private static async preserveHistorySnapshots(recipe: Recipe): Promise<Recipe> {
    if (!recipe.id || !recipe.cooking_history?.some((h) => h.recipe_snapshot === undefined)) {
      return recipe;
    }

    const existing = await this.getById(recipe.id);
    if (!existing?.cooking_history || existing.cooking_history.length === 0) {
      return recipe;
    }

    const snapshotMap = new Map<string, Omit<Recipe, 'cooking_history'>>();
    for (const h of existing.cooking_history) {
      if (h.id && h.recipe_snapshot) {
        snapshotMap.set(h.id, h.recipe_snapshot);
      }
    }

    if (snapshotMap.size === 0) return recipe;

    return {
      ...recipe,
      cooking_history: recipe.cooking_history.map((h) =>
        h.recipe_snapshot === undefined && h.id && snapshotMap.has(h.id)
          ? { ...h, recipe_snapshot: snapshotMap.get(h.id) }
          : h
      ),
    };
  }

  /**
   * Sắp xếp danh sách recipes theo created_at giảm dần (Schwartzian transform tránh cấp phát Date O(n log n) lần)
   */
  static sortRecipes(recipes: Recipe[]): Recipe[] {
    return recipes
      .map((recipe) => ({ recipe, ts: parseTimestamp(recipe.created_at) }))
      .sort((a, b) => b.ts - a.ts)
      .map((entry) => entry.recipe);
  }

  /**
   * Ghi danh sách công thức vào file chỉ mục recipes_index.json
   */
  private static async writeIndexFile(recipes: Recipe[]): Promise<void> {
    const storage = getStorageProvider();
    await storage.writeTextFile(RECIPES_INDEX_FILE, JSON.stringify(recipes));
  }

  static addDeleteHook(hook: RecipeDeleteHook): () => void {
    this.deleteHooks.push(hook);
    return () => {
      this.deleteHooks = this.deleteHooks.filter(h => h !== hook);
    };
  }

  /**
   * Khởi tạo thư mục chứa recipes nếu chưa có
   */
  static async init(): Promise<void> {
    const storage = getStorageProvider();
    try {
      if (!(await storage.exists(RECIPES_DIR))) {
        await storage.mkdir(RECIPES_DIR);
      }
    } catch (e) {
      console.error('Failed to init recipe directory', e);
    }
  }

  /**
   * Lấy danh sách tất cả các recipe từ file chỉ mục recipes_index.json
   * Nếu file chỉ mục chưa có hoặc lỗi, tự động quét recipes/ để rebuild index.
   */
  static async getAll(): Promise<Recipe[]> {
    const storage = getStorageProvider();
    await this.init();

    try {
      if (await storage.exists(RECIPES_INDEX_FILE)) {
        const content = await storage.readTextFile(RECIPES_INDEX_FILE);
        if (content && content.trim().length > 0) {
          const parsed = JSON.parse(content) as Recipe[];
          if (Array.isArray(parsed)) {
            return this.sortRecipes(parsed);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to read recipes_index.json, rebuilding index...', e);
    }

    // Fallback: Quét thư mục recipes/ và tái tạo chỉ mục
    return await this.rebuildIndex();
  }

  /**
   * Quét lại toàn bộ các file công thức con trong thư mục recipes/,
   * tái tạo và lưu file chỉ mục recipes_index.json.
   */
  static async rebuildIndex(): Promise<Recipe[]> {
    return this.withIndexLock(async () => {
      const storage = getStorageProvider();
      await this.init();
      const recipes: Recipe[] = [];
      const seenIds = new Set<string>();

      try {
        if (typeof storage.readDirFiles === 'function') {
          const dirFiles = await storage.readDirFiles(RECIPES_DIR);
          for (const file of dirFiles) {
            if (file.name.endsWith('.json') && file.name !== RECIPES_INDEX_FILE) {
              try {
                const r = JSON.parse(file.content) as Recipe;
                if (r) {
                  if (!r.id) r.id = file.name.replace('.json', '');
                  if (!seenIds.has(r.id)) {
                    seenIds.add(r.id);
                    recipes.push(this.sanitizeForIndex(r));
                  }
                }
              } catch (e) {
                console.error(`Failed to parse recipe ${file.name}`, e);
              }
            }
          }
        } else {
          const files = await storage.readDir(RECIPES_DIR);
          const filePromises = files
            .filter(file => !file.isDirectory && file.name.endsWith('.json') && file.name !== RECIPES_INDEX_FILE)
            .map(async file => {
              try {
                const content = await storage.readTextFile(`${RECIPES_DIR}/${file.name}`);
                const r = JSON.parse(content) as Recipe;
                if (r && !r.id) {
                  r.id = file.name.replace('.json', '');
                }
                return r ? this.sanitizeForIndex(r) : null;
              } catch (e) {
                console.error(`Failed to parse recipe ${file.name}`, e);
                return null;
              }
            });

          const results = await Promise.all(filePromises);
          for (const r of results) {
            if (r && !seenIds.has(r.id)) {
              seenIds.add(r.id);
              recipes.push(r);
            }
          }
        }
      } catch (e) {
        console.error('Failed to scan recipes directory for rebuild', e);
      }

      const sorted = this.sortRecipes(recipes);
      try {
        await this.writeIndexFile(sorted);
      } catch (e) {
        console.error('Failed to write recipes_index.json during rebuild', e);
      }
      return sorted;
    });
  }

  /**
   * Lấy một recipe theo id từ file chi tiết gốc recipes/{id}.json
   */
  static async getById(id: string): Promise<Recipe | null> {
    const storage = getStorageProvider();
    try {
      const path = `${RECIPES_DIR}/${id}.json`;
      if (!(await storage.exists(path))) return null;

      const content = await storage.readTextFile(path);
      const r = JSON.parse(content) as Recipe;
      if (r && !r.id) r.id = id;
      return r;
    } catch (e) {
      console.error(`Failed to get recipe ${id}`, e);
      return null;
    }
  }

  /**
   * Lưu hoặc cập nhật một recipe:
   * - Ghi file chi tiết recipes/{id}.json
   * - Cập nhật đồng bộ vào recipes_index.json (qua lock)
   */
  static async save(recipe: Recipe): Promise<void> {
    const storage = getStorageProvider();
    try {
      await this.init();

      if (!recipe.id) {
        recipe.id = crypto.randomUUID();
      }
      if (!recipe.slug && recipe.title) {
        recipe.slug = slugifyRecipeTitle(recipe.title, recipe.id);
      }
      if (!recipe.created_at) {
        recipe.created_at = new Date().toISOString();
      }
      recipe.updated_at = new Date().toISOString();

      // 1. Bảo toàn recipe_snapshot nếu dữ liệu truyền vào từ chỉ mục, sau đó lưu file chi tiết độc lập
      const fullRecipe = await this.preserveHistorySnapshots(recipe);
      const path = `${RECIPES_DIR}/${fullRecipe.id}.json`;
      await storage.writeTextFile(path, JSON.stringify(fullRecipe, null, 2));

      // 2. Cập nhật atomic recipes_index.json
      await this.withIndexLock(async () => {
        let indexList: Recipe[] = [];
        if (await storage.exists(RECIPES_INDEX_FILE)) {
          try {
            const content = await storage.readTextFile(RECIPES_INDEX_FILE);
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) indexList = parsed;
          } catch {
            indexList = [];
          }
        }

        const sanitized = this.sanitizeForIndex(fullRecipe);
        const existingIdx = indexList.findIndex(r => r.id === recipe.id);
        if (existingIdx >= 0) {
          indexList[existingIdx] = sanitized;
        } else {
          indexList.unshift(sanitized);
        }
        const sorted = this.sortRecipes(indexList);
        await this.writeIndexFile(sorted);
      });
    } catch (e) {
      console.error(`Failed to save recipe ${recipe.id}`, e);
      throw e;
    }
  }

  /**
   * Xoá một recipe:
   * - Xoá file chi tiết recipes/{id}.json
   * - Cập nhật recipes_index.json
   * - Thực thi delete hooks
   */
  static async delete(id: string): Promise<void> {
    const storage = getStorageProvider();
    try {
      const existing = await this.getById(id);
      const path = `${RECIPES_DIR}/${id}.json`;
      if (await storage.exists(path)) {
        await storage.deleteFile(path);
      }

      // Cập nhật atomic recipes_index.json
      await this.withIndexLock(async () => {
        if (await storage.exists(RECIPES_INDEX_FILE)) {
          try {
            const content = await storage.readTextFile(RECIPES_INDEX_FILE);
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter(r => r.id !== id);
              await this.writeIndexFile(filtered);
            }
          } catch (e) {
            console.error('Failed to update index after delete', e);
          }
        }
      });

      if (existing && this.deleteHooks.length > 0) {
        for (const hook of this.deleteHooks) {
          try {
            await hook([existing]);
          } catch (hookErr) {
            console.error('Error executing recipe delete hook:', hookErr);
          }
        }
      }
    } catch (e) {
      console.error(`Failed to delete recipe ${id}`, e);
      throw e;
    }
  }

  /**
   * Lưu nhiều recipe cùng lúc:
   * - Ghi song song các file chi tiết recipes/{id}.json theo batch
   * - Cập nhật recipes_index.json đúng 1 lần cho toàn bộ batch
   */
  static async saveBulk(recipes: Recipe[]): Promise<void> {
    if (!recipes || recipes.length === 0) return;
    const storage = getStorageProvider();
    await this.init();

    const prepared: Recipe[] = [];
    const now = new Date().toISOString();

    for (const recipe of recipes) {
      if (!recipe.id) {
        recipe.id = crypto.randomUUID();
      }
      if (!recipe.slug && recipe.title) {
        recipe.slug = slugifyRecipeTitle(recipe.title, recipe.id);
      }
      if (!recipe.created_at) {
        recipe.created_at = now;
      }
      recipe.updated_at = now;
      prepared.push({ ...recipe });
    }

    for (let i = 0; i < prepared.length; i += BULK_WRITE_CONCURRENCY) {
      const chunk = prepared.slice(i, i + BULK_WRITE_CONCURRENCY);
      await Promise.all(
        chunk.map(async (r) => {
          const fullRecipe = await this.preserveHistorySnapshots(r);
          await storage.writeTextFile(`${RECIPES_DIR}/${fullRecipe.id}.json`, JSON.stringify(fullRecipe, null, 2));
        })
      );
    }

    // Cập nhật atomic recipes_index.json 1 lần duy nhất cho toàn bộ batch
    await this.withIndexLock(async () => {
      let indexList: Recipe[] = [];
      if (await storage.exists(RECIPES_INDEX_FILE)) {
        try {
          const content = await storage.readTextFile(RECIPES_INDEX_FILE);
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) indexList = parsed;
        } catch {
          indexList = [];
        }
      }

      const indexMap = new Map<string, Recipe>();
      for (const r of indexList) {
        if (r.id) indexMap.set(r.id, r);
      }
      for (const r of prepared) {
        if (r.id) indexMap.set(r.id, this.sanitizeForIndex(r));
      }

      const merged = Array.from(indexMap.values());
      const sorted = this.sortRecipes(merged);
      await this.writeIndexFile(sorted);
    });
  }

  /**
   * Xoá nhiều recipe cùng lúc:
   * - Xoá song song các file chi tiết recipes/{id}.json
   * - Cập nhật recipes_index.json đúng 1 lần cho toàn bộ batch
   */
  static async deleteBulk(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    const storage = getStorageProvider();
    const deletedRecipes: Recipe[] = [];

    await Promise.all(
      ids.map(async (id) => {
        try {
          const existing = await this.getById(id);
          if (existing) deletedRecipes.push(existing);
          const path = `${RECIPES_DIR}/${id}.json`;
          if (await storage.exists(path)) {
            await storage.deleteFile(path);
          }
        } catch (e) {
          console.error(`Failed to delete recipe file ${id}`, e);
        }
      })
    );

    // Cập nhật atomic recipes_index.json 1 lần duy nhất
    const idsSet = new Set(ids);
    await this.withIndexLock(async () => {
      if (await storage.exists(RECIPES_INDEX_FILE)) {
        try {
          const content = await storage.readTextFile(RECIPES_INDEX_FILE);
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(r => !idsSet.has(r.id));
            await this.writeIndexFile(filtered);
          }
        } catch (e) {
          console.error('Failed to update index after bulk delete', e);
        }
      }
    });

    if (deletedRecipes.length > 0 && this.deleteHooks.length > 0) {
      for (const hook of this.deleteHooks) {
        try {
          await hook(deletedRecipes);
        } catch (hookErr) {
          console.error('Error executing recipe delete hook:', hookErr);
        }
      }
    }
  }
}
