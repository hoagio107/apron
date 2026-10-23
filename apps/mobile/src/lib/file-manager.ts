export class FileManager { 
  static async getBaseDir() { return 'mobile-dir'; } 
  static async initDirs() {} 
  static async saveAttachment(file: File): Promise<string> { return URL.createObjectURL(file); } 
  static getAssetUrl(filePath: string): string { return filePath; } 
  static async deleteFile(filePath: string) { URL.revokeObjectURL(filePath); } 
  static async readTextFile(filePath: string): Promise<string> { return ''; }
  static getFilename(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path.split('/').pop() || path;
    }
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1];
  }
}
