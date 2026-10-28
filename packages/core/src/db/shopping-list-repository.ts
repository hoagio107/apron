import { getStorageProvider } from '../storage';
import type { ShoppingListItem } from '../types/shopping-list';

const SHOPPING_LIST_FILE = 'shopping_list.json';

export class ShoppingListRepository {
  private static writeQueue: Promise<unknown> = Promise.resolve();

  private static async withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
    const next = ShoppingListRepository.writeQueue.then(fn, fn);
    ShoppingListRepository.writeQueue = next.then(() => {}, () => {});
    return next;
  }

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
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? (parsed as ShoppingListItem[]) : [];
    } catch (e) {
      console.error('Failed to get shopping list', e);
      return [];
    }
  }

  /**
   * Lưu toàn bộ danh sách đi chợ (tuần tự qua lock để tránh race condition)
   */
  static async saveAll(items: ShoppingListItem[]): Promise<void> {
    return this.withWriteLock(async () => {
      const storage = getStorageProvider();
      try {
        await storage.writeTextFile(SHOPPING_LIST_FILE, JSON.stringify(items, null, 2));
      } catch (e) {
        console.error('Failed to save shopping list', e);
        throw e;
      }
    });
  }
}
