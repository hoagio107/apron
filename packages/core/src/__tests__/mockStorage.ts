import type { StorageProvider, FileInfo } from '../storage/types';

export class MockStorageProvider implements StorageProvider {
  private files = new Map<string, string>();
  private directories = new Set<string>();

  constructor() {
    this.directories.add('recipes');
    this.directories.add('tips');
    this.directories.add('courses');
    this.directories.add('meal-plans');
    this.directories.add('shopping-list');
  }

  async initialize(): Promise<boolean> {
    return true;
  }

  async readTextFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`File not found: ${path}`);
    }
    return content;
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }

  async readDir(dirPath: string): Promise<FileInfo[]> {
    const results: FileInfo[] = [];
    const prefix = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;

    for (const [filePath] of this.files) {
      if (filePath.startsWith(prefix)) {
        const subPath = filePath.slice(prefix.length);
        if (!subPath.includes('/')) {
          results.push({
            name: subPath,
            isDirectory: false,
          });
        }
      }
    }

    return results;
  }

  async mkdir(path: string): Promise<void> {
    this.directories.add(path);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path) || this.directories.has(path);
  }

  async deleteFile(path: string): Promise<void> {
    this.files.delete(path);
  }

  clear(): void {
    this.files.clear();
  }
}
