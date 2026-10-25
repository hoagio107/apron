import { getStorageProvider } from '../storage';
import type { Recipe } from '../types/recipe';

const RECIPES_DIR = 'recipes';

export type RecipeDeleteHook = (recipes: Recipe[]) => Promise<void> | void;

export class RecipeRepository {
  private static deleteHooks: RecipeDeleteHook[] = [];

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
   * Lấy danh sách tất cả các recipe
   */
  static async getAll(): Promise<Recipe[]> {
    const storage = getStorageProvider();
    const recipes: Recipe[] = [];
    const seenIds = new Set<string>();

    try {
      // 1. Ưu tiên đọc hàng loạt siêu tốc (0ms qua In-Memory Cache) nếu Provider hỗ trợ
      if (typeof (storage as any).readDirFiles === 'function') {
        const dirFiles = await (storage as any).readDirFiles(RECIPES_DIR);
        for (const file of dirFiles) {
          if (file.name.endsWith('.json')) {
            try {
              const r = JSON.parse(file.content) as Recipe;
              if (r) {
                if (!r.id) {
                  r.id = file.name.replace('.json', '');
                }
                if (!seenIds.has(r.id)) {
                  seenIds.add(r.id);
                  recipes.push(r);
                }
              }
            } catch (e) {
              console.error(`Failed to parse recipe ${file.name}`, e);
            }
          }
        }
      } else {
        // Fallback đọc tuần tự/song song qua readDir
        const files = await storage.readDir(RECIPES_DIR);
        const filePromises = files
          .filter(file => !file.isDirectory && file.name.endsWith('.json'))
          .map(async file => {
            try {
              const content = await storage.readTextFile(`${RECIPES_DIR}/${file.name}`);
              const r = JSON.parse(content) as Recipe;
              if (r && !r.id) {
                r.id = file.name.replace('.json', '');
              }
              return r;
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
      console.error('Failed to get all recipes', e);
    }
    
    // Sắp xếp theo created_at giảm dần một cách an toàn (tránh lỗi NaN)
    return recipes.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      const validA = isNaN(dateA) ? 0 : dateA;
      const validB = isNaN(dateB) ? 0 : dateB;
      return validB - validA;
    });
  }

  /**
   * Lấy một recipe theo id
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
   * Lưu hoặc cập nhật một recipe
   */
  static async save(recipe: Recipe): Promise<void> {
    const storage = getStorageProvider();
    try {
      await this.init();
      
      if (!recipe.id) {
        recipe.id = crypto.randomUUID();
      }
      if (!recipe.slug && recipe.title) {
        recipe.slug = recipe.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || recipe.id;
      }
      if (!recipe.created_at) {
        recipe.created_at = new Date().toISOString();
      }
      recipe.updated_at = new Date().toISOString();

      const path = `${RECIPES_DIR}/${recipe.id}.json`;
      await storage.writeTextFile(path, JSON.stringify(recipe, null, 2));
    } catch (e) {
      console.error(`Failed to save recipe ${recipe.id}`, e);
      throw e;
    }
  }

  /**
   * Xoá một recipe
   */
  static async delete(id: string): Promise<void> {
    const storage = getStorageProvider();
    try {
      const existing = await this.getById(id);
      const path = `${RECIPES_DIR}/${id}.json`;
      if (await storage.exists(path)) {
        await storage.deleteFile(path);
      }
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
   * Lưu nhiều recipe cùng lúc
   */
  static async saveBulk(recipes: Recipe[]): Promise<void> {
    for (const r of recipes) {
      await this.save(r);
    }
  }

  /**
   * Xoá nhiều recipe cùng lúc
   */
  static async deleteBulk(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id);
    }
  }
}
