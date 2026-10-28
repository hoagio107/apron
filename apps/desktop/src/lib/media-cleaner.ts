import { appDataDir, join } from '@tauri-apps/api/path';
import { readDir, remove, stat, exists } from '@tauri-apps/plugin-fs';
import { 
  RecipeRepository, 
  TipRepository, 
  CourseRepository, 
  type Recipe 
} from '@apron/core';
import { ImageManager } from './image-manager';

export interface CleanupResult {
  deletedCount: number;
  freedBytes: number;
  tempFilesCleaned: number;
}

export class MediaCleaner {
  private static isHookRegistered = false;

  private static async getBaseDir(): Promise<string> {
    const byosDir = localStorage.getItem('byos_base_dir');
    if (byosDir) return byosDir;
    return await appDataDir();
  }

  /**
   * Trích xuất toàn bộ đường dẫn ảnh từ một recipe
   */
  static extractRecipeImagePaths(recipe: Recipe): string[] {
    const paths = new Set<string>();

    if (recipe.image_url) paths.add(recipe.image_url);
    if (recipe.thumbnail_url) paths.add(recipe.thumbnail_url);

    if (Array.isArray(recipe.images)) {
      recipe.images.forEach(img => {
        if (img) paths.add(img);
      });
    }

    if (Array.isArray(recipe.steps)) {
      recipe.steps.forEach(step => {
        if (step.image_url) paths.add(step.image_url);
        if (Array.isArray(step.images)) {
          step.images.forEach(img => {
            if (img) paths.add(img);
          });
        }
      });
    }

    return Array.from(paths).filter(p => !p.startsWith('http://') && !p.startsWith('https://') && !p.startsWith('data:') && !p.startsWith('blob:'));
  }

  /**
   * Thu thập tất cả các tên file ảnh đang được ứng dụng tham chiếu.
   * Ném lỗi nếu bất kỳ repository nào đọc thất bại để ngăn xoá nhầm ảnh.
   */
  static async collectAllReferencedImageFilenames(): Promise<Set<string>> {
    const referencedFilenames = new Set<string>();

    const addPath = (rawPath?: string | null) => {
      if (!rawPath) return;
      if (rawPath.startsWith('http://') || rawPath.startsWith('https://') || rawPath.startsWith('data:') || rawPath.startsWith('blob:')) {
        return;
      }
      const filename = rawPath.split(/[/\\]/).pop();
      if (filename) referencedFilenames.add(filename);
    };

    const [recipes, tips, courses] = await Promise.all([
      RecipeRepository.getAll(),
      TipRepository.getAll(),
      CourseRepository.getAll(),
    ]);

    for (const r of recipes) {
      addPath(r.image_url);
      addPath(r.thumbnail_url);
      if (Array.isArray(r.images)) r.images.forEach(addPath);
      if (Array.isArray(r.steps)) {
        r.steps.forEach(s => {
          addPath(s.image_url);
          if (Array.isArray(s.images)) s.images.forEach(addPath);
        });
      }
    }

    for (const t of tips) {
      addPath(t.image_url);
    }

    for (const c of courses) {
      addPath(c.thumbnail_url);
      if (Array.isArray(c.modules)) {
        c.modules.forEach(m => {
          if (Array.isArray(m.lessons)) {
            m.lessons.forEach((l: any) => {
              addPath(l.thumbnail_url);
              addPath(l.video_url);
            });
          }
        });
      }
    }

    return referencedFilenames;
  }

  /**
   * Xoá các ảnh thuộc về danh sách recipe bị xoá nếu không còn ai sử dụng
   */
  static async cleanRecipeImages(recipes: Recipe[]): Promise<number> {
    if (!recipes || recipes.length === 0) return 0;

    const candidatePaths: string[] = [];
    for (const r of recipes) {
      candidatePaths.push(...this.extractRecipeImagePaths(r));
    }

    if (candidatePaths.length === 0) return 0;

    // Lấy các file đang được sử dụng ở mọi nơi khác
    const allReferenced = await this.collectAllReferencedImageFilenames();

    const pathsToDelete: string[] = [];
    for (const p of candidatePaths) {
      const filename = p.split(/[/\\]/).pop();
      if (filename && !allReferenced.has(filename)) {
        pathsToDelete.push(p);
      }
    }

    if (pathsToDelete.length > 0) {
      await ImageManager.deleteImages(pathsToDelete);
    }

    return pathsToDelete.length;
  }

  /**
   * Dọn dẹp toàn bộ file ảnh mồ côi (Garbage Collection) trong thư mục images và temp
   */
  static async pruneOrphanedImages(): Promise<CleanupResult> {
    await ImageManager.initDirs();
    const baseDir = await this.getBaseDir();
    const imagesDir = await join(baseDir, 'images');
    const tempDir = await join(baseDir, 'temp');

    let deletedCount = 0;
    let freedBytes = 0;
    let tempFilesCleaned = 0;

    const referencedFilenames = await this.collectAllReferencedImageFilenames();

    // 1. Quét và dọn dẹp thư mục images
    try {
      if (await exists(imagesDir)) {
        const entries = await readDir(imagesDir);
        const orphanEntries = entries.filter(
          entry => entry.isFile && entry.name && !referencedFilenames.has(entry.name)
        );
        await Promise.all(
          orphanEntries.map(async entry => {
            const filePath = await join(imagesDir, entry.name!);
            try {
              const info = await stat(filePath);
              await remove(filePath);
              deletedCount++;
              freedBytes += info.size || 0;
            } catch (err) {
              console.error(`Failed to remove orphaned image: ${filePath}`, err);
            }
          })
        );
      }
    } catch (e) {
      console.error('Failed to prune images directory:', e);
    }

    // 2. Dọn dẹp toàn bộ thư mục temp
    try {
      if (await exists(tempDir)) {
        const tempEntries = await readDir(tempDir);
        const tempFiles = tempEntries.filter(entry => entry.isFile && entry.name);
        await Promise.all(
          tempFiles.map(async entry => {
            const tempFilePath = await join(tempDir, entry.name!);
            try {
              const info = await stat(tempFilePath);
              await remove(tempFilePath);
              tempFilesCleaned++;
              freedBytes += info.size || 0;
            } catch (err) {
              console.error(`Failed to remove temp file: ${tempFilePath}`, err);
            }
          })
        );
      }
    } catch (e) {
      console.error('Failed to prune temp directory:', e);
    }

    return {
      deletedCount,
      freedBytes,
      tempFilesCleaned
    };
  }

  /**
   * Tự động đăng ký hook xoá ảnh khi xoá công thức
   */
  static setupAutoCleanup(): void {
    if (this.isHookRegistered) return;
    this.isHookRegistered = true;

    RecipeRepository.addDeleteHook(async (recipes) => {
      try {
        await MediaCleaner.cleanRecipeImages(recipes);
      } catch (e) {
        console.error('Auto cleanup of deleted recipe images failed:', e);
      }
    });
  }
}

// Tự động khởi tạo hook khi module được nạp
MediaCleaner.setupAutoCleanup();
