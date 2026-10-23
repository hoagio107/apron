import { convertUrlToWebPDataUrl } from './image-utils';

export class ImageManager {
  static async getBaseDir() {
    return 'mobile-dir';
  }

  static async initDirs() {}

  static async saveToTemp(file: File): Promise<string> {
    return URL.createObjectURL(file);
  }

  static async saveFromTemp(tempPath: string): Promise<string> {
    return tempPath;
  }

  static async commitImage(tempPath: string): Promise<string> {
    if (tempPath.startsWith('blob:')) {
      try {
        const dataUrl = await convertUrlToWebPDataUrl(tempPath);
        return dataUrl;
      } catch (e) {
        console.error("Failed to convert blob to data URL", e);
        return tempPath;
      }
    }
    return tempPath;
  }

  static async saveImage(file: File): Promise<string> {
    return URL.createObjectURL(file);
  }

  static getAssetUrl(filePath: string): string {
    return filePath;
  }

  static async deleteImage(filePath: string) {
    if (filePath.startsWith('blob:')) {
      URL.revokeObjectURL(filePath);
    }
  }

  static async deleteImages(filePaths: string[]) {
    for (const p of filePaths) {
      await this.deleteImage(p);
    }
  }

  static async processAndSaveImage(file: File): Promise<string> {
    const dataUrl = await convertUrlToWebPDataUrl(URL.createObjectURL(file));
    return dataUrl;
  }
}
