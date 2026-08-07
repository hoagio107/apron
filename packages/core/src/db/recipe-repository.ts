import { getStorageProvider } from '../storage';
import type { Recipe } from '../types/recipe';

const RECIPES_DIR = 'recipes';

export class RecipeRepository {
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
    try {
      if (!(await storage.exists(RECIPES_DIR))) return recipes;

      const files = await storage.readDir(RECIPES_DIR);
      for (const file of files) {
        if (!file.isDirectory && file.name.endsWith('.json')) {
          try {
            const content = await storage.readTextFile(`${RECIPES_DIR}/${file.name}`);
            const recipe = JSON.parse(content) as Recipe;
            recipes.push(recipe);
          } catch (e) {
            console.error(`Failed to parse recipe ${file.name}`, e);
          }
        }
      }
    } catch (e) {
      console.error('Failed to get all recipes', e);
    }
    
    // Sort by created_at descending by default
    return recipes.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
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
      return JSON.parse(content) as Recipe;
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
      const path = `${RECIPES_DIR}/${id}.json`;
      if (await storage.exists(path)) {
        await storage.deleteFile(path);
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
