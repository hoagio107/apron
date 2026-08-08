import { getStorageProvider } from '../storage';
import type { MealPlan } from '../types/recipe';

const MEAL_PLANS_DIR = 'meal_plans';

export class MealPlanRepository {
  /**
   * Khởi tạo thư mục chứa meal plans nếu chưa có
   */
  static async init(): Promise<void> {
    const storage = getStorageProvider();
    try {
      if (!(await storage.exists(MEAL_PLANS_DIR))) {
        await storage.mkdir(MEAL_PLANS_DIR);
      }
    } catch (e) {
      console.error('Failed to init meal plans directory', e);
    }
  }

  /**
   * Lấy MealPlan cho một ngày cụ thể
   * @param date Chuỗi ngày theo định dạng YYYY-MM-DD
   */
  static async getByDate(date: string): Promise<MealPlan | null> {
    const storage = getStorageProvider();
    try {
      const path = `${MEAL_PLANS_DIR}/${date}.json`;
      if (!(await storage.exists(path))) return null;
      
      
      const content = await storage.readTextFile(path);
      const plan = JSON.parse(content) as MealPlan;
      return plan;
    } catch (e) {
      console.error(`Failed to get meal plan for date ${date}`, e);
      return null;
    }
  }

  /**
   * Lấy danh sách MealPlan trong một khoảng thời gian
   */
  static async getInRange(startDate: string, endDate: string): Promise<MealPlan[]> {
    const storage = getStorageProvider();
    const mealPlans: MealPlan[] = [];
    try {
      if (!(await storage.exists(MEAL_PLANS_DIR))) return mealPlans;

      const files = await storage.readDir(MEAL_PLANS_DIR);
      for (const file of files) {
        if (!file.isDirectory && file.name.endsWith('.json')) {
          const dateStr = file.name.replace('.json', '');
          // Simple string comparison works for YYYY-MM-DD format
          if (dateStr >= startDate && dateStr <= endDate) {
            try {
              const content = await storage.readTextFile(`${MEAL_PLANS_DIR}/${file.name}`);
              const plan = JSON.parse(content) as MealPlan;
              mealPlans.push(plan);
            } catch (e) {
              console.error(`Failed to parse meal plan ${file.name}`, e);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to get meal plans in range', e);
    }
    
    return mealPlans.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Lưu hoặc cập nhật một MealPlan
   */
  static async save(mealPlan: MealPlan): Promise<void> {
    const storage = getStorageProvider();
    try {
      await this.init();
      
      if (!mealPlan.id) {
        mealPlan.id = crypto.randomUUID();
      }

      const path = `${MEAL_PLANS_DIR}/${mealPlan.date}.json`;
      await storage.writeTextFile(path, JSON.stringify(mealPlan, null, 2));
    } catch (e) {
      console.error(`Failed to save meal plan for ${mealPlan.date}`, e);
      throw e;
    }
  }

  /**
   * Xoá một MealPlan
   */
  static async delete(date: string): Promise<void> {
    const storage = getStorageProvider();
    try {
      const path = `${MEAL_PLANS_DIR}/${date}.json`;
      if (await storage.exists(path)) {
        await storage.removeFile(path);
      }
    } catch (e) {
      console.error(`Failed to delete meal plan for ${date}`, e);
      throw e;
    }
  }
}
