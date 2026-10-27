const fs = require('fs');
const path = require('path');

const RECIPES_DIR = 'P:/CookbookData/recipes';
const NOTION_DIR = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

// 1. NON-RECIPE JUNK IDS TO REMOVE
const JUNK_IDS = new Set([
  'recipe-c-2d606928',
  'recipe-list-mon-c1f14b87',
  'recipe-vo-mat-ca-fbf18b7a',
  'recipe-thoi-gian-luoc-thit-0865d938',
  'recipe-thoi-gian-luoc-rau-9a31547d',
  'recipe-ra-dong-do-an-nhanh-4db083d1',
  'recipe-ra-dong-tom-b0028158',
  'recipe-giam-toc-do-chin-cua-chuoi-a73cc313',
  'recipe-meo-luoc-rau-cu-12e635ec',
  'recipe-cach-tinh-bmi-bmr-tdee-6f08cb9b',
  'recipe-cach-chuan-bi-bua-an-eat-clean-hieu-qua-de934fb1',
  'recipe-rua-mot-so-loai-thit-dc589959',
  'recipe-quy-trinh-so-che-rau-cu-qua-fe2893cc',
  'recipe-quy-trinh-so-che-dam-de025b60',
  'recipe-quy-trinh-tam-uop-dam-0e479225',
  'recipe-phong-chong-ngua-tay-khi-goi-rau-cu-c5688816',
  'recipe-phi-hanh-gion-b39a62fa',
  'recipe-noi-bat-dinh-chat-nhau-74ba66f6',
  'recipe-nau-com-445f250f',
  'recipe-nau-uc-ga-mem-mong-50e7d7b1',
  'recipe-nau-soup-khong-tach-nuoc-c5b5cd94',
  'recipe-nau-chao-khong-trao-6d473724',
  'recipe-nguyen-tac-chon-thuc-pham-eat-clean-023e61f0',
  'recipe-khi-sup-canh-bi-man-273ee8c4',
  'recipe-luoc-bau-khong-tham-776e544d',
  'recipe-hanh-tay-lam-moi-do-bep-45a5b26f',
  'recipe-giu-khoai-tay-khoi-nay-mam-7b8fd407',
  'recipe-gia-vi-f4bd6b65',
  'recipe-eat-clean-b0c7b9dd'
]);

// 2. TAG MAPPINGS
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

  // Prefix Codes
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

  // Raw phrases
  'Món kho/rim': 'Món kho',
  'Món kho / rim': 'Món kho',
  'rim': 'Món rim',
  'Món rang/chiên': 'Món chiên / rán',
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
  'Món ăn vặt': 'Ăn vặt',
  'Bánh / Đồ ăn vặtCơ bản': 'Làm bánh'
};

function normalizeTag(rawTag, recipeTitle) {
  if (!rawTag) return null;
  const t = rawTag.trim();
  if (TAG_MAP[t]) return TAG_MAP[t];

  // Specific compound handling
  if (t === 'Bún/Miến/Mỳ/Phở/Canh' || t === 'Nui/Miến/Mì/Bún/Phở' || t === 'Bún / Mỳ / Phở / Miến ...') {
    const titleLower = (recipeTitle || '').toLowerCase();
    if (titleLower.includes('phở')) return 'Phở';
    if (titleLower.includes('miến')) return 'Miến';
    if (titleLower.includes('mì') || titleLower.includes('mỳ') || titleLower.includes('spaghetti') || titleLower.includes('ramen')) return 'Mì';
    if (titleLower.includes('bún')) return 'Bún';
    if (titleLower.includes('nui')) return 'Nui';
    if (titleLower.includes('canh')) return 'Canh';
    return 'Món nước';
  }

  // Corrupted concatenation fixes
  if (t.includes('Món chiên / nướng / áp chảoMón kho / rim')) return 'Chiên / Kho';
  if (t.includes('Bánh / Đồ ăn vặtMón kho / rim')) return 'Bánh';
  if (t.includes('Bún / Mỳ / Phở / Miến ...Món chiên / nướng / áp chảo')) return 'Món nước';

  // Age tags
  if (/^\d+M\+$/i.test(t)) return t.toUpperCase();

  // If contains slashes, pick clean parts
  if (t.includes('/')) {
    const parts = t.split('/').map(p => p.trim()).filter(Boolean);
    return parts[0];
  }

  return t;
}

// 3. UNIT NORMALIZATION
const UNIT_MAP = {
  'gr': 'g', 'gram': 'g', 'gam': 'g', 'kilo': 'kg', 'kilogram': 'kg',
  'lit': 'lít', 'liter': 'lít', 'l': 'lít', 'mililit': 'ml',
  'mc': 'muỗng canh', 'tbsp': 'muỗng canh', 'tbs': 'muỗng canh', 'thìa canh': 'muỗng canh', 'thìa súp': 'muỗng canh',
  'mcf': 'muỗng cà phê', 'tsp': 'muỗng cà phê', 'thìa cà phê': 'muỗng cà phê', 'thìa cafe': 'muỗng cà phê', 'cf': 'muỗng cà phê',
  'qua': 'quả', 'trai': 'trái', 'cu': 'củ', 'cai': 'cái', 'bo': 'bó', 'nhanh': 'nhánh', 'tep': 'tép',
  'lat': 'lát', 'mieng': 'miếng', 'chen': 'chén', 'bat': 'bát', 'lon': 'lon', 'hop': 'hộp', 'goi': 'gói'
};

function normalizeUnit(u) {
  if (!u) return '';
  const lower = u.trim().toLowerCase();
  return UNIT_MAP[lower] || u.trim();
}

console.log('Testing configuration loaded.');
