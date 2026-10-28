import { appDataDir, join } from '@tauri-apps/api/path';
import { mkdir, writeFile, readFile, remove, exists } from '@tauri-apps/plugin-fs';
import { convertFileSrc } from '@tauri-apps/api/core';
import { convertUrlToWebPDataUrl, toRelativeImagePath } from './image-utils';

export class ImageManager {
  private static cachedBaseDir: string = typeof localStorage !== 'undefined'
    ? (localStorage.getItem('byos_base_dir') || '')
    : '';

  static async getBaseDir(): Promise<string> {
    const byosDir = localStorage.getItem('byos_base_dir');
    if (byosDir) {
      this.cachedBaseDir = byosDir;
      return byosDir;
    }
    const appDir = await appDataDir();
    this.cachedBaseDir = appDir;
    return appDir;
  }

  static toRelativePath(path: string): string {
    return toRelativeImagePath(path);
  }

  static async initDirs() {
    try {
      const baseDir = await this.getBaseDir();
      this.cachedBaseDir = baseDir;
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

    // If it's a URL (http/https) or data URL
    if (tempPath.startsWith('http://') || tempPath.startsWith('https://') || tempPath.startsWith('data:')) {
      return tempPath;
    }

    // Check if it's already a relative images path or inside the images directory (not in temp)
    const rel = this.toRelativePath(tempPath);
    const baseDir = await this.getBaseDir();
    this.cachedBaseDir = baseDir;
    const imagesDir = await join(baseDir, 'images');

    if (rel.startsWith('images/') && !tempPath.includes('temp')) {
      return rel;
    }
    if (tempPath.includes(imagesDir)) {
      return rel;
    }

    try {
      await this.initDirs();

      // Kiểm tra nếu file temp không tồn tại thì fallback
      if (!(await exists(tempPath))) {
        return this.toRelativePath(tempPath);
      }

      const bytes = await readFile(tempPath);

      let mimeType = 'image/jpeg';
      const ext = tempPath.split('.').pop()?.toLowerCase();
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'gif') mimeType = 'image/gif';

      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);

      try {
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

        return `images/${filename}`;
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Failed to commit image', tempPath, e);
      return this.toRelativePath(tempPath);
    }
  }

  static async deleteImages(paths: string[]) {
    const baseDir = await this.getBaseDir();
    await Promise.all(
      paths.map(async (p) => {
        if (!p || p.startsWith('http') || p.startsWith('data:')) return;
        try {
          const rel = this.toRelativePath(p);
          const targetPath = rel.startsWith('images/')
            ? await join(baseDir, 'images', rel.substring(7))
            : p;
          if (await exists(targetPath)) {
            await remove(targetPath);
          }
        } catch (e) {
          console.error('Failed to remove image', p, e);
        }
      })
    );
  }

  static getAssetUrl(path: string): string {
    if (!path) return '';
    if (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('data:') ||
      path.startsWith('blob:')
    ) {
      return path;
    }

    const rel = this.toRelativePath(path);
    const baseDir = (typeof localStorage !== 'undefined' ? localStorage.getItem('byos_base_dir') : null) || this.cachedBaseDir;

    if (rel.startsWith('images/')) {
      const filename = rel.substring(7);
      if (baseDir) {
        const separator = baseDir.includes('\\') ? '\\' : '/';
        const cleanBase = baseDir.replace(/[/\\]+$/, '');
        const fullPath = `${cleanBase}${separator}images${separator}${filename}`;
        return convertFileSrc(fullPath);
      }
    }

    return convertFileSrc(path);
  }
}
