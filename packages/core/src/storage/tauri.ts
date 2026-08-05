import { readTextFile, writeTextFile, readDir, mkdir, exists, remove } from '@tauri-apps/plugin-fs';
import { open } from '@tauri-apps/plugin-dialog';
import type { StorageProvider, FileInfo } from './types';

// Lưu trữ thư mục gốc tạm thời vào biến hoặc localStorage
const STORAGE_KEY = 'byos_base_dir';

export class TauriStorageProvider implements StorageProvider {
  private baseDir: string = '';

  constructor() {
    this.baseDir = localStorage.getItem(STORAGE_KEY) || '';
  }

  private resolvePath(relativePath: string): string {
    if (!this.baseDir) throw new Error('Storage not initialized. Call initialize() first.');
    // Xử lý nối chuỗi đơn giản, có thể dùng @tauri-apps/api/path để an toàn hơn
    const sep = this.baseDir.includes('\\') ? '\\' : '/';
    return `${this.baseDir}${sep}${relativePath}`.replace(/\\/g, sep).replace(/\/\//g, sep);
  }

  async initialize(): Promise<boolean> {
    if (this.baseDir) return true;
    
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Chọn thư mục đồng bộ Google Drive / OneDrive của bạn'
    });
    
    if (selected && typeof selected === 'string') {
      this.baseDir = selected;
      localStorage.setItem(STORAGE_KEY, selected);
      return true;
    }
    return false;
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
