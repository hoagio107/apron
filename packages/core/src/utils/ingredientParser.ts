export const CATEGORIES = {
  VEGGIES: 'Rau củ quả',
  MEAT_SEAFOOD: 'Thịt cá & Hải sản',
  DAIRY_EGGS: 'Trứng & Bơ sữa',
  SPICES_SAUCES: 'Gia vị & Nước sốt',
  GRAINS_CARBS: 'Ngũ cốc & Tinh bột',
  OTHERS: 'Khác'
} as const;

export function autoCategorizeIngredient(name: string): string {
  const lower = name.toLowerCase().trim();
  const normalized = lower
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();

  // Multi-word / distinct priority matches first
  if (lower.includes('bơ')) {
    if (lower.includes('quả bơ') || lower.includes('trái bơ')) {
      return CATEGORIES.VEGGIES;
    }
    return CATEGORIES.DAIRY_EGGS;
  }
  if (normalized.includes('trung') || normalized.includes('pho mai') || normalized.includes('sua chua')) {
    return CATEGORIES.DAIRY_EGGS;
  }
  if (normalized.includes('ca chua') || normalized.includes('ca rot') || normalized.includes('ca phao') || normalized.includes('ca tim')) {
    return CATEGORIES.VEGGIES;
  }
  if (normalized.startsWith('thit') || normalized.includes(' thit')) {
    return CATEGORIES.MEAT_SEAFOOD;
  }

  const meatSeafood = ['thit', 'ca', 'bo', 'heo', 'lon', 'ga', 'vit', 'tom', 'cua', 'muc', 'ngheu', 'oc', 'cha', 'xuc xich', 'luon', 'ngao', 'hau', 'bach tuoc', 'xuong', 'gio', 'moc'];
  const veggies = ['rau', 'hanh', 'toi', 'sa', 'gung', 'ot', 'khoai', 'nam', 'chanh', 'dua', 'chuoi', 'tao', 'ngo', 'xom', 'xa lach', 'bap cai', 'sup lo', 'bap', 'bi dao', 'bi do'];
  const dairyEggs = ['sua', 'cheese', 'butter', 'kem', 'yogurt'];
  const spicesSauces = ['mam', 'muoi', 'tieu', 'duong', 'bot ngot', 'hat nem', 'tuong', 'dau', 'giam', 'mayonnaise', 'sot', 'mu tat', 'bot canh', 'dau hao', 'sa te', 'nuoc tuong', 'nuoc mam', 'dam', 'bot toi', 'ngu vi huong'];
  const grainsCarbs = ['gao', 'bun', 'pho', 'mi', 'mien', 'banh', 'bot', 'yen mach', 'xoi', 'chao', 'hu tiu', 'nui'];

  const words = normalized.split(/\s+/);
  const matchKeywords = (keywords: string[]) => keywords.some(kw => {
    if (kw.includes(' ')) return normalized.includes(kw);
    return words.includes(kw) || (kw.length >= 3 && normalized.includes(kw));
  });

  if (matchKeywords(meatSeafood) && (words.includes('thit') || words.includes('ca') || words.includes('tom') || words.includes('ga') || words.includes('heo') || words.includes('bo'))) {
    return CATEGORIES.MEAT_SEAFOOD;
  }
  if (matchKeywords(veggies)) return CATEGORIES.VEGGIES;
  if (matchKeywords(dairyEggs)) return CATEGORIES.DAIRY_EGGS;
  if (matchKeywords(meatSeafood)) return CATEGORIES.MEAT_SEAFOOD;
  if (matchKeywords(spicesSauces)) return CATEGORIES.SPICES_SAUCES;
  if (matchKeywords(grainsCarbs)) return CATEGORIES.GRAINS_CARBS;

  return CATEGORIES.OTHERS;
}

export interface ParsedIngredientLine {
  quantity?: number;
  unit?: string;
  name: string;
  group: string;
}

export function parseIngredientLine(raw: string): ParsedIngredientLine {
  const line = raw.trim();
  if (!line) {
    return { name: '', group: CATEGORIES.OTHERS };
  }

  const fractionRegex = /^(\d+)\/(\d+)\s*(.*)$/;
  const numberRegex = /^(\d+(?:[.,]\d+)?)\s*(.*)$/;

  let quantity: number | undefined;
  let remaining = line;

  const fracMatch = line.match(fractionRegex);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    if (den !== 0) {
      quantity = Math.round((num / den) * 100) / 100;
      remaining = fracMatch[3].trim();
    }
  } else {
    const numMatch = line.match(numberRegex);
    if (numMatch) {
      quantity = parseFloat(numMatch[1].replace(',', '.'));
      remaining = numMatch[2].trim();
    }
  }

  const commonUnits = [
    'muỗng cà phê', 'muỗng canh', 'thìa cà phê', 'thìa canh', 'thìa súp',
    'kg', 'g', 'gram', 'lít', 'lit', 'ml', 'l',
    'quả', 'trái', 'củ', 'bó', 'nhánh', 'tép', 'lát', 'miếng', 'lon', 'gói', 'hộp', 'chén', 'bát', 'ly',
    'cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'clove', 'cloves', 'slice', 'slices', 'pinch'
  ];

  let unit: string | undefined;
  let name = remaining;

  for (const u of commonUnits) {
    const lowerRemaining = remaining.toLowerCase();
    if (lowerRemaining.startsWith(u + ' ') || lowerRemaining === u) {
      unit = u;
      name = remaining.slice(u.length).trim();
      break;
    }
  }

  if (!name && unit) {
    name = unit;
    unit = undefined;
  }

  return {
    quantity,
    unit,
    name: name || remaining,
    group: autoCategorizeIngredient(name || remaining)
  };
}
