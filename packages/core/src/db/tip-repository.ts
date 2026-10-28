import { getStorageProvider } from '../storage';
import type { Tip } from '../types/tip';

const TIPS_DIR = 'tips';
const BULK_WRITE_CONCURRENCY = 50;

function parseTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  const ts = Date.parse(dateStr);
  return Number.isNaN(ts) ? 0 : ts;
}

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
      const jsonFiles = files.filter((file) => !file.isDirectory && file.name.endsWith('.json'));
      const loaded = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const content = await storage.readTextFile(`${TIPS_DIR}/${file.name}`);
            const tip = JSON.parse(content) as Tip;
            if (tip) {
              if (!tip.id) tip.id = file.name.replace('.json', '');
              return tip;
            }
          } catch (e) {
            console.error(`Failed to parse tip ${file.name}`, e);
          }
          return null;
        })
      );
      for (const tip of loaded) {
        if (tip) tips.push(tip);
      }
    } catch (e) {
      console.error('Failed to get all tips', e);
    }

    return tips
      .map((tip) => ({ tip, ts: parseTimestamp(tip.created_at) }))
      .sort((a, b) => b.ts - a.ts)
      .map((entry) => entry.tip);
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
      const tip = JSON.parse(content) as Tip;
      if (tip && !tip.id) tip.id = id;
      return tip;
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
   * Xóa nhiều tip song song
   */
  static async deleteBulk(ids: string[]): Promise<void> {
    try {
      await Promise.all(ids.map((id) => this.delete(id)));
    } catch (e) {
      console.error('Failed to delete bulk tips', e);
      throw e;
    }
  }

  /**
   * Lưu nhiều tip cùng lúc (ghi song song theo batch)
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
    }

    for (let i = 0; i < tips.length; i += BULK_WRITE_CONCURRENCY) {
      const chunk = tips.slice(i, i + BULK_WRITE_CONCURRENCY);
      await Promise.all(
        chunk.map((t) => storage.writeTextFile(`${TIPS_DIR}/${t.id}.json`, JSON.stringify(t, null, 2)))
      );
    }
  }
}
