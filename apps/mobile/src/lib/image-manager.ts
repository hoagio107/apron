import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { convertUrlToWebPDataUrl } from './image-utils';

export class ImageManager {
  private static cachedBaseUri: string = typeof localStorage !== 'undefined' 
    ? (localStorage.getItem('cached_mobile_images_uri') || '') 
    : '';

  static toRelativePath(path: string): string {
    if (!path) return '';
    if (
      path.startsWith('http://') || 
      path.startsWith('https://') || 
      path.startsWith('data:') || 
      path.startsWith('blob:')
    ) {
      return path;
    }

    const normalized = path.replace(/\\/g, '/');
    const match = normalized.match(/(?:^|\/)images\/([^/]+)$/i);
    if (match) {
      return `images/${match[1]}`;
    }

    if (/^[a-zA-Z0-9_.-]+\.(webp|png|jpg|jpeg|gif|svg)$/i.test(normalized)) {
      return `images/${normalized}`;
    }

    return normalized;
  }

  static async initDirs() {
    if (Capacitor.isNativePlatform()) {
      try {
        // Đảm bảo thư mục CookbookData/images tồn tại
        try {
          await Filesystem.mkdir({
            path: 'CookbookData/images',
            directory: Directory.Documents,
            recursive: true
          });
        } catch {}

        const res = await Filesystem.getUri({
          path: 'CookbookData/images',
          directory: Directory.Documents
        });
        if (res && res.uri) {
          this.cachedBaseUri = res.uri;
          localStorage.setItem('cached_mobile_images_uri', res.uri);
        }
      } catch (e) {
        console.error("Lỗi khởi tạo thư mục ảnh mobile:", e);
      }
    }
  }

  static async saveToTemp(file: File): Promise<string> {
    return URL.createObjectURL(file);
  }

  static async saveFromTemp(tempPath: string): Promise<string> {
    return tempPath;
  }

  static async commitImage(tempPath: string): Promise<string> {
    if (!tempPath) return tempPath;

    // Nếu là URL web hoặc data URL có sẵn
    if (tempPath.startsWith('http://') || tempPath.startsWith('https://')) {
      return tempPath;
    }

    const rel = this.toRelativePath(tempPath);
    if (rel.startsWith('images/') && !tempPath.startsWith('blob:')) {
      return rel;
    }

    // Nếu là blob URL (chọn từ máy điện thoại)
    if (tempPath.startsWith('blob:')) {
      try {
        const dataUrl = await convertUrlToWebPDataUrl(tempPath);
        const filename = `${crypto.randomUUID()}.webp`;

        if (Capacitor.isNativePlatform()) {
          await this.initDirs();
          // Tách phần base64 từ data:image/webp;base64,....
          const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

          await Filesystem.writeFile({
            path: `CookbookData/images/${filename}`,
            directory: Directory.Documents,
            data: base64Data,
            recursive: true
          });

          return `images/${filename}`;
        }

        // Fallback môi trường web browser
        return dataUrl;
      } catch (e) {
        console.error("Lỗi khi lưu ảnh vào CookbookData/images trên mobile:", e);
        return tempPath;
      }
    }

    return tempPath;
  }

  static async saveImage(file: File): Promise<string> {
    return URL.createObjectURL(file);
  }

  static getAssetUrl(filePath: string): string {
    if (!filePath) return '';
    if (
      filePath.startsWith('http://') || 
      filePath.startsWith('https://') || 
      filePath.startsWith('data:') || 
      filePath.startsWith('blob:')
    ) {
      return filePath;
    }

    // Chuẩn hóa và bóc tách (hỗ trợ cả images/uuid.webp lẫn path Windows cũ C:\...\images\uuid.webp từ desktop)
    const rel = this.toRelativePath(filePath);

    if (rel.startsWith('images/')) {
      const filename = rel.substring(7);

      if (Capacitor.isNativePlatform()) {
        const baseUri = this.cachedBaseUri || 
          (typeof localStorage !== 'undefined' ? localStorage.getItem('cached_mobile_images_uri') : null) || 
          'file:///storage/emulated/0/Documents/CookbookData/images';
        
        const fullFileUri = `${baseUri.replace(/\/+$/, '')}/${filename}`;
        return Capacitor.convertFileSrc(fullFileUri);
      }

      return filePath;
    }

    if (Capacitor.isNativePlatform()) {
      return Capacitor.convertFileSrc(filePath);
    }

    return filePath;
  }

  static async deleteImage(filePath: string) {
    if (!filePath) return;
    if (filePath.startsWith('blob:')) {
      URL.revokeObjectURL(filePath);
      return;
    }
    if (Capacitor.isNativePlatform()) {
      const rel = this.toRelativePath(filePath);
      if (rel.startsWith('images/')) {
        const filename = rel.substring(7);
        try {
          await Filesystem.deleteFile({
            path: `CookbookData/images/${filename}`,
            directory: Directory.Documents
          });
        } catch (e) {
          console.error("Lỗi xóa file ảnh trên mobile:", e);
        }
      }
    }
  }

  static async deleteImages(filePaths: string[]) {
    for (const p of filePaths) {
      await this.deleteImage(p);
    }
  }

  static async processAndSaveImage(file: File): Promise<string> {
    const tempUrl = URL.createObjectURL(file);
    return await this.commitImage(tempUrl);
  }
}
