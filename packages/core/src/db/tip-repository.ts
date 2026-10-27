import { getStorageProvider } from '../storage';
import type { Tip } from '../types/tip';

const TIPS_DIR = 'tips';

export class TipRepository {
  /**
   * Khởi tạo thư mục chứa tips nếu chưa có
   */
  static async init(): Promise<void> {
    const storage = getStorageProvider();
    try {
      if (!(await storage.exists(TIPS_DIR))) {
        await storage.mkdir(TIPS_DIR);
      }
    } catch (e) {
      console.error('Failed to init tips directory', e);
    }
  }

  /**
   * Lấy danh sách tất cả các tips
   */
  static async getAll(): Promise<Tip[]> {
    const storage = getStorageProvider();
    const tips: Tip[] = [];
    try {
      if (!(await storage.exists(TIPS_DIR))) return tips;

      const files = await storage.readDir(TIPS_DIR);
      for (const file of files) {
        if (!file.isDirectory && file.name.endsWith('.json')) {
          try {
            const content = await storage.readTextFile(`${TIPS_DIR}/${file.name}`);
            const tip = JSON.parse(content) as Tip;
            tips.push(tip);
          } catch (e) {
            console.error(`Failed to parse tip ${file.name}`, e);
          }
        }
      }
    } catch (e) {
      console.error('Failed to get all tips', e);
    }
    
    // Sort by created_at descending by default
    return tips.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }

  /**
   * Lấy chi tiết một tip
   */
  static async getById(id: string): Promise<Tip | null> {
    const storage = getStorageProvider();
    try {
      const filePath = `${TIPS_DIR}/${id}.json`;
      if (!(await storage.exists(filePath))) return null;
      
      const content = await storage.readTextFile(filePath);
      return JSON.parse(content) as Tip;
    } catch (e) {
      console.error(`Failed to get tip ${id}`, e);
      return null;
    }
  }

  /**
   * Lưu hoặc cập nhật một tip
   */
  static async save(tip: Tip): Promise<void> {
    const storage = getStorageProvider();
    try {
      if (!tip.id) {
        tip.id = crypto.randomUUID();
      }
      
      const now = new Date().toISOString();
      if (!tip.created_at) tip.created_at = now;
      tip.updated_at = now;

      await this.init();
      const filePath = `${TIPS_DIR}/${tip.id}.json`;
      await storage.writeTextFile(filePath, JSON.stringify(tip, null, 2));
    } catch (e) {
      console.error(`Failed to save tip ${tip.id}`, e);
      throw e;
    }
  }

  /**
   * Xoá một tip
   */
  static async delete(id: string): Promise<void> {
    const storage = getStorageProvider();
    try {
      const filePath = `${TIPS_DIR}/${id}.json`;
      if (await storage.exists(filePath)) {
        await storage.deleteFile(filePath);
      }
    } catch (e) {
      console.error(`Failed to delete tip ${id}`, e);
      throw e;
    }
  }

  /**
   * Xóa nhiều tip
   */
  static async deleteBulk(ids: string[]): Promise<void> {
    const storage = getStorageProvider();
    try {
      for (const id of ids) {
        const filePath = `${TIPS_DIR}/${id}.json`;
        if (await storage.exists(filePath)) {
          await storage.deleteFile(filePath);
        }
      }
    } catch (e) {
      console.error('Failed to delete bulk tips', e);
      throw e;
    }
  }

  /**
   * Lưu nhiều tip cùng lúc (tối ưu khởi tạo thư mục 1 lần duy nhất)
   */
  static async saveBulk(tips: Tip[]): Promise<void> {
    if (!tips || tips.length === 0) return;
    const storage = getStorageProvider();
    await this.init();
    const now = new Date().toISOString();

    for (const t of tips) {
      if (!t.id) {
        t.id = crypto.randomUUID();
      }
      if (!t.created_at) {
        t.created_at = now;
      }
      t.updated_at = now;

      const filePath = `${TIPS_DIR}/${t.id}.json`;
      await storage.writeTextFile(filePath, JSON.stringify(t, null, 2));
    }
  }
}
