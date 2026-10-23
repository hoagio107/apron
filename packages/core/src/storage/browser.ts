import type { StorageProvider, FileInfo } from './types';

export class BrowserStorageProvider implements StorageProvider {
  async initialize(): Promise<boolean> {
    return true;
  }

  async readTextFile(path: string): Promise<string> {
    const data = localStorage.getItem(`fs:${path}`);
    if (data === null) {
      throw new Error(`File not found: ${path}`);
    }
    return data;
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    localStorage.setItem(`fs:${path}`, content);
    
    // Also track directories
    const parts = path.split('/');
    if (parts.length > 1) {
      const dirPath = parts.slice(0, -1).join('/');
      const fileName = parts[parts.length - 1];
      await this.addToDir(dirPath, fileName);
    }
  }

  private async addToDir(dirPath: string, fileName: string) {
    const dirKey = `fs_dir:${dirPath}`;
    const filesStr = localStorage.getItem(dirKey) || '[]';
    const files = JSON.parse(filesStr) as string[];
    if (!files.includes(fileName)) {
      files.push(fileName);
      localStorage.setItem(dirKey, JSON.stringify(files));
    }
  }

  private async removeFromDir(dirPath: string, fileName: string) {
    const dirKey = `fs_dir:${dirPath}`;
    const filesStr = localStorage.getItem(dirKey) || '[]';
    const files = JSON.parse(filesStr) as string[];
    const updated = files.filter(f => f !== fileName);
    localStorage.setItem(dirKey, JSON.stringify(updated));
  }

  async readDir(path: string): Promise<FileInfo[]> {
    const dirKey = `fs_dir:${path}`;
    const filesStr = localStorage.getItem(dirKey) || '[]';
    const files = JSON.parse(filesStr) as string[];
    
    return files.map(name => ({
      name,
      isDirectory: false, // Simple mock doesn't handle subdirs properly but sufficient for our flat data
    }));
  }

  async mkdir(path: string): Promise<void> {
    const dirKey = `fs_dir:${path}`;
    if (!localStorage.getItem(dirKey)) {
      localStorage.setItem(dirKey, '[]');
    }
  }

  async exists(path: string): Promise<boolean> {
    if (path.includes('.')) {
      // It's a file
      return localStorage.getItem(`fs:${path}`) !== null;
    }
    // It's a directory
    return localStorage.getItem(`fs_dir:${path}`) !== null;
  }

  async deleteFile(path: string): Promise<void> {
    localStorage.removeItem(`fs:${path}`);
    
    const parts = path.split('/');
    if (parts.length > 1) {
      const dirPath = parts.slice(0, -1).join('/');
      const fileName = parts[parts.length - 1];
      await this.removeFromDir(dirPath, fileName);
    }
  }
}
