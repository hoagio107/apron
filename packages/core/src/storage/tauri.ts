import { readTextFile, writeTextFile, readDir, mkdir, exists, remove } from '@tauri-apps/plugin-fs';
import { sanitizeRelativePath, type StorageProvider, type FileInfo } from './types';

// Lưu trữ thư mục gốc vào localStorage
const STORAGE_KEY = 'byos_base_dir';

export class TauriStorageProvider implements StorageProvider {
  private baseDir: string = '';

  constructor() {
    if (typeof localStorage !== 'undefined') {
      this.baseDir = localStorage.getItem(STORAGE_KEY) || '';
    }
  }

  private resolvePath(relativePath: string): string {
    if (!this.baseDir) throw new Error('Storage not initialized. Call initialize() first.');
    const safeRelative = sanitizeRelativePath(relativePath);
    const sep = this.baseDir.includes('\\') ? '\\' : '/';
    const normalizedBase = this.baseDir.replace(/[\\/]+$/, '');
    return `${normalizedBase}${sep}${safeRelative.replace(/\//g, sep)}`;
  }

  async initialize(): Promise<boolean> {
    return !!this.baseDir;
  }

  // Hàm này sẽ được OnboardingScreen gọi
  async setBaseDir(path: string): Promise<void> {
    this.baseDir = path;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, path);
    }
  }

  async readTextFile(path: string): Promise<string> {
    return await readTextFile(this.resolvePath(path));
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    await writeTextFile(this.resolvePath(path), content);
  }

  async readDir(path: string): Promise<FileInfo[]> {
    const entries = await readDir(this.resolvePath(path));
    return entries.map(e => ({
      name: e.name,
      isDirectory: e.isDirectory,
    }));
  }

  async mkdir(path: string): Promise<void> {
    await mkdir(this.resolvePath(path), { recursive: true });
  }

  async exists(path: string): Promise<boolean> {
    return await exists(this.resolvePath(path));
  }

  async deleteFile(path: string): Promise<void> {
    await remove(this.resolvePath(path));
  }
}
