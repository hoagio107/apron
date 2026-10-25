const fs = require('fs');
const path = require('path');

const jsonPath = 'C:/Users/Admin/Downloads/cookbook_recipes_import.json';
const jsonDir = 'C:/Users/Admin/Downloads/CookBook-Recipes-JSON';
const appDataDir = 'C:/Users/Admin/Documents/CookbookData/recipes';

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Helper to normalize meat & standard prefixes
function standardizeIngredientName(raw) {
  let name = raw.trim();
  // Remove leading '-' or '*' or numbers
  name = name.replace(/^[-*•\d\s.,:]+/, '').trim();

  // Mapping rules
  const directMap = {
    'ba chỉ heo': 'Thịt ba chỉ heo',
    'thịt ba chỉ': 'Thịt ba chỉ heo',
    'thịt heo ba chỉ': 'Thịt ba chỉ heo',
    'thịt heo xay': 'Thịt heo xay',
    'thịt băm': 'Thịt heo xay',
    'thịt nạc xay': 'Thịt heo xay',
    'thịt ức gà': 'Thịt ức gà',
    'ức gà': 'Thịt ức gà',
    'thịt đùi gà': 'Thịt đùi gà',
    'đùi gà': 'Thịt đùi gà',
    'thịt gà': 'Thịt gà',
    'gà': 'Thịt gà',
    'thịt bò': 'Thịt bò',
    'bắp bò': 'Thịt bắp bò',
    'thăn bò': 'Thịt thăn bò',
    'thịt heo': 'Thịt heo',
    'heo': 'Thịt heo',
    'sườn heo': 'Sườn heo',
    'sườn non': 'Sườn heo',
    'sườn': 'Sườn heo',
    'tôm tươi': 'Tôm',
    'tôm': 'Tôm',
    'tôm sú': 'Tôm sú',
    'tôm khô': 'Tôm khô',
    'mực': 'Mực ống',
    'mực tươi': 'Mực tươi',
    'cá hồi': 'Cá hồi',
    'cá lóc': 'Cá lóc',
    'cá basa': 'Cá basa',
    'cá trôi': 'Cá trôi',
    'trứng gà': 'Trứng gà',
    'trứng vịt': 'Trứng vịt',
    'trứng cút': 'Trứng cút',
    'trứng': 'Trứng gà',
    'hành tím': 'Hành tím',
    'hành khô': 'Hành tím',
    'hành củ': 'Hành tím',
    'hành tây': 'Hành tây',
    'hành lá': 'Hành lá',
    'tỏi': 'Tỏi',
    'tỏi băm': 'Tỏi',
    'hành băm': 'Hành tím',
    'hành tím băm': 'Hành tím',
    'gừng': 'Gừng',
    'sả': 'Sả',
    'cà rốt': 'Cà rốt',
    'khoai tây': 'Khoai tây',
    'khoai lang': 'Khoai lang',
    'cà chua': 'Cà chua',
    'dưa leo': 'Dưa leo',
    'dưa chuột': 'Dưa leo',
    'giá đỗ': 'Giá đỗ',
    'giá': 'Giá đỗ',
    'nấm hương': 'Nấm hương',
    'nấm đông cô': 'Nấm đông cô',
    'nấm đùi gà': 'Nấm đùi gà',
    'nấm kim châm': 'Nấm kim châm',
    'nấm mèo': 'Mộc nhĩ',
    'mộc nhĩ': 'Mộc nhĩ',
    'bột năng': 'Bột năng',
    'bột bắp': 'Bột bắp',
    'bột mì': 'Bột mì',
    'bột chiên giòn': 'Bột chiên giòn',
    'bột chiên xù': 'Bột chiên xù',
    'nước mắm': 'Nước mắm',
    'nước tương': 'Nước tương',
    'xì dầu': 'Nước tương',
    'dầu hào': 'Dầu hào',
    'dầu ăn': 'Dầu ăn',
    'dầu mè': 'Dầu mè',
    'hạt nêm': 'Hạt nêm',
    'bột ngọt': 'Bột ngọt',
    'mì chính': 'Bột ngọt',
    'muối': 'Muối',
    'muối tinh': 'Muối',
    'đường': 'Đường',
    'đường phèn': 'Đường phèn',
    'đường thốt nốt': 'Đường thốt nốt',
    'tiêu': 'Tiêu xay',
    'tiêu xay': 'Tiêu xay',
    'tiêu đen': 'Tiêu đen xay',
    'tiêu đen xay': 'Tiêu đen xay',
    'tiêu sọ': 'Tiêu sọ',
    'ớt': 'Ớt tươi',
    'ớt hiểm': 'Ớt hiểm',
    'ớt chuông': 'Ớt chuông',
    'ngũ vị hương': 'Ngũ vị hương',
    'nước cốt dừa': 'Nước cốt dừa',
    'nước dừa': 'Nước dừa',
    'nước dừa tươi': 'Nước dừa tươi',
    'nước dừa xiêm': 'Nước dừa tươi',
    'nước dừa xiêm ngọt': 'Nước dừa tươi',
    'nước màu dừa': 'Nước màu dừa'
  };

  const lower = name.toLowerCase();
  if (directMap[lower]) {
    return directMap[lower];
  }

  // Capitalize first letter
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Map units
function standardizeUnit(rawUnit) {
  if (!rawUnit) return '';
  const u = rawUnit.trim().toLowerCase();
  if (['mc', 'thìa canh', 'thìa súp', 'tbsp', 'muỗng canh'].includes(u)) return 'muỗng canh';
  if (['mcf', 'cf', 'thìa cà phê', 'thìa cf', 'tsp', 'muỗng cf', 'muỗng cà phê'].includes(u)) return 'muỗng cà phê';
  if (['g', 'gr', 'gram', 'gam'].includes(u)) return 'g';
  if (['kg', 'kilo', 'kilogram'].includes(u)) return 'kg';
  if (['ml', 'mililit'].includes(u)) return 'ml';
  if (['l', 'lit', 'lít'].includes(u)) return 'lít';
  if (['quả', 'trái'].includes(u)) return 'quả';
  if (['củ'].includes(u)) return 'củ';
  if (['cây', 'nhánh', 'nhánh/cây'].includes(u)) return 'nhánh';
  if (['tép'].includes(u)) return 'tép';
  if (['bó'].includes(u)) return 'bó';
  if (['cái'].includes(u)) return 'cái';
  if (['miếng', 'lát'].includes(u)) return 'miếng';
  if (['chén', 'bát'].includes(u)) return 'chén';
  if (['lon'].includes(u)) return 'lon';
  if (['hộp'].includes(u)) return 'hộp';
  if (['gói'].includes(u)) return 'gói';
  if (['nắm'].includes(u)) return 'nắm';
  return u;
}

// Process single recipe
let totalPrepsExtracted = 0;
let totalIngredientsCleaned = 0;

data.recipes.forEach(recipe => {
  const newIngredients = [];
  const prepSteps = [];

  recipe.ingredients.forEach(item => {
    let rawName = (item.name || '').trim();
    let amount = item.amount !== undefined ? item.amount : (item.quantity !== undefined ? item.quantity : 1);
    let unit = standardizeUnit(item.unit || '');

    // Case 0: Lumped spices like "Gia vị: Muối, đường, tiêu..." or "Gia vị ướp: 1/2 Tbsp muối tinh, 4 Tbsp nước mắm..."
    if (/^gia vị/i.test(rawName) || /^rau ăn kèm/i.test(rawName) || /^rau thơm:/i.test(rawName) || /^rau sống:/i.test(rawName)) {
      const parts = rawName.replace(/^[^:]+:\s*/i, '').split(/[,;]/);
      parts.forEach(part => {
        let p = part.trim();
        if (!p) return;
        // Parse possible quantity in part like "1/2 Tbsp muối tinh" or "4 Tbsp nước mắm ngon"
        const m = p.match(/^([\d/.]+)\s*([a-zA-Zà-ỹÀ-Ỹ]+)?\s+(.+)$/);
        if (m) {
          let partQty = m[1].includes('/') ? eval(m[1]) : parseFloat(m[1]);
          let partUnit = standardizeUnit(m[2]);
          let partName = standardizeIngredientName(m[3]);
          newIngredients.push({ name: partName, amount: partQty || 1, unit: partUnit });
        } else {
          newIngredients.push({ name: standardizeIngredientName(p), amount: 1, unit: '' });
        }
      });
      totalIngredientsCleaned++;
      return;
    }

    // Case 0.5: Multiple items like "Hành khô, tỏi, hành lá" or "Hành lá, tiêu, chanh"
    if (rawName.includes(',') && !/cắt|thái|băm|xay|nạo|ngâm|rửa|luộc|bóc|hấp|rang|chiên|nướng|chia|phần/i.test(rawName)) {
      const parts = rawName.split(',');
      if (parts.length > 1 && parts.every(p => p.trim().length > 0 && p.trim().length < 30)) {
        parts.forEach(p => {
          newIngredients.push({
            name: standardizeIngredientName(p),
            amount: 1,
            unit: ''
          });
        });
        totalIngredientsCleaned++;
        return;
      }
    }

    // Case 1: Name contains colon like "Cải bó xôi: 60 g" or "Trứng gà: 1 trứng Chiên"
    if (rawName.includes(':')) {
      const colonMatch = rawName.match(/^([^:]+):\s*([\d\s./-]+)?\s*([a-zA-Zà-ỹÀ-Ỹ]+)?\s*(.*)$/);
      if (colonMatch) {
        rawName = colonMatch[1].trim();
        if (colonMatch[2]) {
          const numStr = colonMatch[2].trim().split(/[-–]/)[0].trim();
          amount = parseFloat(numStr) || amount;
        }
        if (colonMatch[3]) {
          unit = standardizeUnit(colonMatch[3]);
        }
        if (colonMatch[4]) {
          const extra = colonMatch[4].trim();
          if (extra) prepSteps.push(`${standardizeIngredientName(rawName)} ${extra.toLowerCase()}`);
        }
      }
    }

    // Case 2: Prep instructions after comma like "Ba chỉ heo, cắt miếng dài, dày khoảng 3 ngón tay"
    if (rawName.includes(',')) {
      const commaIdx = rawName.indexOf(',');
      const before = rawName.slice(0, commaIdx).trim();
      const after = rawName.slice(commaIdx + 1).trim();
      if (/cắt|thái|băm|xay|nạo|ngâm|rửa|luộc|bóc|lột|đập|ướp|chia|rang|nướng|vắt|khoanh|lát|khúc|sợi|tùy thích|thay bằng/i.test(after)) {
        rawName = before;
        if (!/tùy thích|thay bằng/i.test(after)) {
          prepSteps.push(`${standardizeIngredientName(before)} ${after.toLowerCase()}`);
          totalPrepsExtracted++;
        }
      }
    }

    // Case 3: Parentheses like "Hạt dẻ cười (bóc vỏ)" or "Nấm đông cô (ngâm nở)"
    const parenMatch = rawName.match(/^(.*?)\((.*?)\)$/);
    if (parenMatch) {
      const before = parenMatch[1].trim();
      const inside = parenMatch[2].trim();
      if (/cắt|thái|băm|xay|nạo|ngâm|rửa|luộc|bóc|lột|đập|ướp|chia|rang|nướng|vắt|khoanh|lát|khúc|sợi/i.test(inside)) {
        rawName = before;
        prepSteps.push(`${standardizeIngredientName(before)} ${inside.toLowerCase()}`);
        totalPrepsExtracted++;
      }
    }

    // Case 4: Adjectives/verbs inline like "Nấm đông cô ngâm mềm thái lựa" -> "Nấm đông cô", prep: "ngâm mềm thái lựa"
    const prepVerbMatch = rawName.match(/^(.*?)\s+(ngâm mềm.*|thái lát.*|thái mỏng.*|thái sợi.*|luộc chín.*|hấp chín.*|rang vàng.*|rang thơm.*|rửa sạch.*|bóc vỏ.*|cắt khúc.*|nạo sợi.*)$/i);
    if (prepVerbMatch) {
      rawName = prepVerbMatch[1].trim();
      prepSteps.push(`${standardizeIngredientName(rawName)} ${prepVerbMatch[2].toLowerCase()}`);
      totalPrepsExtracted++;
    }

    // Clean leading "Thìa" or numbers in name like "Thìa Gạo vo sạch..."
    if (/^thìa\s+/i.test(rawName)) {
      rawName = rawName.replace(/^thìa\s+/i, '').trim();
      if (!unit) unit = 'muỗng canh';
    }

    const cleanName = standardizeIngredientName(rawName);

    newIngredients.push({
      name: cleanName,
      amount: typeof amount === 'number' ? amount : (parseFloat(amount) || 1),
      unit: unit || ''
    });
  });

  // Assign cleaned ingredients
  recipe.ingredients = newIngredients;

  // Add prep step if we extracted any preparation steps
  if (prepSteps.length > 0) {
    const prepContent = `Sơ chế: ${prepSteps.join('; ')}.`;
    // Check if recipe already mentions prep in first step
    if (recipe.steps && recipe.steps.length > 0) {
      const firstStep = recipe.steps[0];
      const firstInstruction = typeof firstStep === 'string' ? firstStep : (firstStep.instruction || firstStep.content || '');
      if (!firstInstruction.toLowerCase().includes('sơ chế') && !firstInstruction.toLowerCase().includes(prepSteps[0].toLowerCase())) {
        recipe.steps.unshift({
          instruction: prepContent
        });
      }
    } else {
      recipe.steps = [{ instruction: prepContent }];
    }
  }
});

// Re-generate standardized units & catalog
const unitCounts = new Map();
const catalogMap = new Map();

data.recipes.forEach(r => {
  r.ingredients.forEach(i => {
    if (i.unit) {
      unitCounts.set(i.unit, (unitCounts.get(i.unit) || 0) + 1);
    }
    if (i.name) {
      const norm = i.name.trim();
      if (!catalogMap.has(norm)) {
        let cat = 'Khác';
        const lower = norm.toLowerCase();
        if (/thịt|gà|bò|heo|vịt|ngan|sườn|giò|chả|xúc xích|lạp xưởng/.test(lower)) cat = 'Thịt';
        else if (/cá|tôm|mực|cua|nghêu|sò|ốc|hải sản/.test(lower)) cat = 'Hải sản';
        else if (/rau|hành|cà |ớt|nấm|giá|bắp|dưa|khoai|ngò|tía tô|mùi/.test(lower)) cat = 'Rau củ';
        else if (/muối|đường|mắm|tiêu|hạt nêm|bột ngọt|dầu|tương|giấm|ngũ vị|cà ri|mật ong|bơ/.test(lower)) cat = 'Gia vị';
        else if (/gạo|bún|phở|mì|miến|bột|bánh/.test(lower)) cat = 'Ngũ cốc & Bột';
        else if (/sữa|trứng|phô mai|sữa chua/.test(lower)) cat = 'Trứng & Sữa';
        else if (/hạt|đậu|mè|lạc/.test(lower)) cat = 'Hạt & Đậu';

        catalogMap.set(norm, {
          name: norm,
          default_unit: i.unit || '',
          default_category: cat
        });
      }
    }
  });
});

const unitsArray = Array.from(unitCounts.keys()).map((unitName, idx) => ({
  id: `unit-std-${idx + 1}`,
  name: unitName,
  symbol: unitName,
  type: ['g', 'kg'].includes(unitName) ? 'weight' : ['ml', 'lít'].includes(unitName) ? 'volume' : 'count',
  is_custom: false
}));

const catalogArray = Array.from(catalogMap.values()).map((item, idx) => ({
  id: `catalog-std-${idx + 1}`,
  ...item
}));

data.units = unitsArray;
data.catalog = catalogArray;

// Write updated JSON
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');

// Also update individual files in CookBook-Recipes-JSON and CookbookData/recipes
if (fs.existsSync(jsonDir)) {
  data.recipes.forEach(r => {
    const slug = r.slug || r.title.toLowerCase().replace(/\s+/g, '-');
    const target = path.join(jsonDir, `${slug}.json`);
    fs.writeFileSync(target, JSON.stringify(r, null, 2), 'utf8');
  });
}

if (fs.existsSync(appDataDir)) {
  data.recipes.forEach(r => {
    const slug = r.slug || r.title.toLowerCase().replace(/\s+/g, '-');
    const target = path.join(appDataDir, `${slug}.json`);
    fs.writeFileSync(target, JSON.stringify(r, null, 2), 'utf8');
  });
}

console.log(`Cleaned successfully!`);
console.log(`Total preps extracted & added to steps: ${totalPrepsExtracted}`);
console.log(`Total lumped ingredients split: ${totalIngredientsCleaned}`);
console.log(`Standard units count: ${unitsArray.length}`);
console.log(`Standard catalog count: ${catalogArray.length}`);
