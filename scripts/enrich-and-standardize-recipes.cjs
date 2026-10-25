const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const INPUT_FILE = 'C:\\Users\\Admin\\Downloads\\cookbook_recipes_import.json';
const OUTPUT_FILE = 'C:\\Users\\Admin\\Downloads\\cookbook_recipes_import.json';
const OUTPUT_DIR = 'C:\\Users\\Admin\\Downloads\\CookBook-Recipes-JSON';
const DOCS_RECIPES_DIR = 'C:\\Users\\Admin\\Documents\\CookbookData\\recipes';

// 1. UNIT NORMALIZATION MAP
const UNIT_MAP = {
  // Muỗng canh
  'mc': 'muỗng canh',
  'thìa canh': 'muỗng canh',
  'thìa súp': 'muỗng canh',
  'muong canh': 'muỗng canh',
  'tbsp': 'muỗng canh',
  'tbs': 'muỗng canh',
  'tablespoon': 'muỗng canh',

  // Muỗng cà phê
  'mcf': 'muỗng cà phê',
  'cf': 'muỗng cà phê',
  'muỗng cf': 'muỗng cà phê',
  'muong cf': 'muỗng cà phê',
  'muong ca phe': 'muỗng cà phê',
  'thìa cà phê': 'muỗng cà phê',
  'thìa cafe': 'muỗng cà phê',
  'thìa cf': 'muỗng cà phê',
  'tsp': 'muỗng cà phê',
  'teaspoon': 'muỗng cà phê',

  // Trọng lượng
  'gr': 'g',
  'gram': 'g',
  'grams': 'g',
  'gam': 'g',
  'kilo': 'kg',
  'kilogram': 'kg',

  // Thể tích
  'l': 'lít',
  'lit': 'lít',
  'liter': 'lít',
  'ml': 'ml',
  'mililit': 'ml',

  // Đơn vị đếm & gia vị
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

function normalizeUnit(rawUnit) {
  if (!rawUnit) return '';
  const lower = rawUnit.trim().toLowerCase();
  return UNIT_MAP[lower] || rawUnit.trim();
}

// 2. INGREDIENT NAME NORMALIZATION
function normalizeIngredientName(rawName) {
  let name = (rawName || '').trim();
  if (!name) return '';

  // Clean trailing or leading punctuation
  name = name.replace(/^[-–—:,.\s]+/, '').replace(/[-–—:,.\s]+$/, '');

  // Strip accidental quantity/unit at start: e.g. "30-50 ml nước sôi" -> "Nước sôi"
  name = name.replace(/^\d+(?:[.,]\d+)?\s*(?:-\s*\d+(?:[.,]\d+)?)?\s*(?:ml|g|gr|kg|lít|lit|l|muỗng canh|muỗng cà phê|thìa canh|thìa cà phê|quả|củ|trái|cái|bó|nhánh|tép|lát|miếng|chén|bát|lon|gói|hộp|chút|xíu)\s+/i, '');
  name = name.replace(/^(?:muỗng|thìa)\s+(?:canh|cà phê|cf|cafe|súp)\s+/i, '');

  const lower = name.toLowerCase();

  // MEAT & SEAFOOD STANDARDIZATION
  if (/^ức gà\b/i.test(name) || lower === 'ức gà') return 'Thịt ức gà';
  if (/^gà\b/i.test(name) && !lower.includes('trứng') && !lower.includes('hạt nêm')) return 'Thịt gà';
  if (/^đùi gà\b/i.test(name)) return 'Thịt đùi gà';
  if (/^cánh gà\b/i.test(name)) return 'Thịt cánh gà';
  if (/^chân gà\b/i.test(name)) return 'Chân gà';
  if (/^lòng gà\b/i.test(name)) return 'Lòng gà';

  if (/^(?:thịt\s+)?ba chỉ heo\b/i.test(name) || /^(?:thịt\s+)?ba rọi heo\b/i.test(name) || lower.startsWith('ba chỉ') || lower.startsWith('ba rọi')) {
    return 'Thịt ba chỉ heo';
  }
  if (/^thịt\s+(?:nạc\s+)?vai\s+xay/i.test(name) || /^thịt\s+nạc\s+xay/i.test(name) || /^thịt\s+xay/i.test(name) || lower === 'thịt xay') {
    return 'Thịt heo xay';
  }
  if (/^thịt\s+chân\s+giò/i.test(name) || /^chân\s+giò/i.test(name) || /^móng\s+giò/i.test(name)) {
    return 'Móng giò heo';
  }
  if (/^sườn\s+(?:heo|non|sụn)?\b/i.test(name)) {
    return 'Sườn heo';
  }
  if (/^thịt\s+nạc(?:\s+heo)?\b/i.test(name)) {
    return 'Thịt nạc heo';
  }
  if (/^lưỡi\s+heo\b/i.test(name)) return 'Lưỡi heo';
  if (/^(?:thịt\s+)?xá xíu\b/i.test(name)) return 'Thịt xá xíu';

  if (/^bò\b/i.test(name) && !lower.includes('bơ') && !lower.includes('bột')) return 'Thịt bò';
  if (/^thịt\s+thăn\s+bò\b/i.test(name)) return 'Thịt thăn bò';
  if (/^thịt\s+bắp\s+bò\b/i.test(name)) return 'Thịt bắp bò';
  if (/^thịt\s+bò\b/i.test(name)) return 'Thịt bò';

  if (/^tôm\s+(?:sú|thẻ|tươi|bóc vỏ)?\b/i.test(name) && !lower.includes('khô')) return 'Tôm tươi';
  if (/^tôm\s+khô\b/i.test(name)) return 'Tôm khô';
  if (/^mực\s+(?:ống|tươi|lá)?\b/i.test(name)) return 'Mực ống';
  if (/^cua\b/i.test(name) || /^thịt\s+cua\b/i.test(name)) return 'Thịt cua';
  if (/^cá\s+hồi\b/i.test(name)) return 'Cá hồi';
  if (/^cá\s+(?:lóc|quả)\b/i.test(name)) return 'Cá lóc';
  if (/^chả\s+cá\b/i.test(name)) return 'Chả cá';
  if (/^chả\s+lụa\b/i.test(name) || /^giò\s+lụa\b/i.test(name)) return 'Chả lụa';

  // EGGS & DAIRY
  if (/^trứng\s+gà\b/i.test(name) || lower === 'trứng') return 'Trứng gà';
  if (/^trứng\s+vịt\b/i.test(name)) return 'Trứng vịt';
  if (/^trứng\s+cút\b/i.test(name)) return 'Trứng cút';
  if (/^sữa\s+chua\b/i.test(name)) return 'Sữa chua không đường';
  if (/^sữa\s+tươi\b/i.test(name)) return 'Sữa tươi không đường';
  if (/^sữa\s+đặc\b/i.test(name)) return 'Sữa đặc';
  if (/^bơ\s+(?:lạt|nhạt)?\b/i.test(name)) return 'Bơ lạt';
  if (/^phô\s+mai\b/i.test(name) || /^cheese\b/i.test(name)) return 'Phô mai';
  if (/^whipping\s+cream\b/i.test(name)) return 'Whipping cream';

  // VEGGIES & AROMATICS
  if (/^cà\s+chua\s+bi\b/i.test(name)) return 'Cà chua bi';
  if (/^cà\s+chua\b/i.test(name)) return 'Cà chua';
  if (/^cà\s+rốt\b/i.test(name)) return 'Cà rốt';
  if (/^hành\s+tây\b/i.test(name)) return 'Hành tây';
  if (/^hành\s+(?:tím|khô)\b/i.test(name)) return 'Hành tím';
  if (/^hành\s+lá\b/i.test(name)) return 'Hành lá';
  if (/^tỏi\b/i.test(name)) return 'Tỏi';
  if (/^gừng\b/i.test(name)) return 'Gừng';
  if (/^sả\b/i.test(name)) return 'Sả';
  if (/^ớt\s+(?:hiểm|cay)?\b/i.test(name)) return 'Ớt hiểm';
  if (/^ớt\s+chuông\b/i.test(name)) return 'Ớt chuông';
  if (/^chanh\b/i.test(name)) return 'Chanh tươi';
  if (/^dưa\s+(?:leo|chuột)\b/i.test(name)) return 'Dưa leo';
  if (/^nấm\s+hương\b/i.test(name)) return 'Nấm hương';
  if (/^nấm\s+đùi\s+gà\b/i.test(name)) return 'Nấm đùi gà';
  if (/^mộc\s+nhĩ\b/i.test(name) || /^nấm\s+mèo\b/i.test(name)) return 'Mộc nhĩ';
  if (/^giá\s+đỗ\b/i.test(name) || lower === 'giá') return 'Giá đỗ';
  if (/^rau\s+xà\s+lách\b/i.test(name) || lower === 'xà lách') return 'Rau xà lách';
  if (/^mùi\s+tàu\b/i.test(name) || /^ngò\s+gai\b/i.test(name)) return 'Ngò gai';
  if (/^rau\s+mùi\b/i.test(name) || /^ngò\s+rí\b/i.test(name)) return 'Ngò rí';
  if (/^bắp\s+cải\b/i.test(name)) return 'Bắp cải';
  if (/^súp\s+lơ\b/i.test(name) || /^bông\s+cải\b/i.test(name)) return 'Súp lơ';
  if (/^đậu\s+(?:hũ|phụ)\s+non\b/i.test(name)) return 'Đậu hũ non';
  if (/^đậu\s+(?:hũ|phụ)\b/i.test(name)) return 'Đậu hũ';

  // SEASONINGS
  if (/^nước\s+mắm\b/i.test(name)) return 'Nước mắm';
  if (/^nước\s+tương\b/i.test(name) || /^xì\s+dầu\b/i.test(name)) return 'Nước tương';
  if (/^dầu\s+ăn\b/i.test(name) || lower === 'dầu') return 'Dầu ăn';
  if (/^dầu\s+hào\b/i.test(name)) return 'Dầu hào';
  if (/^dầu\s+(?:mè|vừng)\b/i.test(name)) return 'Dầu mè';
  if (/^dầu\s+ô\s+liu\b/i.test(name)) return 'Dầu ô liu';
  if (/^hạt\s+nêm\b/i.test(name)) return 'Hạt nêm';
  if (/^bột\s+ngọt\b/i.test(name) || /^mì\s+chính\b/i.test(name)) return 'Bột ngọt';
  if (/^đường\s+phèn\b/i.test(name)) return 'Đường phèn';
  if (/^đường\b/i.test(name)) return 'Đường';
  if (/^muối\b/i.test(name)) return 'Muối';
  if (/^tiêu\s+(?:đen|xay)?\b/i.test(name)) return 'Tiêu đen xay';
  if (/^giấm\b/i.test(name)) return 'Giấm gạo';
  if (/^ngũ\s+vị\s+hương\b/i.test(name)) return 'Ngũ vị hương';
  if (/^sa\s+tế\b/i.test(name)) return 'Sa tế';
  if (/^tương\s+ớt\b/i.test(name)) return 'Tương ớt';
  if (/^tương\s+cà\b/i.test(name)) return 'Tương cà';

  // CARBS & GRAINS
  if (/^gạo\s+lứt\b/i.test(name)) return 'Gạo lứt';
  if (/^gạo\s+tẻ\b/i.test(name) || lower === 'gạo') return 'Gạo tẻ';
  if (/^bún\s+tươi\b/i.test(name)) return 'Bún tươi';
  if (/^bún\s+khô\b/i.test(name)) return 'Bún khô';
  if (/^phở\s+tươi\b/i.test(name)) return 'Phở tươi';
  if (/^miến\s+(?:dong|khô)?\b/i.test(name)) return 'Miến dong';
  if (/^yến\s+mạch\b/i.test(name)) return 'Yến mạch';
  if (/^bột\s+mì\b/i.test(name) || /^bột\s+mỳ\b/i.test(name)) return 'Bột mì';
  if (/^bột\s+năng\b/i.test(name)) return 'Bột năng';
  if (/^bột\s+bắp\b/i.test(name)) return 'Bột bắp';
  if (/^bột\s+gạo\b/i.test(name)) return 'Bột gạo';

  // Default: capitalize first letter
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// 3. CATEGORIZATION FOR CATALOG
function categorizeIngredient(name) {
  const lower = name.toLowerCase();
  if (/thịt|gà|heo|bò|lợn|vịt|ngan|sườn|giò|tôm|cua|mực|cá|chả|lưỡi|móng/i.test(lower)) {
    return 'Thịt cá & Hải sản';
  }
  if (/trứng|bơ|sữa|phô mai|cream|cheese|yogurt/i.test(lower)) {
    return 'Trứng & Bơ sữa';
  }
  if (/rau|cà|hành|tỏi|gừng|sả|ớt|chanh|nấm|mộc nhĩ|giá|bắp|dưa|khoai|bí|su hào|ngò|thì là/i.test(lower)) {
    return 'Rau củ quả';
  }
  if (/mắm|muối|đường|tiêu|hạt nêm|bột ngọt|dầu|tương|giấm|ngũ vị|sa tế|sốt|mù tạt|mật ong/i.test(lower)) {
    return 'Gia vị & Nước sốt';
  }
  if (/gạo|bún|phở|miến|mì|mỳ|bánh|bột|yến mạch|nui|cháo/i.test(lower)) {
    return 'Ngũ cốc & Tinh bột';
  }
  return 'Khác';
}

// 4. METADATA ESTIMATION (Prep time, Cook time, Difficulty, Calories)
function estimateRecipeMeta(recipe) {
  const title = (recipe.title || '').toLowerCase();
  const allStepsText = (recipe.steps || []).map(s => s.instruction).join(' ').toLowerCase();

  let prep = recipe.prep_time || 0;
  let cook = recipe.cook_time || 0;
  let difficulty = 'Vừa';
  let calories = recipe.calories || 0;

  // 1. Detect minutes in steps text if not present
  if (cook === 0) {
    const timeMatches = allStepsText.match(/(\d+)\s*(?:phút|p)\b/g);
    if (timeMatches && timeMatches.length > 0) {
      let sum = 0;
      timeMatches.slice(0, 3).forEach(m => {
        const num = parseInt(m, 10);
        if (num >= 3 && num <= 90) sum += num;
      });
      if (sum > 0) cook = sum;
    }
  }

  // Dish type heuristics
  if (title.includes('sốt') || title.includes('xốt') || title.includes('nước mắm') || title.includes('nước màu')) {
    prep = prep || 10;
    cook = cook || 10;
    difficulty = 'Dễ';
    calories = calories || 140;
  } else if (title.includes('salad') || title.includes('nộm') || title.includes('gỏi') || title.includes('cuốn') || title.includes('kem chuối') || title.includes('sữa chua')) {
    prep = prep || 15;
    cook = cook || (allStepsText.includes('luộc') || allStepsText.includes('áp chảo') ? 10 : 5);
    difficulty = 'Dễ';
    calories = calories || 320;
  } else if (title.includes('canh') || title.includes('súp')) {
    prep = prep || 15;
    cook = cook || 20;
    difficulty = 'Dễ';
    calories = calories || 260;
  } else if (title.includes('xào')) {
    prep = prep || 15;
    cook = cook || 15;
    difficulty = 'Dễ';
    calories = calories || 420;
  } else if (title.includes('cháo')) {
    prep = prep || 15;
    cook = cook || 40;
    difficulty = 'Dễ';
    calories = calories || 340;
  } else if (title.includes('nướng') || title.includes('áp chảo')) {
    prep = prep || 20;
    cook = cook || 25;
    difficulty = 'Vừa';
    calories = calories || 480;
  } else if (title.includes('kho') || title.includes('kìa') || title.includes('khìa') || title.includes('ram')) {
    prep = prep || 20;
    cook = cook || 35;
    difficulty = 'Vừa';
    calories = calories || 540;
  } else if (title.includes('chiên') || title.includes('chả giò')) {
    prep = prep || 25;
    cook = cook || 20;
    difficulty = 'Vừa';
    calories = calories || 510;
  } else if (title.includes('bún') || title.includes('phở') || title.includes('mì') || title.includes('mỳ') || title.includes('bánh canh')) {
    if (title.includes('thang') || title.includes('riêu') || title.includes('ốc') || title.includes('vằn thắn') || title.includes('ramen')) {
      prep = prep || 30;
      cook = cook || 50;
      difficulty = 'Khó';
      calories = calories || 550;
    } else {
      prep = prep || 20;
      cook = cook || 30;
      difficulty = 'Vừa';
      calories = calories || 480;
    }
  } else if (title.includes('bánh') || title.includes('flan') || title.includes('bột chiên')) {
    prep = prep || 25;
    cook = cook || 35;
    difficulty = 'Vừa';
    calories = calories || 390;
  } else if (title.includes('thịt đông') || title.includes('thịt xá xíu')) {
    prep = prep || 25;
    cook = cook || 60;
    difficulty = 'Vừa';
    calories = calories || 580;
  } else {
    prep = prep || 15;
    cook = cook || 25;
    difficulty = 'Vừa';
    calories = calories || 450;
  }

  // Default fallbacks
  if (prep <= 0) prep = 15;
  if (cook <= 0) cook = 20;
  if (calories <= 0) calories = 420;

  return {
    prep_time: prep,
    cook_time: cook,
    total_time_minutes: prep + cook,
    difficulty,
    calories,
    nutrition: { calories }
  };
}

function processAllRecipes() {
  console.log('Reading:', INPUT_FILE);
  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  const originalRecipes = rawData.recipes || [];
  console.log(`Loaded ${originalRecipes.length} recipes.`);

  const unitsSet = new Set();
  const catalogMap = new Map();

  const processedRecipes = originalRecipes.map((r, rIdx) => {
    // 1. Meta estimation
    const meta = estimateRecipeMeta(r);

    // 2. Standardize ingredients
    const processedIngredients = (r.ingredients || []).map((ing, iIdx) => {
      const normUnit = normalizeUnit(ing.unit);
      const normName = normalizeIngredientName(ing.name);

      if (normUnit) unitsSet.add(normUnit);

      if (normName && !catalogMap.has(normName.toLowerCase())) {
        const cat = categorizeIngredient(normName);
        catalogMap.set(normName.toLowerCase(), {
          id: `ing-${Date.now().toString(36)}-${rIdx}-${iIdx}`,
          name: normName,
          default_category: cat,
          default_unit: normUnit || 'g'
        });
      }

      return {
        name: normName,
        quantity: ing.quantity || 1,
        unit: normUnit,
        group: ing.group || undefined
      };
    });

    return {
      ...r,
      prep_time: meta.prep_time,
      cook_time: meta.cook_time,
      total_time_minutes: meta.total_time_minutes,
      difficulty: meta.difficulty,
      calories: meta.calories,
      nutrition: meta.nutrition,
      // USER REQUIREMENT: Xoá toàn bộ đánh giá, chỉ để chừa đánh giá là không ghi
      taste_score: 0,
      cooking_history: [],
      ingredients: processedIngredients
    };
  });

  // Convert Units to objects
  const unitsArray = Array.from(unitsSet).map((uName, idx) => ({
    id: `unit-${idx + 1}`,
    name: uName
  }));

  // Convert Catalog to objects
  const catalogArray = Array.from(catalogMap.values());

  const fullImportPayload = {
    version: '1.0.0',
    exported_at: new Date().toISOString(),
    units: unitsArray,
    catalog: catalogArray,
    recipes: processedRecipes
  };

  // Write enriched main import JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fullImportPayload, null, 2), 'utf8');
  console.log(`Saved enriched backup JSON to: ${OUTPUT_FILE}`);
  console.log(`- Total Recipes: ${processedRecipes.length}`);
  console.log(`- Total Standardized Units: ${unitsArray.length}`);
  console.log(`- Total Standardized Catalog Ingredients: ${catalogArray.length}`);

  // Also update individual JSON files
  if (fs.existsSync(OUTPUT_DIR)) {
    processedRecipes.forEach(rec => {
      fs.writeFileSync(path.join(OUTPUT_DIR, `${rec.id}.json`), JSON.stringify(rec, null, 2), 'utf8');
    });
    console.log(`Updated individual JSON recipes in: ${OUTPUT_DIR}`);
  }

  // Also update local CookbookData directory
  if (fs.existsSync(DOCS_RECIPES_DIR)) {
    processedRecipes.forEach(rec => {
      fs.writeFileSync(path.join(DOCS_RECIPES_DIR, `${rec.id}.json`), JSON.stringify(rec, null, 2), 'utf8');
    });
    console.log(`Updated offline storage recipes in: ${DOCS_RECIPES_DIR}`);
  }

  console.log('\n--- SAMPLE PROCESSED RECIPE ---');
  console.log(JSON.stringify(processedRecipes[0], null, 2).slice(0, 900));

  console.log('\n--- SAMPLE STANDARDIZED UNITS ---');
  console.log(unitsArray.slice(0, 10));

  console.log('\n--- SAMPLE CATALOG ITEMS ---');
  console.log(catalogArray.slice(0, 8));
}

processAllRecipes();
