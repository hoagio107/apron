import { getStorageProvider } from '../storage';

const MOCK_COURSE_IDS = [
  'course-knife-skills',
  'course-sourdough-baking',
  'course-broth-mastery'
];

const MOCK_TIP_IDS = [
  'tip-chon-xuong-bo',
  'tip-giu-bo-sap',
  'tip-uop-thit-nuong'
];

const MOCK_RECIPE_IDS = [
  'recipe-pho-bo-gia-truyen',
  'recipe-salad-ga-nuong-bo-qua',
  'recipe-suon-xao-chua-ngot',
  'recipe-ca-hoi-ap-chao-bo-chanh',
  'recipe-canh-suon-ham-rau-cu',
  'recipe-bo-kho-banh-mi-sai-gon',
  'recipe-ca-hoi-nuong-noi-chien'
];

/**
 * Quét sạch toàn bộ dữ liệu mẫu cũ từng được tạo trên thiết bị (Sổ tay, Mẹo, Đơn vị, Công thức)
 */
export async function purgeAllLegacyMockData(): Promise<void> {
  const storage = getStorageProvider();

  // 1. Dọn dẹp mock courses
  try {
    for (const id of MOCK_COURSE_IDS) {
      const path = `courses/${id}.json`;
      if (await storage.exists(path)) {
        await storage.deleteFile(path);
      }
    }
    if (await storage.exists('courses')) {
      const files = await storage.readDir('courses');
      for (const f of files) {
        if (MOCK_COURSE_IDS.some(mId => f.name.includes(mId))) {
          await storage.deleteFile(`courses/${f.name}`).catch(() => {});
        }
      }
    }
  } catch (e) {
    console.warn('purge courses error:', e);
  }

  // 2. Dọn dẹp mock tips
  try {
    for (const id of MOCK_TIP_IDS) {
      const path = `tips/${id}.json`;
      if (await storage.exists(path)) {
        await storage.deleteFile(path);
      }
    }
    if (await storage.exists('tips')) {
      const files = await storage.readDir('tips');
      for (const f of files) {
        if (MOCK_TIP_IDS.some(mId => f.name.includes(mId))) {
          await storage.deleteFile(`tips/${f.name}`).catch(() => {});
        }
      }
    }
  } catch (e) {
    console.warn('purge tips error:', e);
  }

  // 3. Dọn dẹp mock recipes
  try {
    for (const id of MOCK_RECIPE_IDS) {
      const path = `recipes/${id}.json`;
      if (await storage.exists(path)) {
        await storage.deleteFile(path);
      }
    }
  } catch (e) {
    console.warn('purge recipes error:', e);
  }

  // 4. Dọn dẹp localStorage cho units & course notes
  if (typeof localStorage !== 'undefined') {
    try {
      const rawUnits = localStorage.getItem('apron-unit-storage');
      if (rawUnits) {
        const parsed = JSON.parse(rawUnits);
        if (parsed?.state?.units) {
          const legacyIds = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14']);
          parsed.state.units = parsed.state.units.filter((u: any) => !legacyIds.has(String(u.id)));
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
