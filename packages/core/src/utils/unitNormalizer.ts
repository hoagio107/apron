/**
 * Apron Core - Unit Normalizer & Standardizer
 * Chịu trách nhiệm chuẩn hóa đơn vị đo lường ẩm thực Việt Nam và quốc tế,
 * phân loại danh mục đơn vị và trích xuất đơn vị từ dữ liệu công thức.
 */

export const UNIT_CATEGORIES = [
  'Khối lượng',
  'Thể tích',
  'Số lượng / Đếm',
  'Đóng gói & Khác'
] as const;

export type UnitCategory = typeof UNIT_CATEGORIES[number];

/**
 * Bản đồ quy đổi các biến thể viết tắt / từ địa phương / tiếng Anh về đơn vị chuẩn tiếng Việt
 */
export const UNIT_MAP: Record<string, string> = {
  // Muỗng canh
  'mc': 'muỗng canh',
  'thìa canh': 'muỗng canh',
  'thìa súp': 'muỗng canh',
  'muong canh': 'muỗng canh',
  'tbsp': 'muỗng canh',
  'tbs': 'muỗng canh',
  'tablespoon': 'muỗng canh',
  'tablespoons': 'muỗng canh',

  // Muỗng cà phê
  'mcf': 'muỗng cà phê',
  'cf': 'muỗng cà phê',
  'muỗng cf': 'muỗng cà phê',
  'muon cf': 'muỗng cà phê',
  'muong cf': 'muỗng cà phê',
  'muong ca phe': 'muỗng cà phê',
  'thìa cà phê': 'muỗng cà phê',
  'thìa cafe': 'muỗng cà phê',
  'thìa cf': 'muỗng cà phê',
  'tsp': 'muỗng cà phê',
  'teaspoon': 'muỗng cà phê',
  'teaspoons': 'muỗng cà phê',

  // Trọng lượng
  'gr': 'g',
  'gram': 'g',
  'grams': 'g',
  'gam': 'g',
  'kilo': 'kg',
  'kilogram': 'kg',
  'kilograms': 'kg',
  'kgs': 'kg',
  'lạng': 'lạng',
  'lang': 'lạng',
  'cân': 'kg',
  'can': 'kg',
  'mg': 'mg',
  'miligram': 'mg',
  'oz': 'oz',
  'ounce': 'oz',
  'ounces': 'oz',
  'lb': 'lb',
  'lbs': 'lb',
  'pound': 'lb',
  'pounds': 'lb',

  // Thể tích
  'l': 'lít',
  'lit': 'lít',
  'liter': 'lít',
  'liters': 'lít',
  'ml': 'ml',
  'mililit': 'ml',
  'milliliter': 'ml',
  'milliliters': 'ml',
  'cc': 'ml',
  'cup': 'cup',
  'cups': 'cup',

  // Đơn vị đếm & gia vị (chuẩn hóa dấu tiếng Việt nếu AI trả về không dấu)
  'qua': 'quả',
  'trai': 'trái',
  'cu': 'củ',
  'cai': 'cái',
  'bo': 'bó',
  'nhanh': 'nhánh',
  'tep': 'tép',
  'lat': 'lát',
  'mieng': 'miếng',
  'khoanh': 'khoanh',
  'khuc': 'khúc',
  'khúc': 'khúc',
  'chen': 'chén',
  'bat': 'bát',
  'ly': 'ly',
  'lon': 'lon',
  'hop': 'hộp',
  'goi': 'gói',
  'chut': 'chút',
  'xiu': 'xíu',
  'xiu xiu': 'xíu xiu',
  'it': 'ít'
};

/**
 * Danh sách đơn vị nấu ăn phổ biến mặc định
 */
export const DEFAULT_COOKING_UNITS: string[] = [
  'g',
  'kg',
  'ml',
  'lít',
  'muỗng canh',
  'muỗng cà phê',
  'quả',
  'trái',
  'củ',
  'cái',
  'bó',
  'nhánh',
  'tép',
  'lát',
  'miếng',
  'khoanh',
  'khúc',
  'chén',
  'bát',
  'lon',
  'hộp',
  'gói',
  'chút',
  'xíu'
];

/**
 * Chuẩn hóa một chuỗi đơn vị đo lường bất kỳ về đơn vị chuẩn
 */
export function normalizeUnit(rawUnit?: string | null): string {
  if (!rawUnit) return '';
  const trimmed = rawUnit.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  return UNIT_MAP[lower] || trimmed;
}

/**
 * Tự động nhận diện nhóm phân loại của đơn vị tính
 */
export function detectUnitCategory(name: string): UnitCategory {
  const norm = name.toLowerCase().trim();
  const weight = ['g', 'gam', 'gram', 'kg', 'kilogam', 'lạng', 'cân', 'oz', 'lb', 'pound', 'mg'];
  const packaging = ['gói', 'hộp', 'lon', 'chai', 'khay', 'túi', 'đĩa', 'phần', 'bịch', 'thùng', 'lọ', 'hũ'];
  const count = ['quả', 'trái', 'củ', 'bắp', 'tép', 'nhánh', 'cây', 'bó', 'lát', 'miếng', 'con', 'khúc', 'khoanh', 'cái'];
  const volume = ['ml', 'l', 'lít', 'lit', 'muỗng', 'thìa', 'tbsp', 'tsp', 'cup', 'chén', 'bát', 'giọt', 'ly'];

  const isMatch = (keywords: string[]) =>
    keywords.some(k => norm === k || norm.startsWith(k + ' ') || (k.length > 2 && norm.includes(k)));

  if (isMatch(weight)) return 'Khối lượng';
  if (isMatch(packaging)) return 'Đóng gói & Khác';
  if (isMatch(count)) return 'Số lượng / Đếm';
  if (isMatch(volume)) return 'Thể tích';

  return 'Số lượng / Đếm';
}

/**
 * Trích xuất và chuẩn hóa tất cả các đơn vị duy nhất từ một hoặc nhiều công thức (dạng thô từ AI hoặc Form)
 */
export function extractAndNormalizeUnits(recipesOrRecipe: any): string[] {
  if (!recipesOrRecipe) return [];
  const list = Array.isArray(recipesOrRecipe) ? recipesOrRecipe : [recipesOrRecipe];
  const unitSet = new Set<string>();

  for (const item of list) {
    if (!item) continue;

    // Xét ingredientSections
    if (Array.isArray(item.ingredientSections)) {
      for (const sec of item.ingredientSections) {
        if (sec && Array.isArray(sec.ingredients)) {
          for (const ing of sec.ingredients) {
            if (ing && ing.unit) {
              const norm = normalizeUnit(ing.unit);
              if (norm) unitSet.add(norm);
            }
          }
        }
      }
    }

    // Xét mảng phẳng ingredients
    if (Array.isArray(item.ingredients)) {
      for (const ing of item.ingredients) {
        if (ing && ing.unit) {
          const norm = normalizeUnit(ing.unit);
          if (norm) unitSet.add(norm);
        }
      }
    }
  }

  return Array.from(unitSet);
}
