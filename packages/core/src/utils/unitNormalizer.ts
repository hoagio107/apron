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
  'chút xíu': 'chút xíu',
  'chut xiu': 'chút xíu',
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

const EXTRA_PURE_UNITS: string[] = [
  'chai',
  'lọ',
  'hũ',
  'khay',
  'túi',
  'bịch',
  'thùng',
  'đĩa',
  'phần',
  'con',
  'cây',
  'bắp',
  'lá',
  'cọng',
  'vắt',
  'giọt',
  'nhúm',
  'muỗng',
  'thìa'
];

const UNIT_PREP_ACTION_REGEX =
  /\b(cắt|thái|băm|xay|nạo|rửa|luộc|ngâm|bóc|lột|đập|dập|ướp|chia|rang|nướng|chiên|xào|hấp|nhuyễn|mỏng|dày|nhỏ|to|lớn|chín|tươi|khô)\b/i;

const SORTED_UNIT_PREFIXES: string[] = Array.from(
  new Set([
    ...Object.keys(UNIT_MAP),
    ...Object.values(UNIT_MAP),
    ...DEFAULT_COOKING_UNITS,
    ...EXTRA_PURE_UNITS
  ])
).sort((a, b) => b.length - a.length);

const KNOWN_PURE_UNITS_LOWER = new Set(SORTED_UNIT_PREFIXES.map((u) => u.toLowerCase()));

/**
 * Tách đơn vị đo lường thuần túy khỏi phần văn bản bị lẫn (tên nguyên liệu hoặc sơ chế).
 * Ví dụ:
 * - "g nước tương" -> { unit: "g", extra: "nước tương" }
 * - "mc nước tương" -> { unit: "muỗng canh", extra: "nước tương" }
 * - "quả đập dập" -> { unit: "quả", extra: "đập dập" }
 */
export function splitUnitAndExtra(rawUnit?: string | null): { unit: string; extra: string } {
  if (!rawUnit) return { unit: '', extra: '' };
  const cleaned = rawUnit
    .trim()
    .replace(/^[\d.,/]+\s*/, '')
    .trim();
  if (!cleaned) return { unit: '', extra: '' };

  const lower = cleaned.toLowerCase();

  // 1. Khớp hoàn toàn với đơn vị chuẩn hoặc từ điển quy đổi
  if (UNIT_MAP[lower]) {
    return { unit: UNIT_MAP[lower], extra: '' };
  }
  if (KNOWN_PURE_UNITS_LOWER.has(lower)) {
    return { unit: lower, extra: '' };
  }

  // 2. Bắt đầu bằng một đơn vị đã biết, theo sau là khoảng trắng/dấu câu và phần dư
  // (VD: "g nước tương", "mc nước tương", "quả đập dập", "tép (băm nhỏ)")
  for (const prefix of SORTED_UNIT_PREFIXES) {
    const pLower = prefix.toLowerCase();
    if (lower.startsWith(pLower) && lower.length > pLower.length) {
      const rest = cleaned.slice(pLower.length);
      if (/^[\s,.;:()\-/]+/.test(rest)) {
        const canonicalUnit = UNIT_MAP[pLower] || pLower;
        const extra = rest.replace(/^[\s,.;:()\-/]+|[\s,.;:()\-/]+$/g, '').trim();
        return { unit: canonicalUnit, extra };
      }
    }
  }

  // 3. Nếu không khớp đơn vị nào nhưng lại chứa từ chỉ hành động sơ chế (VD: "đập dập", "thái lát")
  if (UNIT_PREP_ACTION_REGEX.test(lower)) {
    return { unit: '', extra: cleaned };
  }

  // 4. Đơn vị hợp lệ thông thường chỉ dài tối đa 2 từ; nếu > 2 từ thì khả năng cao là cụm từ bị lỗi
  const wordCount = cleaned.split(/\s+/).length;
  if (wordCount > 2) {
    return { unit: '', extra: cleaned };
  }

  return { unit: cleaned, extra: '' };
}

/**
 * Chuẩn hóa một chuỗi đơn vị đo lường bất kỳ về đơn vị chuẩn thuần túy
 */
export function normalizeUnit(rawUnit?: string | null): string {
  return splitUnitAndExtra(rawUnit).unit;
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

export interface RawIngredientUnitHolder {
  unit?: string | null;
}

export interface RawRecipeUnitSource {
  ingredientSections?: {
    ingredients?: RawIngredientUnitHolder[];
  }[];
  ingredients?: RawIngredientUnitHolder[];
}

/**
 * Trích xuất và chuẩn hóa tất cả các đơn vị duy nhất từ một hoặc nhiều công thức (dạng thô từ AI hoặc Form)
 */
export function extractAndNormalizeUnits(
  recipesOrRecipe?: RawRecipeUnitSource | RawRecipeUnitSource[] | null
): string[] {
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
