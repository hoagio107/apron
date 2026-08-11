export const CATEGORIES = {
  VEGGIES: 'Rau củ quả',
  MEAT_SEAFOOD: 'Thịt cá & Hải sản',
  DAIRY_EGGS: 'Trứng & Bơ sữa',
  SPICES_SAUCES: 'Gia vị & Nước sốt',
  GRAINS_CARBS: 'Ngũ cốc & Tinh bột',
  OTHERS: 'Khác'
} as const;

export function autoCategorizeIngredient(name: string): string {
  const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const veggies = ['rau', 'hanh', 'toi', 'sa', 'gung', 'ot', 'ca chua', 'ca rot', 'khoai', 'nam', 'chanh', 'dua', 'chuoi', 'tao', 'ngo', 'xom', 'xa lach', 'bap cai', 'sup lo', 'bap', 'ngam', 'bi dao', 'bi do'];
  const meatSeafood = ['thit', 'ca', 'bo', 'heo', 'lon', 'ga', 'vit', 'tom', 'cua', 'muc', 'ngheu', 'oc', 'cha', 'xuc xich', 'luon', 'ngao', 'hau', 'bach tuoc', 'xuong', 'gio', 'moc'];
  const dairyEggs = ['trung', 'sua', 'pho mai', 'bo', 'cheese', 'butter', 'kem', 'yogurt', 'sua chua'];
  const spicesSauces = ['mam', 'muoi', 'tieu', 'duong', 'bot ngot', 'hat nem', 'tuong', 'dau', 'giam', 'mayonnaise', 'sot', 'mu tat', 'bot canh', 'dau hao', 'sa te', 'nuoc tuong', 'nuoc mam', 'dam', 'bot toi', 'ngu vi huong'];
  const grainsCarbs = ['gao', 'bun', 'pho', 'mi', 'mien', 'banh', 'bot', 'yen mach', 'xoi', 'chao', 'hu tiu', 'nui'];

  const matchKeywords = (keywords: string[]) => keywords.some(kw => normalized.includes(kw));

  if (matchKeywords(meatSeafood)) return CATEGORIES.MEAT_SEAFOOD;
  if (matchKeywords(veggies)) return CATEGORIES.VEGGIES;
  if (matchKeywords(dairyEggs)) return CATEGORIES.DAIRY_EGGS;
  if (matchKeywords(spicesSauces)) return CATEGORIES.SPICES_SAUCES;
  if (matchKeywords(grainsCarbs)) return CATEGORIES.GRAINS_CARBS;

  return CATEGORIES.OTHERS;
}
