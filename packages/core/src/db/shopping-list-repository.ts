import { getStorageProvider } from '../storage';
import type { ShoppingListItem } from '../types/shopping-list';

const SHOPPING_LIST_FILE = 'shopping_list.json';

export class ShoppingListRepository {
  /**
   * Lấy toàn bộ danh sách đi chợ
   */
  static async getAll(): Promise<ShoppingListItem[]> {
    const storage = getStorageProvider();
    try {
      if (!(await storage.exists(SHOPPING_LIST_FILE))) {
        return [];
      }
      const content = await storage.readTextFile(SHOPPING_LIST_FILE);
      return JSON.parse(content) as ShoppingListItem[];
    } catch (e) {
      console.error('Failed to get shopping list', e);
      return [];
    }
  }

  /**
   * Lưu toàn bộ danh sách đi chợ
   */
  static async saveAll(items: ShoppingListItem[]): Promise<void> {
    const storage = getStorageProvider();
    try {
      await storage.writeTextFile(SHOPPING_LIST_FILE, JSON.stringify(items, null, 2));
    } catch (e) {
      console.error('Failed to save shopping list', e);
    }
  }
}
