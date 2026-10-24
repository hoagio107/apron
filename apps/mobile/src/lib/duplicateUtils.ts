import type { Recipe } from '@apron/core';

/**
 * Chuẩn hóa tên món ăn để so sánh trùng lặp:
 * - Chuyển chữ thường
 * - Bỏ khoảng trắng thừa ở đầu, cuối và giữa các từ
 * - Chuẩn hóa unicode NFC
 */
export function normalizeRecipeTitle(title: string): string {
  if (!title) return '';
  return title
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/\s+/g, ' ');
}

export interface DuplicateStats {
  /** Tập hợp ID của TẤT CẢ các công thức bị trùng tên */
  duplicateRecipeIds: Set<string>;
  /** Tập hợp ID của các bản sao cũ hơn (để tự động xoá, giữ lại 1 bản ghi tốt nhất) */
  redundantRecipeIds: Set<string>;
  /** Danh sách các nhóm trùng (mỗi nhóm gồm >= 2 công thức cùng tên) */
  duplicateGroups: { title: string; normalizedTitle: string; recipes: Recipe[] }[];
  /** Tổng số công thức bị trùng */
  totalDuplicates: number;
  /** Số nhóm món trùng tên */
  groupsCount: number;
}

/**
 * Phân tích và tìm tất cả các món ăn trùng tên trong danh sách
 */
export function getRecipeDuplicateStats(recipes: Recipe[]): DuplicateStats {
  const groupMap = new Map<string, { title: string; recipes: Recipe[] }>();

  recipes.forEach((r) => {
    // Bỏ qua các món biến thể (child recipe có parent_id)
    if (r.parent_id) return;

    const normalized = normalizeRecipeTitle(r.title);
    if (!normalized) return;

    const group = groupMap.get(normalized);
    if (group) {
      group.recipes.push(r);
    } else {
      groupMap.set(normalized, { title: r.title, recipes: [r] });
    }
  });

  const duplicateGroups: { title: string; normalizedTitle: string; recipes: Recipe[] }[] = [];
  const duplicateRecipeIds = new Set<string>();
  const redundantRecipeIds = new Set<string>();

  groupMap.forEach(({ title, recipes: groupRecipes }, normalizedTitle) => {
    if (groupRecipes.length > 1) {
      // Sắp xếp các công thức trong cùng một nhóm:
      // Ưu tiên món có nhiều thông tin hơn (ảnh, nguyên liệu, hướng dẫn) hoặc món tạo mới hơn
      groupRecipes.sort((a, b) => {
        const getStepsCount = (r: Recipe) => (r.steps?.length ?? (r as any).instructions?.length ?? 0);
        const scoreA = (a.image_url ? 2 : 0) + (a.ingredients?.length ?? 0) + getStepsCount(a);
        const scoreB = (b.image_url ? 2 : 0) + (b.ingredients?.length ?? 0) + getStepsCount(b);
        if (scoreB !== scoreA) return scoreB - scoreA;

        const timeA = new Date(a.created_at ?? 0).getTime();
        const timeB = new Date(b.created_at ?? 0).getTime();
        return timeB - timeA;
      });

      duplicateGroups.push({
        title,
        normalizedTitle,
        recipes: groupRecipes,
      });

      groupRecipes.forEach((r) => {
        if (r.id) duplicateRecipeIds.add(r.id);
      });

      // Các công thức từ vị trí thứ 1 trở đi được xem là bản sao thừa
      for (let i = 1; i < groupRecipes.length; i++) {
        const rec = groupRecipes[i];
        if (rec.id) {
          redundantRecipeIds.add(rec.id);
        }
      }
    }
  });

  return {
    duplicateRecipeIds,
    redundantRecipeIds,
    duplicateGroups,
    totalDuplicates: duplicateRecipeIds.size,
    groupsCount: duplicateGroups.length,
  };
}

/**
 * Tự động lọc danh sách công thức, giữ lại 1 bản ghi tốt nhất cho mỗi tên món
 * và trả về danh sách ID các bản sao dư thừa để dọn dẹp khỏi database.
 */
export function deduplicateRecipes(recipes: Recipe[]): {
  uniqueRecipes: Recipe[];
  redundantRecipeIds: string[];
} {
  const stats = getRecipeDuplicateStats(recipes);
  const redundantSet = stats.redundantRecipeIds;
  return {
    uniqueRecipes: recipes.filter((r) => r.id && !redundantSet.has(r.id)),
    redundantRecipeIds: Array.from(redundantSet),
  };
}

/**
 * Kiểm tra xem tên công thức đã tồn tại trong danh sách công thức chưa
 * (dùng để cảnh báo ngay lập tức trên Recipe Form)
 */
export function findDuplicateRecipe(
  title: string,
  recipes: Recipe[],
  currentRecipeId?: string
): Recipe | null {
  const normalized = normalizeRecipeTitle(title);
  if (!normalized || normalized.length < 2) return null;

  return (
    recipes.find(
      (r) =>
        r.id !== currentRecipeId &&
        !r.parent_id &&
        normalizeRecipeTitle(r.title) === normalized
    ) ?? null
  );
}
