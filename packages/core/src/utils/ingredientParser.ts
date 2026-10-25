export const CATEGORIES = {
  VEGGIES: 'Rau củ quả',
  MEAT_SEAFOOD: 'Thịt cá & Hải sản',
  DAIRY_EGGS: 'Trứng & Bơ sữa',
  SPICES_SAUCES: 'Gia vị & Nước sốt',
  GRAINS_CARBS: 'Ngũ cốc & Tinh bột',
  OTHERS: 'Khác'
} as const;

export function autoCategorizeIngredient(name: string): string {
  const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Multi-word / distinct priority matches first
  if (normalized.includes('trung') || normalized.includes('pho mai') || normalized.includes('sua chua')) {
    return CATEGORIES.DAIRY_EGGS;
  }
  if (normalized.includes('ca chua') || normalized.includes('ca rot') || normalized.includes('ca phao') || normalized.includes('ca tim')) {
    return CATEGORIES.VEGGIES;
  }

  const veggies = ['rau', 'hanh', 'toi', 'sa', 'gung', 'ot', 'khoai', 'nam', 'chanh', 'dua', 'chuoi', 'tao', 'ngo', 'xom', 'xa lach', 'bap cai', 'sup lo', 'bap', 'bi dao', 'bi do'];
  const dairyEggs = ['sua', 'cheese', 'butter', 'kem', 'yogurt'];
  const meatSeafood = ['thit', 'ca', 'bo', 'heo', 'lon', 'ga', 'vit', 'tom', 'cua', 'muc', 'ngheu', 'oc', 'cha', 'xuc xich', 'luon', 'ngao', 'hau', 'bach tuoc', 'xuong', 'gio', 'moc'];
  const spicesSauces = ['mam', 'muoi', 'tieu', 'duong', 'bot ngot', 'hat nem', 'tuong', 'dau', 'giam', 'mayonnaise', 'sot', 'mu tat', 'bot canh', 'dau hao', 'sa te', 'nuoc tuong', 'nuoc mam', 'dam', 'bot toi', 'ngu vi huong'];
  const grainsCarbs = ['gao', 'bun', 'pho', 'mi', 'mien', 'banh', 'bot', 'yen mach', 'xoi', 'chao', 'hu tiu', 'nui'];

  const words = normalized.split(/\s+/);
  const matchKeywords = (keywords: string[]) => keywords.some(kw => {
    if (kw.includes(' ')) return normalized.includes(kw);
    return words.includes(kw) || (kw.length >= 3 && normalized.includes(kw));
  });

  if (matchKeywords(veggies)) return CATEGORIES.VEGGIES;
  if (matchKeywords(dairyEggs)) return CATEGORIES.DAIRY_EGGS;
  if (matchKeywords(meatSeafood)) return CATEGORIES.MEAT_SEAFOOD;
  if (matchKeywords(spicesSauces)) return CATEGORIES.SPICES_SAUCES;
  if (matchKeywords(grainsCarbs)) return CATEGORIES.GRAINS_CARBS;

  return CATEGORIES.OTHERS;
}
