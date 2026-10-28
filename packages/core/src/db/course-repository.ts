import { getStorageProvider } from '../storage';
import type { Course } from '../types/recipe';

const COURSES_DIR = 'courses';

function parseTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  const ts = Date.parse(dateStr);
  return Number.isNaN(ts) ? 0 : ts;
}

export class CourseRepository {
  /**
   * Khởi tạo thư mục chứa courses nếu chưa có
   */
  static async init(): Promise<void> {
    const storage = getStorageProvider();
    try {
      if (!(await storage.exists(COURSES_DIR))) {
        await storage.mkdir(COURSES_DIR);
      }
    } catch (e) {
      console.error('Failed to init courses directory', e);
    }
  }

  /**
   * Lấy danh sách tất cả các courses
   */
  static async getAll(): Promise<Course[]> {
    const storage = getStorageProvider();
    const courses: Course[] = [];
    try {
      if (!(await storage.exists(COURSES_DIR))) return courses;

      const files = await storage.readDir(COURSES_DIR);
      const jsonFiles = files.filter((file) => !file.isDirectory && file.name.endsWith('.json'));
      const loaded = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const content = await storage.readTextFile(`${COURSES_DIR}/${file.name}`);
            const course = JSON.parse(content) as Course;
            if (course) {
              if (!course.id) course.id = file.name.replace('.json', '');
              return course;
            }
          } catch (e) {
            console.error(`Failed to parse course ${file.name}`, e);
          }
          return null;
        })
      );
      for (const course of loaded) {
        if (course) courses.push(course);
      }
    } catch (e) {
      console.error('Failed to get all courses', e);
    }

    return courses
      .map((course) => ({ course, ts: parseTimestamp(course.created_at) }))
      .sort((a, b) => b.ts - a.ts)
      .map((entry) => entry.course);
  }

  /**
   * Lấy chi tiết một course
   */
  static async getById(id: string): Promise<Course | null> {
    const storage = getStorageProvider();
    try {
      const filePath = `${COURSES_DIR}/${id}.json`;
      if (!(await storage.exists(filePath))) return null;

      const content = await storage.readTextFile(filePath);
      const course = JSON.parse(content) as Course;
      if (course && !course.id) course.id = id;
      return course;
    } catch (e) {
      console.error(`Failed to get course ${id}`, e);
      return null;
    }
  }

  /**
   * Lưu hoặc cập nhật một course
   */
  static async save(course: Course): Promise<void> {
    const storage = getStorageProvider();
    try {
      if (!course.id) {
        course.id = crypto.randomUUID();
      }

      const now = new Date().toISOString();
      if (!course.created_at) course.created_at = now;

      await this.init();
      const filePath = `${COURSES_DIR}/${course.id}.json`;
      await storage.writeTextFile(filePath, JSON.stringify(course, null, 2));
    } catch (e) {
      console.error(`Failed to save course ${course.id}`, e);
      throw e;
    }
  }

  /**
   * Xoá một course
   */
  static async delete(id: string): Promise<void> {
    const storage = getStorageProvider();
    try {
      const filePath = `${COURSES_DIR}/${id}.json`;
      if (await storage.exists(filePath)) {
        await storage.deleteFile(filePath);
      }
    } catch (e) {
      console.error(`Failed to delete course ${id}`, e);
      throw e;
    }
  }

  /**
   * Xóa nhiều course song song
   */
  static async deleteBulk(ids: string[]): Promise<void> {
    try {
      await Promise.all(ids.map((id) => this.delete(id)));
    } catch (e) {
      console.error('Failed to delete bulk courses', e);
      throw e;
    }
  }
}
