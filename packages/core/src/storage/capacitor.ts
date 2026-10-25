import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import type { StorageProvider, FileInfo } from './types';

// Tên thư mục gốc của app bên trong thư mục Documents của thiết bị
const APP_FOLDER_NAME = 'CookbookData';

export class CapacitorStorageProvider implements StorageProvider {
  
  private resolvePath(relativePath: string): string {
    return `${APP_FOLDER_NAME}/${relativePath}`;
  }

  async initialize(): Promise<boolean> {
    try {
      // Yêu cầu quyền truy cập bộ nhớ qua Capacitor Filesystem
      try {
        await Filesystem.requestPermissions();
      } catch (permErr) {
        console.warn('Filesystem.requestPermissions warning:', permErr);
      }

      // Đảm bảo thư mục gốc tồn tại
      try {
        await Filesystem.stat({
          path: APP_FOLDER_NAME,
          directory: Directory.Documents
        });
      } catch {
        try {
          await Filesystem.mkdir({
            path: APP_FOLDER_NAME,
            directory: Directory.Documents,
            recursive: true
          });
        } catch (mkdirErr) {
          console.warn('Could not create CookbookData directory:', mkdirErr);
        }
      }
      return true;
    } catch (error) {
      console.error('Lỗi khi khởi tạo Capacitor Storage:', error);
      return false;
    }
  }

  async readTextFile(path: string): Promise<string> {
    const result = await Filesystem.readFile({
      path: this.resolvePath(path),
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    });
    // Trả về kết quả dưới dạng string
    return typeof result.data === 'string' ? result.data : '';
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    await Filesystem.writeFile({
      path: this.resolvePath(path),
      data: content,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true // Tạo các thư mục cha nếu chưa có
    });
  }

  async readDir(path: string): Promise<FileInfo[]> {
    try {
      const result = await Filesystem.readdir({
        path: this.resolvePath(path),
        directory: Directory.Documents
      });
      return result.files.map(f => ({
        name: f.name,
        isDirectory: f.type === 'directory',
        size: f.size
      }));
    } catch (e) {
      console.warn(`readDir failed for ${path}:`, e);
      return [];
    }
  }

  async mkdir(path: string): Promise<void> {
    await Filesystem.mkdir({
      path: this.resolvePath(path),
      directory: Directory.Documents,
      recursive: true
    });
  }

  async exists(path: string): Promise<boolean> {
    try {
      await Filesystem.stat({
        path: this.resolvePath(path),
        directory: Directory.Documents
      });
      return true;
    } catch {
      return false;
    }
  }

  async deleteFile(path: string): Promise<void> {
    await Filesystem.deleteFile({
      path: this.resolvePath(path),
      directory: Directory.Documents
    });
  }
}
