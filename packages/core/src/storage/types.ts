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
  mkdir(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  deleteFile(path: string): Promise<void>;
}
