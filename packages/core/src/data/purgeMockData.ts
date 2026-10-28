import { CourseRepository } from '../db/course-repository';
import { RecipeRepository } from '../db/recipe-repository';
import { TipRepository } from '../db/tip-repository';

const MOCK_COURSE_IDS = [
  'course-knife-skills',
  'course-sourdough-baking',
  'course-broth-mastery',
];

const MOCK_TIP_IDS = [
  'tip-chon-xuong-bo',
  'tip-giu-bo-sap',
  'tip-uop-thit-nuong',
];

const MOCK_RECIPE_IDS = [
  'recipe-pho-bo-gia-truyen',
  'recipe-salad-ga-nuong-bo-qua',
  'recipe-suon-xao-chua-ngot',
  'recipe-ca-hoi-ap-chao-bo-chanh',
  'recipe-canh-suon-ham-rau-cu',
  'recipe-bo-kho-banh-mi-sai-gon',
  'recipe-ca-hoi-nuong-noi-chien',
];

/**
 * Quét sạch toàn bộ dữ liệu mẫu cũ từng được tạo trên thiết bị (Sổ tay, Mẹo, Đơn vị, Công thức)
 * đồng thời cập nhật đồng bộ recipes_index.json
 */
export async function purgeAllLegacyMockData(): Promise<void> {
  await Promise.allSettled([
    CourseRepository.deleteBulk(MOCK_COURSE_IDS),
    TipRepository.deleteBulk(MOCK_TIP_IDS),
    RecipeRepository.deleteBulk(MOCK_RECIPE_IDS),
  ]);

  if (typeof localStorage !== 'undefined') {
    try {
      const rawUnits = localStorage.getItem('apron-unit-storage');
      if (rawUnits) {
        const parsed = JSON.parse(rawUnits);
        if (Array.isArray(parsed?.state?.units)) {
          const legacyIds = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14']);
          parsed.state.units = parsed.state.units.filter(
            (u: { id?: string | number }) => !legacyIds.has(String(u.id))
          );
          localStorage.setItem('apron-unit-storage', JSON.stringify(parsed));
        }
      }
      localStorage.removeItem('apron_mock_seeded');
      for (const id of MOCK_COURSE_IDS) {
        localStorage.removeItem(`course_progress_${id}`);
        localStorage.removeItem(`course_notes_${id}`);
      }
    } catch (e) {
      console.warn('purge localStorage error:', e);
    }
  }
}
