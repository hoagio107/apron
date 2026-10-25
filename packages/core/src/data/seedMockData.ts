import type { Recipe } from '../types/recipe';

/**
 * Danh sách dữ liệu mẫu ban đầu (đã dọn sạch hoàn toàn theo yêu cầu người dùng).
 */
export const INITIAL_MOCK_RECIPES: Recipe[] = [];

/**
 * Chức năng nạp dữ liệu mẫu - đã vô hiệu hoá hoàn toàn theo yêu cầu.
 */
export async function seedMockData(): Promise<void> {
  // Đã tắt hoàn toàn nạp dữ liệu mẫu
}
