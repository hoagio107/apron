import { appDataDir, join } from '@tauri-apps/api/path';
import { mkdir, writeFile, readFile, remove, exists } from '@tauri-apps/plugin-fs';
import { convertFileSrc } from '@tauri-apps/api/core';
import { convertUrlToWebPDataUrl } from './image-utils';

export class ImageManager {
  static async getBaseDir() {
    // Ưu tiên thư mục BYOS của người dùng
    const byosDir = localStorage.getItem('byos_base_dir');
    if (byosDir) return byosDir;
    
    // Fallback về appDataDir
    return await appDataDir();
  }

  static async initDirs() {
    try {
      const baseDir = await this.getBaseDir();
      const tempDir = await join(baseDir, 'temp');
      const imagesDir = await join(baseDir, 'images');

      if (!(await exists(tempDir))) await mkdir(tempDir, { recursive: true });
      if (!(await exists(imagesDir))) await mkdir(imagesDir, { recursive: true });
    } catch (error) {
      console.error("Failed to init dirs:", error);
    }
  }

  static async saveToTemp(file: File): Promise<string> {
    await this.initDirs();
    const ext = file.name.split('.').pop() || 'tmp';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const baseDir = await this.getBaseDir();
    const filePath = await join(baseDir, 'temp', filename);

    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    await writeFile(filePath, uint8Array);

    return filePath;
  }

  static async commitImage(tempPath: string): Promise<string> {
    if (!tempPath) return tempPath;
    
    // If it's a URL (http/https) or already in /images/, don't process it as a temp file
    if (tempPath.startsWith('http://') || tempPath.startsWith('https://')) {
      return tempPath;
    }
    
    // Check if it's already in the images directory (not temp)
    const baseDir = await this.getBaseDir();
    const imagesDir = await join(baseDir, 'images');
    if (tempPath.includes(imagesDir)) {
      return tempPath;
    }

    try {
      await this.initDirs();
      
      // Kiểm tra nếu file temp không tồn tại thì skip
      if (!(await exists(tempPath))) {
        return tempPath;
      }
      
      const bytes = await readFile(tempPath);
      
      let mimeType = 'image/jpeg';
      const ext = tempPath.split('.').pop()?.toLowerCase();
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'gif') mimeType = 'image/gif';
      
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);

      const webpDataUrl = await convertUrlToWebPDataUrl(url);
      const res = await fetch(webpDataUrl);
      const webpBuffer = await res.arrayBuffer();
      const webpBytes = new Uint8Array(webpBuffer);

      const filename = `${crypto.randomUUID()}.webp`;
      const outPath = await join(baseDir, 'images', filename);
      await writeFile(outPath, webpBytes);

      try {
        await remove(tempPath);
      } catch (e) {
        console.error('Failed to remove temp file', e);
      }
      
      URL.revokeObjectURL(url);
      return outPath;
    } catch (e) {
      console.error('Failed to commit image', tempPath, e);
      // Fallback: return original if failed
      return tempPath; 
    }
  }

  static async deleteImages(paths: string[]) {
    for (const p of paths) {
      if (!p || p.startsWith('http')) continue;
      try {
        if (await exists(p)) {
          await remove(p);
        }
      } catch (e) {
        console.error('Failed to remove image', p, e);
      }
    }
  }

  static getAssetUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
      return path;
    }
    return convertFileSrc(path);
  }
}
