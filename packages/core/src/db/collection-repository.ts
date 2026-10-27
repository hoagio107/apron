import { getStorageProvider } from '../storage';
import type { Collection } from '../types/collection';

const COLLECTIONS_DIR = 'collections';

export class CollectionRepository {
  /**
   * Khởi tạo thư mục chứa collections nếu chưa có
   */
  static async init(): Promise<void> {
    const storage = getStorageProvider();
    try {
      if (!(await storage.exists(COLLECTIONS_DIR))) {
        await storage.mkdir(COLLECTIONS_DIR);
      }
    } catch (e) {
      console.error('Failed to init collections directory', e);
    }
  }

  /**
   * Lấy danh sách tất cả các collections
   */
  static async getAll(): Promise<Collection[]> {
    const storage = getStorageProvider();
    const collections: Collection[] = [];
    try {
      if (!(await storage.exists(COLLECTIONS_DIR))) return collections;

      const files = await storage.readDir(COLLECTIONS_DIR);
      for (const file of files) {
        if (!file.isDirectory && file.name.endsWith('.json')) {
          try {
            const content = await storage.readTextFile(`${COLLECTIONS_DIR}/${file.name}`);
            const col = JSON.parse(content) as Collection;
            if (col) {
              if (!col.id) col.id = file.name.replace('.json', '');
              collections.push(col);
            }
          } catch (e) {
            console.error(`Failed to parse collection ${file.name}`, e);
          }
        }
      }
    } catch (e) {
      console.error('Failed to get all collections', e);
    }
    
    // Sắp xếp theo created_at giảm dần
    return collections.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }

  /**
   * Lấy chi tiết một collection theo ID
   */
  static async getById(id: string): Promise<Collection | null> {
    const storage = getStorageProvider();
    try {
      const filePath = `${COLLECTIONS_DIR}/${id}.json`;
      if (!(await storage.exists(filePath))) return null;
      
      const content = await storage.readTextFile(filePath);
      return JSON.parse(content) as Collection;
    } catch (e) {
      console.error(`Failed to get collection ${id}`, e);
      return null;
    }
  }

  /**
   * Lưu hoặc cập nhật một collection
   */
  static async save(collection: Collection): Promise<void> {
    const storage = getStorageProvider();
    try {
      if (!collection.id) {
        collection.id = crypto.randomUUID();
      }
      
      const now = new Date().toISOString();
      if (!collection.created_at) collection.created_at = now;
      collection.updated_at = now;

      await this.init();
      const filePath = `${COLLECTIONS_DIR}/${collection.id}.json`;
      await storage.writeTextFile(filePath, JSON.stringify(collection, null, 2));
    } catch (e) {
      console.error(`Failed to save collection ${collection.id}`, e);
      throw e;
    }
  }

  /**
   * Xoá một collection
   */
  static async delete(id: string): Promise<void> {
    const storage = getStorageProvider();
    try {
      const filePath = `${COLLECTIONS_DIR}/${id}.json`;
      if (await storage.exists(filePath)) {
        await storage.deleteFile(filePath);
      }
    } catch (e) {
      console.error(`Failed to delete collection ${id}`, e);
      throw e;
    }
  }

  /**
   * Xoá nhiều collections
   */
  static async deleteBulk(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id);
    }
  }
}
