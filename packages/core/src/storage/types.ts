export interface FileInfo {
  name: string;
  isDirectory: boolean;
  size?: number;
  lastModified?: number;
}

export interface StorageProvider {
  /**
   * Initializes the storage provider (e.g. requests permissions, picks a directory)
   */
  initialize(): Promise<boolean>;

  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, content: string): Promise<void>;
  readDir(path: string): Promise<FileInfo[]>;
  readDirFiles?(path: string): Promise<{ name: string; content: string }[]>;
  mkdir(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  deleteFile(path: string): Promise<void>;
}

/**
 * Ngăn chặn Path Traversal (OWASP): từ chối các đường dẫn chứa '..' hoặc bắt đầu bằng '/' / '\'
 */
export function sanitizeRelativePath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const segments = normalized.split('/');
  if (segments.some((seg) => seg === '..' || seg.includes('\0'))) {
    throw new Error(`Invalid relative storage path: ${relativePath}`);
  }
  return segments.filter(Boolean).join('/');
}
