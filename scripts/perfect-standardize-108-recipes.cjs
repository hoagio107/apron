const fs = require('fs');
const path = require('path');

const jsonPath = 'C:/Users/Admin/Downloads/cookbook_recipes_import.json';
const jsonDir = 'C:/Users/Admin/Downloads/CookBook-Recipes-JSON';
const appDataDir = 'C:/Users/Admin/Documents/CookbookData/recipes';

const fractionMap = {
  '¼': 0.25,
  '½': 0.5,
  '¾': 0.75,
  '⅓': 0.33,
  '⅔': 0.67,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875
};

const unitMap = {
  'muỗng canh': 'muỗng canh',
  'thìa canh': 'muỗng canh',
  'thìa súp': 'muỗng canh',
  'thìa ăn cơm': 'muỗng canh',
  'tbsp': 'muỗng canh',
  'muỗng cà phê': 'muỗng cà phê',
  'muỗng cafe': 'muỗng cà phê',
  'thìa cà phê': 'muỗng cà phê',
  'thìa cafe': 'muỗng cà phê',
  'thìa café': 'muỗng cà phê',
  'thìa cf': 'muỗng cà phê',
  'tsp': 'muỗng cà phê',
  'g': 'g',
  'gr': 'g',
  'gram': 'g',
  'kg': 'kg',
  'ml': 'ml',
  'lít': 'lít',
  'lit': 'lít',
  'l': 'lít',
  'quả': 'quả',
  'trái': 'trái',
  'củ': 'củ',
  'tép': 'tép',
  'nhánh': 'nhánh',
  'cây': 'nhánh',
  'bó': 'bó',
  'mớ': 'bó',
  'mẩu': 'nhánh',
  'lát': 'lát',
  'miếng': 'miếng',
  'khúc': 'khúc',
  'bát': 'bát',
  'chén': 'chén',
  'ly': 'ly',
  'lon': 'lon',
  'hộp': 'hộp',
  'gói': 'gói',
  'lá': 'lá',
  'con': 'con',
  'chút': 'chút',
  'xíu': 'chút'
};

const knownNouns = {
  'thơm': 'Trái thơm',
  'trái thơm': 'Trái thơm',
  'dứa': 'Trái thơm',
  'cà rốt': 'Cà rốt',
  'chanh': 'Chanh',
  'hành tây': 'Hành tây',
  'hành tím': 'Hành tím',
  'tỏi': 'Tỏi',
  'gừng': 'Gừng',
  'sả': 'Sả',
  'cà chua': 'Cà chua',
  'cà chua bi': 'Cà chua bi',
  'dưa leo': 'Dưa leo',
  'dưa chuột': 'Dưa leo',
  'ớt chuông': 'Ớt chuông',
  'cam': 'Cam',
  'nước dùng gà': 'Nước dùng gà',
  'đường': 'Đường',
  'muối': 'Muối',
  'tiêu': 'Tiêu xay',
  'tiêu xay': 'Tiêu xay',
  'vani': 'Vani',
  'mật ong': 'Mật ong',
  'dầu mè': 'Dầu mè',
  'dầu ăn': 'Dầu ăn',
  'nước tương': 'Nước tương',
  'xì dầu': 'Nước tương',
  'xương gà': 'Xương gà',
  'trứng gà': 'Trứng gà',
  'bột bắp': 'Bột bắp',
  'bột năng': 'Bột năng',
  'tương cà': 'Tương cà',
  'tương ớt': 'Tương ớt',
  'mật mía': 'Mật mía',
  'nước mắm': 'Nước mắm',
  'nước mắm chay': 'Nước mắm chay',
  'bột ngọt': 'Bột ngọt',
  'bột khoai lang tím': 'Bột khoai lang tím',
  'bột ca cao': 'Bột cacao',
  'bột cacao': 'Bột cacao',
  'bột ớt': 'Bột ớt',
  'bột tỏi': 'Bột tỏi',
  'gạo': 'Gạo',
  'yến mạch': 'Yến mạch',
  'lá bắp cải': 'Lá bắp cải',
  'bắp cải': 'Bắp cải',
  'bắp cải tím': 'Bắp cải tím',
  'lá chanh': 'Lá chanh',
  'rau răm': 'Rau răm',
  'tía tô': 'Tía tô',
  'bạc hà': 'Bạc hà',
  'dấm bỗng': 'Dấm bỗng',
  'nước cốt chanh': 'Nước cốt chanh'
};

function cleanIngredient(ing) {
  let name = (ing.name || '').trim();
  let amount = typeof ing.quantity === 'number' || typeof ing.quantity === 'string' 
    ? (typeof ing.quantity === 'string' && !isNaN(Number(ing.quantity)) ? Number(ing.quantity) : ing.quantity)
    : (typeof ing.amount === 'number' ? ing.amount : 1);
  let unit = (ing.unit || '').trim();

  // Normalize Unicode
  name = name.replace(/\u00a0/g, ' ').trim();

  // 1. Check fraction at beginning
  for (const [fracChar, fracVal] of Object.entries(fractionMap)) {
    if (name.startsWith(fracChar)) {
      amount = fracVal;
      let remainder = name.slice(fracChar.length).trim();
      
      // Check if remainder has unit: e.g. "trái thơm", "củ cà rốt", "thìa cà phê vani", "muỗng cà phê muối"
      const unitMatch = remainder.match(/^(muỗng canh|muỗng cà phê|muỗng cafe|muỗng cf|thìa canh|thìa cà phê|thìa cafe|thìa café|thìa cf|thìa súp|thìa|muỗng|trái|củ|quả|con|nhánh|mẩu|tép|bó|mớ|lát|miếng|khúc|bát|chén|ly|lon|hộp|gói|lá|bắp|kg|g|ml|lít|lit|l)\s+(.*)$/i);
      if (unitMatch) {
        const rawUnit = unitMatch[1].toLowerCase();
        unit = unitMap[rawUnit] || rawUnit;
        remainder = unitMatch[2].trim();
      }

      name = remainder;
      break;
    }
  }

  // 2. Check ASCII fractions like "1/4 trái thơm", "1/2 củ cà rốt"
  const asciiFracMatch = name.match(/^(\d+\/\d+)\s+(.*)$/);
  if (asciiFracMatch) {
    try {
      amount = eval(asciiFracMatch[1]);
    } catch {}
    let remainder = asciiFracMatch[2].trim();
    const unitMatch = remainder.match(/^(muỗng canh|muỗng cà phê|muỗng cafe|muỗng cf|thìa canh|thìa cà phê|thìa cafe|thìa café|thìa cf|thìa súp|thìa|muỗng|trái|củ|quả|con|nhánh|mẩu|tép|bó|mớ|lát|miếng|khúc|bát|chén|ly|lon|hộp|gói|lá|bắp|kg|g|ml|lít|lit|l)\s+(.*)$/i);
    if (unitMatch) {
      const rawUnit = unitMatch[1].toLowerCase();
      unit = unitMap[rawUnit] || rawUnit;
      remainder = unitMatch[2].trim();
    }
    name = remainder;
  }

  // 3. Check for specific unit prefixes in name without fraction: e.g. "Muỗng cafe muối", "Thìa ăn cơm bột bắp"
  // But DON'T strip from compound nouns like "Củ cải trắng", "Củ cải khô", "Củ đậu", "Bắp mỹ", "Bắp ngọt", "Bắp non", "Bắp cải tím", "Bắp cải"
  const preserveNouns = /^(củ cải|củ đậu|bắp mỹ|bắp cải|bắp ngọt|bắp non|bắp nữ hoàng|bắp hột|bắp nấu)/i;
  if (!preserveNouns.test(name)) {
    const prefixUnitMatch = name.match(/^(muỗng canh|muỗng cà phê|muỗng cafe|muỗng cf|thìa canh|thìa cà phê|thìa cafe|thìa café|thìa cf|thìa súp|thìa ăn cơm|thìa|muỗng|củ|quả|trái|nhánh|mẩu|tép|bó|mớ|lát|miếng|khúc|con)\s+(.*)$/i);
    if (prefixUnitMatch) {
      const rawUnit = prefixUnitMatch[1].toLowerCase();
      if (!unit || unit === '') {
        unit = unitMap[rawUnit] || rawUnit;
      }
      name = prefixUnitMatch[2].trim();
    }
  }

  // 4. Handle embedded colon format: "Bắp cải tím: 30 g"
  const colonMatch = name.match(/^(.*?):\s*(\d+(?:\.\d+)?)\s*([a-zA-Zà-ỹÀ-Ỹ]+)?$/);
  if (colonMatch) {
    name = colonMatch[1].trim();
    amount = parseFloat(colonMatch[2]);
    unit = colonMatch[3] ? (unitMap[colonMatch[3].toLowerCase()] || colonMatch[3]) : unit;
  }

  // 5. Clean trailing notes & prep instructions
  name = name.replace(/\s+cho có màu.*$/i, '');
  name = name.replace(/\s+hoặc bột gia vị.*$/i, '');
  name = name.replace(/\s+xắt hạt lựu.*$/i, '');
  name = name.replace(/\s+vắt lấy nước cốt.*$/i, '');
  name = name.replace(/\s+vo sạch.*$/i, '');
  name = name.replace(/\/ hoặc mật ong.*$/i, '');
  name = name.replace(/\/mật ong\/thốt nốt\/.*$/i, '');
  name = name.replace(/\s+hc$/i, ''); // "Thìa tương cà hc" -> "Tương cà"
  name = name.replace(/\s+hc\/.*$/i, '');
  name = name.replace(/[.,:;]+$/, '').trim();

  // 6. Direct noun standardization
  const lower = name.toLowerCase().trim();
  if (knownNouns[lower]) {
    name = knownNouns[lower];
  } else {
    // Capitalize first letter
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Special user requirement check:
  // "ví dụ '1/4 trái thơm' không phải nguyên liệu hợp lệ, 'Trái thơm' mới là tên nguyên liệu hợp lệ chứ!"
  if (/^thơm$/i.test(name) || /^trái thơm$/i.test(name)) {
    name = 'Trái thơm';
    if (!unit) unit = 'trái';
  }

  return {
    ...ing,
    name,
    amount,
    quantity: amount,
    unit: unit || ''
  };
}

// Read import json
const importData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let updatedCount = 0;
const cleanedRecipes = importData.recipes.map(recipe => {
  const ingredients = (recipe.ingredients || []).map(ing => {
    const cleaned = cleanIngredient(ing);
    return cleaned;
  });

  return {
    ...recipe,
    ingredients
  };
});

// Rebuild clean catalog
const catalogMap = new Map();
const unitsSet = new Set(['g', 'kg', 'ml', 'lít', 'muỗng canh', 'muỗng cà phê', 'quả', 'trái', 'củ', 'nhánh', 'tép', 'bó', 'lát', 'miếng', 'khúc', 'chén', 'bát', 'lon', 'hộp', 'gói', 'lá', 'con', 'chút']);

cleanedRecipes.forEach(r => {
  r.ingredients.forEach(i => {
    if (i.unit) unitsSet.add(i.unit);
    if (i.name) {
      const norm = i.name.trim();
      const lower = norm.toLowerCase();
      if (!catalogMap.has(norm)) {
        let cat = 'Khác';
        if (/thịt|gà|bò|heo|vịt|ngan|sườn|giò|chả|xúc xích|lạp xưởng|xương/.test(lower)) cat = 'Thịt';
        else if (/cá|tôm|mực|cua|nghêu|sò|ốc|hải sản/.test(lower)) cat = 'Hải sản';
        else if (/rau|hành|cà |ớt|nấm|giá|bắp|dưa|khoai|ngò|tía tô|mùi|chuối|cần|húng|diếp|cúc|thì là|thơm|chanh|bạc hà|cải|củ cải|đậu/.test(lower)) cat = 'Rau củ';
        else if (/muối|đường|mắm|tiêu|hạt nêm|bột ngọt|dầu|tương|giấm|ngũ vị|cà ri|mật ong|bơ|xì dầu|vani|mật mía/.test(lower)) cat = 'Gia vị';
        else if (/gạo|bún|phở|mì|miến|bột|bánh|semolina|yến mạch/.test(lower)) cat = 'Ngũ cốc & Bột';
        else if (/sữa|trứng|phô mai|sữa chua/.test(lower)) cat = 'Trứng & Sữa';
        else if (/hạt|đậu|mè|lạc|vừng|điều/.test(lower)) cat = 'Hạt & Đậu';

        catalogMap.set(norm, {
          id: `catalog-std-${catalogMap.size + 1}`,
          name: norm,
          default_unit: i.unit || '',
          default_category: cat
        });
      }
    }
  });
});

const unitsArray = Array.from(unitsSet).map((uName, idx) => ({
  id: `unit-std-${idx + 1}`,
  name: uName,
  symbol: uName,
  type: ['g', 'kg'].includes(uName) ? 'weight' : ['ml', 'lít'].includes(uName) ? 'volume' : 'count',
  is_custom: false
}));

const catalogArray = Array.from(catalogMap.values());

const finalOutput = {
  version: '1.0.0',
  exported_at: new Date().toISOString(),
  units: unitsArray,
  catalog: catalogArray,
  recipes: cleanedRecipes
};

// 1. Write back to cookbook_recipes_import.json
fs.writeFileSync(jsonPath, JSON.stringify(finalOutput, null, 2), 'utf8');
console.log('Saved clean import json to:', jsonPath);

// 2. Write to CookBook-Recipes-JSON
if (fs.existsSync(jsonDir)) {
  cleanedRecipes.forEach(r => {
    fs.writeFileSync(path.join(jsonDir, `${r.slug}.json`), JSON.stringify(r, null, 2), 'utf8');
    if (r.id) {
      fs.writeFileSync(path.join(jsonDir, `${r.id}.json`), JSON.stringify(r, null, 2), 'utf8');
    }
  });
  console.log('Saved to CookBook-Recipes-JSON:', cleanedRecipes.length);
}

// 3. Write to CookbookData/recipes
if (fs.existsSync(appDataDir)) {
  cleanedRecipes.forEach(r => {
    fs.writeFileSync(path.join(appDataDir, `${r.slug}.json`), JSON.stringify(r, null, 2), 'utf8');
    if (r.id) {
      fs.writeFileSync(path.join(appDataDir, `${r.id}.json`), JSON.stringify(r, null, 2), 'utf8');
    }
  });
  console.log('Saved to CookbookData/recipes:', cleanedRecipes.length);
}

// Sample check for Trái thơm
const testRecipe = cleanedRecipes.find(r => r.title && r.title.includes('bắp cải'));
if (testRecipe) {
  console.log('\n--- SAMPLE CLEANED RECIPE (Ức gà cuộn bắp cải) ---');
  console.log(JSON.stringify(testRecipe.ingredients, null, 2));
}

console.log('\nTotal catalog items:', catalogArray.length);
console.log('Total units:', unitsArray.length);
