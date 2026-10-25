import { appDataDir, join } from '@tauri-apps/api/path';
import { mkdir, writeFile, remove, exists } from '@tauri-apps/plugin-fs';
import { convertFileSrc } from '@tauri-apps/api/core';

export class FileManager {
  static async getBaseDir() {
    const byosDir = localStorage.getItem('byos_base_dir');
    if (byosDir) return byosDir;
    return await appDataDir();
  }

  static async initDirs() {
    try {
      const baseDir = await this.getBaseDir();
      const tempDir = await join(baseDir, 'temp');
      const attachmentsDir = await join(baseDir, 'attachments');

      if (!(await exists(tempDir))) await mkdir(tempDir, { recursive: true });
      if (!(await exists(attachmentsDir))) await mkdir(attachmentsDir, { recursive: true });
    } catch (error) {
      console.error("Failed to init file dirs:", error);
    }
  }

  /**
   * Save a file from the browser (File object) directly to the attachments directory.
   */
  static async saveAttachment(file: File): Promise<string> {
    await this.initDirs();
    const baseDir = await this.getBaseDir();
    
    // Create a safe unique filename to avoid collisions
    const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filename = `${crypto.randomUUID().substring(0, 8)}_${safeOriginalName}`;
    const filePath = await join(baseDir, 'attachments', filename);

    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    await writeFile(filePath, uint8Array);

    return filePath;
  }

  static async deleteAttachment(path: string) {
    if (!path || path.startsWith('http://') || path.startsWith('https://')) return;
    try {
      if (await exists(path)) {
        await remove(path);
      }
    } catch (e) {
      console.error('Failed to remove attachment', path, e);
    }
  }

  static getAssetUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
      return path;
    }
    return convertFileSrc(path);
  }

  /**
   * Extracts just the filename from a full path
   */
  static getFilename(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path.split('/').pop() || path;
    }
    // Handle both Windows and Unix path separators
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1];
  }
}
