const fs = require('fs');
const path = require('path');

const RECIPES_DIR = 'P:/CookbookData/recipes';
const NOTION_DIR = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const INDEX_PATH = 'P:/CookbookData/recipes_index.json';

// ==========================================
// 1. JUNK & TIP FILES TO REMOVE FROM RECIPES
// ==========================================
const JUNK_FILES = new Set([
  'recipe-c-2d606928.json',
  'recipe-list-mon-c1f14b87.json',
  'recipe-vo-mat-ca-fbf18b7a.json',
  'recipe-thoi-gian-luoc-thit-0865d938.json',
  'recipe-thoi-gian-luoc-rau-9a31547d.json',
  'recipe-ra-dong-do-an-nhanh-4db083d1.json',
  'recipe-ra-dong-tom-b0028158.json',
  'recipe-giam-toc-do-chin-cua-chuoi-a73cc313.json',
  'recipe-meo-luoc-rau-cu-12e635ec.json',
  'recipe-cach-tinh-bmi-bmr-tdee-6f08cb9b.json',
  'recipe-cach-chuan-bi-bua-an-eat-clean-hieu-qua-de934fb1.json',
  'recipe-rua-mot-so-loai-thit-dc589959.json',
  'recipe-quy-trinh-so-che-rau-cu-qua-fe2893cc.json',
  'recipe-quy-trinh-so-che-dam-de025b60.json',
  'recipe-quy-trinh-tam-uop-dam-0e479225.json',
  'recipe-phong-chong-ngua-tay-khi-goi-rau-cu-c5688816.json',
  'recipe-phi-hanh-gion-b39a62fa.json',
  'recipe-noi-bat-dinh-chat-nhau-74ba66f6.json',
  'recipe-nau-com-445f250f.json',
  'recipe-nau-uc-ga-mem-mong-50e7d7b1.json',
  'recipe-nau-soup-khong-tach-nuoc-c5b5cd94.json',
  'recipe-nau-chao-khong-trao-6d473724.json',
  'recipe-nguyen-tac-chon-thuc-pham-eat-clean-023e61f0.json',
  'recipe-khi-sup-canh-bi-man-273ee8c4.json',
  'recipe-luoc-bau-khong-tham-776e544d.json',
  'recipe-hanh-tay-lam-moi-do-bep-45a5b26f.json',
  'recipe-giu-khoai-tay-khoi-nay-mam-7b8fd407.json',
  'recipe-gia-vi-f4bd6b65.json',
  'recipe-eat-clean-b0c7b9dd.json'
]);

// ==========================================
// 2. TAG MAPPINGS
// ==========================================
const TAG_MAP = {
  // Numeric IDs from DEFAULT_TAGS
  '1': 'Bữa sáng',
  '2': 'Điểm tâm',
  '3': 'Bánh mì',
  '4': 'Bữa chính',
  '5': 'Cơm gia đình',
  '6': 'Món tiệc',
  '7': 'Ăn vặt',
  '8': 'Đồ uống',
  '9': 'Tráng miệng',

  // Code Prefixes
  'dish-main': 'Món chính',
  'dish-noodle': 'Món nước',
  'dish-appetizer': 'Khai vị',
  'dish-sauce': 'Nước chấm / Sốt',
  'cuisine-vn-north': 'Miền Bắc',
  'cuisine-vn-central': 'Miền Trung',
  'cuisine-vn-south': 'Miền Nam',
  'cuisine-western': 'Âu Mỹ',
  'cuisine-korean': 'Hàn Quốc',
  'cuisine-japanese': 'Nhật Bản',
  'cook-soup': 'Canh / Súp',
  'cook-stew': 'Hầm / Ninh',
  'cook-braise': 'Kho / Om',
  'cook-steam': 'Hấp / Luộc',
  'cook-fry': 'Chiên / Rán',
  'cook-stir-fry': 'Xào',
  'cook-grill': 'Nướng',
  'cook-bake': 'Làm bánh',
  'ing-meat': 'Thịt các loại',
  'ing-pork': 'Thịt heo',
  'ing-beef': 'Thịt bò',
  'ing-chicken': 'Thịt gà',
  'ing-fish': 'Cá',
  'ing-shrimp': 'Tôm',
  'ing-seafood': 'Hải sản',
  'ing-veg': 'Rau củ',
  'ing-mushroom': 'Nấm',
  'ing-tofu': 'Đậu phụ',
  'diet-healthy': 'Eat Clean',
  'diet-vegan': 'Thuần chay',
  'diet-keto': 'Keto',
  'diet-weight': 'Giảm cân',
  'occasion-weekend': 'Cuối tuần',

  // Raw phrases with slashes or redundancies
  'Món kho/rim': 'Món kho',
  'Món kho / rim': 'Món kho',
  'rim': 'Món rim',
  'Món rang/chiên': 'Món chiên / rán',
  'Món rang': 'Món rang',
  'chiên': 'Món chiên / rán',
  'Món chiên / nướng / áp chảo': 'Chiên / Nướng',
  'Món hấp / luộc': 'Hấp / Luộc',
  'Món hấp/luộc': 'Hấp / Luộc',
  'Hấp/Luộc': 'Hấp / Luộc',
  'Xốt / Nước chấm / Gia vị': 'Nước chấm / Sốt',
  'Sốt và nước chấm': 'Nước chấm / Sốt',
  'Sốt/Kho/Rim': 'Nước chấm / Sốt',
  'Bữa sáng / phụ': 'Bữa sáng',
  'Bánh / Đồ ăn vặt': 'Ăn vặt',
  'Bánh ngọt': 'Bánh ngọt',
  'Bánh mặn': 'Bánh mặn',
  'Đồ muối/nộm': 'Nộm / Muối chua',
  'Món nộm / muối chua / ngâm': 'Nộm / Muối chua',
  'Xôi/Cháo/Soup': 'Cháo / Soup',
  'Món trộn / cuộn': 'Món cuốn / trộn',
  'Món cuộn': 'Món cuốn',
  'Món ăn vặt': 'Ăn vặt',
  'Bánh / Đồ ăn vặtCơ bản': 'Làm bánh'
};

function normalizeTag(rawTag, recipeTitle) {
  if (!rawTag) return [];
  const t = rawTag.trim();
  if (TAG_MAP[t]) return [TAG_MAP[t]];

  // Specific compound handling
  if (t === 'Bún/Miến/Mỳ/Phở/Canh' || t === 'Nui/Miến/Mì/Bún/Phở' || t === 'Bún / Mỳ / Phở / Miến ...') {
    const titleLower = (recipeTitle || '').toLowerCase();
    const result = ['Món nước'];
    if (titleLower.includes('phở')) result.push('Phở');
    else if (titleLower.includes('miến')) result.push('Miến');
    else if (titleLower.includes('mì') || titleLower.includes('mỳ') || titleLower.includes('spaghetti') || titleLower.includes('ramen')) result.push('Mì');
    else if (titleLower.includes('bún')) result.push('Bún');
    else if (titleLower.includes('nui')) result.push('Nui');
    else if (titleLower.includes('canh')) result.push('Canh');
    return result;
  }

  // Corrupted concatenation fixes
  if (t.includes('Món chiên / nướng / áp chảoMón kho / rim')) return ['Chiên / Nướng', 'Món kho'];
  if (t.includes('Bánh / Đồ ăn vặtMón kho / rim')) return ['Ăn vặt', 'Món kho'];
  if (t.includes('Bún / Mỳ / Phở / Miến ...Món chiên / nướng / áp chảo')) return ['Món nước', 'Chiên / Nướng'];
  if (t.includes('Bánh / Đồ ăn vặtCơ bảnMón chiên / nướng / áp chảo')) return ['Làm bánh', 'Chiên / Nướng'];
  if (t.includes('Món chiên / nướng / áp chảoMón hấp / luộcMón trộn / cuộn')) return ['Chiên / Nướng', 'Hấp / Luộc', 'Món cuốn / trộn'];
  if (t.includes('Món chiên / nướng / áp chảoMón hấp / luộc')) return ['Chiên / Nướng', 'Hấp / Luộc'];
  if (t.includes('Món chiên / nướng / áp chảoMón trộn / cuộn')) return ['Chiên / Nướng', 'Món cuốn / trộn'];
  if (t.includes('Bún / Mỳ / Phở / Miến ...Xốt / Nước chấm / Gia vị')) return ['Món nước', 'Nước chấm / Sốt'];
  if (t.includes('Bún / Mỳ / Phở / Miến ...Món kho / rim')) return ['Món nước', 'Món kho'];
  if (t.includes('Bún / Mỳ / Phở / Miến ...Món xào')) return ['Món nước', 'Xào'];

  // Age tags
  if (/^\d+M\+$/i.test(t)) return [t.toUpperCase()];

  // If contains slashes, pick clean parts
  if (t.includes('/')) {
    const parts = t.split('/').map(p => p.trim()).filter(Boolean);
    return [parts[0]];
  }

  return [t];
}

function cleanRecipeTags(rawTags, recipeTitle) {
  const result = new Set();
  for (const t of (rawTags || [])) {
    const norm = normalizeTag(t, recipeTitle);
    for (const item of norm) {
      if (item && item.length > 0 && !/^\d+$/.test(item) && !item.includes('...')) {
        result.add(item);
      }
    }
  }

  // Remove redundant generic parts if specific is already present
  // e.g. If has "Bún", don't need "Miến", "Mỳ", "Phở", "Canh" unless actually in title
  const titleLower = (recipeTitle || '').toLowerCase();
  ['Bún', 'Miến', 'Mỳ', 'Phở', 'Canh', 'Nui'].forEach(word => {
    if (result.has(word) && !titleLower.includes(word.toLowerCase())) {
      result.delete(word);
    }
  });

  return Array.from(result);
}

// ==========================================
// 3. UNIT & INGREDIENT NORMALIZATION
// ==========================================
const UNIT_MAP = {
  'gr': 'g', 'gram': 'g', 'grams': 'g', 'gam': 'g', 'kilo': 'kg', 'kilogram': 'kg',
  'lit': 'lít', 'liter': 'lít', 'l': 'lít', 'mililit': 'ml',
  'mc': 'muỗng canh', 'tbsp': 'muỗng canh', 'tbs': 'muỗng canh', 'thìa canh': 'muỗng canh', 'thìa súp': 'muỗng canh',
  'mcf': 'muỗng cà phê', 'tsp': 'muỗng cà phê', 'thìa cà phê': 'muỗng cà phê', 'thìa cafe': 'muỗng cà phê', 'cf': 'muỗng cà phê',
  'qua': 'quả', 'trai': 'trái', 'cu': 'củ', 'cai': 'cái', 'bo': 'bó', 'nhanh': 'nhánh', 'tep': 'tép',
  'lat': 'lát', 'mieng': 'miếng', 'chen': 'chén', 'bat': 'bát', 'lon': 'lon', 'hop': 'hộp', 'goi': 'gói',
  'khúc': 'khúc', 'nhúm': 'nhúm', 'ít': 'ít', 'chút': 'chút'
};

function normalizeUnit(u) {
  if (!u) return '';
  const lower = u.trim().toLowerCase();
  return UNIT_MAP[lower] || u.trim();
}

function cleanIngredient(ing) {
  let name = (ing.name || '').trim();
  let quantity = ing.quantity !== undefined ? ing.quantity : (ing.amount || 1);
  let unit = normalizeUnit(ing.unit || '');

  // Strip leading bullets/punctuation
  name = name.replace(/^[-–—:•*+\s]+/, '').replace(/[-–—:•*+\s]+$/, '');

  // Detect accidental embedded quantity/unit in name
  // e.g. "Tôm: 30gr (đã làm sạch)" or "500g thịt ba chỉ"
  const m1 = name.match(/^([^:\d]+):\s*(\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?)\s*(g|gr|kg|ml|lít|muỗng canh|muỗng cà phê|thìa canh|thìa cà phê|quả|trái|củ|miếng|lát|chén|bát)?(?:\s*\((.*?)\))?/i);
  if (m1) {
    name = m1[1].trim();
    if (m1[4]) name += ` (${m1[4]})`;
    if (!unit && m1[3]) unit = normalizeUnit(m1[3]);
    if (quantity === 1 || !quantity) {
      quantity = m1[2].includes('-') ? m1[2] : parseFloat(m1[2].replace(',', '.'));
    }
  }

  const m2 = name.match(/^(\d+(?:[.,]\d+)?)\s*(g|gr|kg|ml|lít|muỗng canh|muỗng cà phê|thìa canh|thìa cà phê|quả|trái|củ|miếng|lát|chén|bát)\s+(.*)$/i);
  if (m2) {
    if (!unit) unit = normalizeUnit(m2[2]);
    if (quantity === 1 || !quantity) quantity = parseFloat(m2[1].replace(',', '.'));
    name = m2[3].trim();
  }

  // Clean weird units like "trứng chiên"
  if (unit.includes('trứng')) {
    unit = 'quả';
  }

  return {
    name: name || 'Nguyên liệu',
    quantity: quantity || 1,
    unit: unit || '',
    ...(ing.group ? { group: ing.group } : {}),
    ...(ing.ingredient_id ? { ingredient_id: ing.ingredient_id } : {})
  };
}

module.exports = {
  JUNK_FILES,
  TAG_MAP,
  cleanRecipeTags,
  normalizeUnit,
  cleanIngredient
};
