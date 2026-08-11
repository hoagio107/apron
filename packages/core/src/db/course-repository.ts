import { getStorageProvider } from '../storage';
import type { Course } from '../types/recipe';

const COURSES_DIR = 'courses';

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
      for (const file of files) {
        if (!file.isDirectory && file.name.endsWith('.json')) {
          try {
            const content = await storage.readTextFile(`${COURSES_DIR}/${file.name}`);
            const course = JSON.parse(content) as Course;
            courses.push(course);
          } catch (e) {
            console.error(`Failed to parse course ${file.name}`, e);
          }
        }
      }
    } catch (e) {
      console.error('Failed to get all courses', e);
    }
    
    // Sort by created_at descending by default
    return courses.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
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
      return JSON.parse(content) as Course;
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
      // course.updated_at = now; // Course model may not have updated_at

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
   * Xóa nhiều course
   */
  static async deleteBulk(ids: string[]): Promise<void> {
    const storage = getStorageProvider();
    try {
      for (const id of ids) {
        const filePath = `${COURSES_DIR}/${id}.json`;
        if (await storage.exists(filePath)) {
          await storage.deleteFile(filePath);
        }
      }
    } catch (e) {
      console.error('Failed to delete bulk courses', e);
      throw e;
    }
  }
}
