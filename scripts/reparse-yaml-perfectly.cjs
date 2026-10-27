const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const yamlDir = 'C:/Users/Admin/Downloads/CookBook-Recipes-YAML-20261025T1938485310700';
const jsonPath = 'C:/Users/Admin/Downloads/cookbook_recipes_import.json';
const jsonDir = 'C:/Users/Admin/Downloads/CookBook-Recipes-JSON';
const appDataDir = 'C:/Users/Admin/Documents/CookbookData/recipes';

const existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Build lookup of current enriched recipes by title / id
const recipeMetaMap = new Map();
existingData.recipes.forEach(r => {
  recipeMetaMap.set(r.title.toLowerCase().trim(), r);
});

function standardizeUnit(rawUnit) {
  if (!rawUnit) return '';
  const u = rawUnit.trim().toLowerCase();
  if (['mc', 'thìa canh', 'thìa súp', 'tbsp', 'muỗng canh'].includes(u)) return 'muỗng canh';
  if (['mcf', 'cf', 'thìa cà phê', 'thìa café', 'thìa cf', 'tsp', 'muỗng cf', 'muỗng cà phê'].includes(u)) return 'muỗng cà phê';
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

function cleanNoun(raw) {
  let name = raw.trim().replace(/^[-*•\d\s.,:]+/, '').trim();
  // Strip trailing notes
  name = name.replace(/\s*\([^)]*\)$/, '').trim();
  name = name.replace(/,.*$/, '').trim();
  name = name.replace(/\s+sơ chế sạch.*$/i, '').trim();
  name = name.replace(/\s+(thái|cắt|băm|xay|nạo|ngâm|rửa|luộc|hấp|rang|chiên|nướng).*$/i, '').trim();

  const direct = {
    'ba chỉ heo': 'Thịt ba chỉ heo',
    'thịt ba chỉ': 'Thịt ba chỉ heo',
    'thịt heo ba chỉ': 'Thịt ba chỉ heo',
    'thịt heo xay': 'Thịt heo xay',
    'thịt lợn xay': 'Thịt heo xay',
    'thịt xay': 'Thịt heo xay',
    'thịt băm': 'Thịt heo xay',
    'thịt ức gà': 'Thịt ức gà',
    'ức gà': 'Thịt ức gà',
    'thịt đùi gà': 'Thịt đùi gà',
    'đùi gà': 'Thịt đùi gà',
    'thịt gà': 'Thịt gà',
    'gà': 'Thịt gà',
    'thịt bò': 'Thịt bò',
    'bò': 'Thịt bò',
    'bắp bò': 'Thịt bắp bò',
    'thăn bò': 'Thịt thăn bò',
    'thịt heo': 'Thịt heo',
    'heo': 'Thịt heo',
    'thịt lợn': 'Thịt heo',
    'sườn heo': 'Sườn heo',
    'sườn cốt lết': 'Sườn heo cốt lết',
    'sườn non': 'Sườn heo',
    'sườn': 'Sườn heo',
    'tôm tươi': 'Tôm',
    'tôm sú': 'Tôm sú',
    'tôm': 'Tôm',
    'tôm khô': 'Tôm khô',
    'mực': 'Mực ống',
    'mực tươi': 'Mực tươi',
    'thịt cua': 'Thịt cua',
    'cua': 'Thịt cua',
    'cá hồi': 'Cá hồi',
    'cá lóc': 'Cá lóc',
    'cá basa': 'Cá basa',
    'cá trôi': 'Cá trôi',
    'cá': 'Cá',
    'trứng gà': 'Trứng gà',
    'trứng vịt': 'Trứng vịt',
    'trứng cút': 'Trứng cút',
    'trứng': 'Trứng gà',
    'lòng đỏ trứng gà': 'Lòng đỏ trứng gà',
    'lòng đỏ trứng muối': 'Lòng đỏ trứng muối',
    'hành tím': 'Hành tím',
    'hành khô': 'Hành tím',
    'hành tây': 'Hành tây',
    'hành củ': 'Hành tím',
    'hành lá': 'Hành lá',
    'tỏi': 'Tỏi',
    'gừng': 'Gừng',
    'sả': 'Sả',
    'cà rốt': 'Cà rốt',
    'khoai tây': 'Khoai tây',
    'khoai lang': 'Khoai lang',
    'khoai môn': 'Khoai môn',
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
    'su hào': 'Su hào',
    'củ đậu': 'Củ đậu',
    'củ sắn': 'Củ đậu',
    'bắp mỹ': 'Bắp mỹ',
    'bắp nữ hoàng': 'Bắp nữ hoàng',
    'bắp non': 'Bắp non',
    'bắp ngọt': 'Bắp mỹ',
    'ngô': 'Bắp mỹ',
    'rong biển': 'Rong biển',
    'chả lụa chay': 'Chả lụa chay',
    'chả lụa chay âu lạc': 'Chả lụa chay',
    'cải bó xôi': 'Cải bó xôi',
    'cải thìa': 'Cải thìa',
    'rau cải': 'Rau cải',
    'cải cúc': 'Cải cúc',
    'xà lách': 'Rau xà lách',
    'rau diếp': 'Rau diếp',
    'rau ngò': 'Rau ngò',
    'ngò rí': 'Rau ngò',
    'ngò': 'Rau ngò',
    'rau mùi': 'Rau mùi',
    'mùi ta': 'Rau mùi',
    'mùi tàu': 'Mùi tàu',
    'thì là': 'Thì là',
    'hoa chuối': 'Hoa chuối',
    'tía tô': 'Lá tía tô',
    'rau húng': 'Rau húng',
    'kinh giới': 'Rau kinh giới',
    'húng quế': 'Húng quế',
    'cần tây': 'Cần tây',
    'rau cần': 'Rau cần',
    'đậu hũ': 'Đậu hũ',
    'đậu que': 'Đậu que',
    'hạt sen': 'Hạt sen',
    'lạc': 'Lạc',
    'đậu phộng': 'Lạc',
    'vừng trắng': 'Mè trắng',
    'mè trắng': 'Mè trắng',
    'mè rang': 'Mè rang',
    'hạt mè': 'Mè trắng',
    'hạt điều': 'Hạt điều',
    'hạt dẻ cười': 'Hạt dẻ cười',
    'yến mạch': 'Yến mạch',
    'gạo': 'Gạo',
    'gạo lứt': 'Gạo lứt',
    'nếp': 'Gạo nếp',
    'đậu đỏ': 'Đậu đỏ',
    'miến': 'Miến dong',
    'bột năng': 'Bột năng',
    'bột bắp': 'Bột bắp',
    'bột mì': 'Bột mì',
    'bột bánh mì': 'Bột làm bánh mì',
    'bột semolina': 'Bột semolina',
    'semolina': 'Bột semolina',
    'bột mỳ căn': 'Bột mì căn (Gluten)',
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
    'muối hạt': 'Muối',
    'đường': 'Đường',
    'đường phèn': 'Đường phèn',
    'đường thốt nốt': 'Đường thốt nốt',
    'tiêu': 'Tiêu xay',
    'tiêu xay': 'Tiêu xay',
    'tiêu đen': 'Tiêu đen xay',
    'tiêu sọ': 'Tiêu sọ',
    'tiêu trắng': 'Tiêu trắng xay',
    'ớt': 'Ớt tươi',
    'ớt hiểm': 'Ớt hiểm',
    'ớt chuông': 'Ớt chuông',
    'ớt bột': 'Ớt bột',
    'ngũ vị hương': 'Ngũ vị hương',
    'nước cốt dừa': 'Nước cốt dừa',
    'nước dừa': 'Nước dừa tươi',
    'nước dừa tươi': 'Nước dừa tươi',
    'nước dừa xiêm': 'Nước dừa tươi',
    'nước màu dừa': 'Nước màu dừa',
    'chanh': 'Chanh',
    'nước cốt chanh': 'Nước cốt chanh',
    'giấm': 'Giấm',
    'mật ong': 'Mật ong',
    'mayonnaise': 'Sốt Mayonnaise',
    'sốt mayonnaise': 'Sốt Mayonnaise',
    'tương cà': 'Tương cà',
    'tương ớt': 'Tương ớt',
    'thơm': 'Trái thơm',
    'trái thơm': 'Trái thơm',
    'dứa': 'Trái thơm'
  };

  const l = name.toLowerCase();
  if (direct[l]) return direct[l];

  // Capitalize first
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Parse an ingredient line from YAML
const KNOWN_UNITS = new Set([
  'g', 'gr', 'gram', 'gam',
  'kg', 'kilo', 'kilogram',
  'ml', 'mililit',
  'l', 'lit', 'lít',
  'mc', 'thìa canh', 'thìa súp', 'tbsp', 'muỗng canh',
  'mcf', 'cf', 'thìa cà phê', 'thìa cf', 'thìa café', 'tsp', 'muỗng cf', 'muỗng cà phê',
  'quả', 'trái',
  'củ',
  'cây', 'nhánh',
  'tép',
  'bó',
  'cái', 'chiếc',
  'miếng', 'lát', 'khúc',
  'chén', 'bát',
  'lon', 'hộp', 'gói', 'nắm', 'con', 'bìa',
  'cup', 'muôi',
  'chút', 'xíu'
]);

function parseYamlIngredientLine(line) {
  let str = line.trim();
  str = str.replace(/^[-*•]\s*/, '').trim();

  // Normalize Unicode fractions
  str = str.replace(/¼/g, '1/4 ')
           .replace(/½/g, '1/2 ')
           .replace(/¾/g, '3/4 ')
           .replace(/⅓/g, '1/3 ')
           .replace(/⅔/g, '2/3 ')
           .replace(/⅛/g, '1/8 ')
           .replace(/⅜/g, '3/8 ')
           .replace(/⅝/g, '5/8 ')
           .replace(/⅞/g, '7/8 ')
           .replace(/\s+/g, ' ');

  // Strip leading number if not a fraction and followed by "gia vị" or "rau..."
  if (/^\d+(?!\/)[\s.,]+(gia vị|rau ăn kèm|rau sống|rau thơm|các loại rau)/i.test(str)) {
    str = str.replace(/^\d+[\s.,]+/, '').trim();
  }

  // If purely "gia vị" or "gia vị:"
  if (/^gia vị\s*:?$/i.test(str)) {
    return { items: [], prepNotes: [] };
  }

  // Lumped seasonings or vegetables
  if (/^(gia vị|rau ăn kèm|rau sống|rau thơm|các loại rau sống)/i.test(str)) {
    const sub = str.replace(/^[^:]+:\s*/i, '');
    const items = [];
    const prepNotes = [];
    sub.split(/[,;]/).forEach(part => {
      let p = part.trim().replace(/\.\.\.$/, '');
      if (!p || /^các loại/i.test(p)) return;

      let qty = 1;
      let u = '';
      let rawN = p;

      const multiMatch = p.match(/^([\d/.]+)\s*(muỗng canh|muỗng cà phê|muỗng cf|thìa canh|thìa cà phê|thìa café|thìa cf|thìa súp)\s+(.+)$/i);
      if (multiMatch) {
        const rawQ = multiMatch[1].replace(',', '.');
        qty = rawQ.includes('/') ? eval(rawQ) : parseFloat(rawQ);
        u = standardizeUnit(multiMatch[2]);
        rawN = multiMatch[3].trim();
      } else {
        const singleMatch = p.match(/^([\d/.]+)\s*([a-zA-Zà-ỹÀ-Ỹ]+)\s+(.+)$/);
        if (singleMatch && KNOWN_UNITS.has(singleMatch[2].toLowerCase())) {
          const rawQ = singleMatch[1].replace(',', '.');
          qty = rawQ.includes('/') ? eval(rawQ) : parseFloat(rawQ);
          u = standardizeUnit(singleMatch[2]);
          rawN = singleMatch[3].trim();
        }
      }

      const trailingPrep = rawN.match(/^(.*?)\s+(đập dập|băm nhỏ|xay nhuyễn|thái lát|cắt khúc)$/i);
      if (trailingPrep) {
        const n = cleanNoun(trailingPrep[1]);
        prepNotes.push(`${n} ${trailingPrep[2].toLowerCase()}`);
        items.push({ name: n, amount: qty || 1, unit: u });
      } else {
        const n = cleanNoun(rawN);
        if (n && n.length > 1) {
          items.push({ name: n, amount: qty || 1, unit: u });
        }
      }
    });
    return { items, prepNotes };
  }

  // Check multiple vegetables/spices: "Hành khô, tỏi, hành lá" or "Hành tím, tỏi, gốc ngò rí"
  if (/^(hành|tỏi|gừng|sả|ớt|rau|ngò|tiêu|chanh|muối|đường)/i.test(str) && str.includes(',') && !/cắt|thái|băm|xay|dày|ngón tay/i.test(str)) {
    const parts = str.split(',');
    if (parts.length > 1 && parts.every(p => p.trim().length > 0 && p.trim().length < 25)) {
      const items = parts.map(p => ({
        name: cleanNoun(p),
        amount: 1,
        unit: ''
      }));
      return { items, prepNotes: [] };
    }
  }

  let parsedAmount = 1;
  let parsedUnit = '';
  let parsedName = str;
  let prepNote = null;

  // Match leading quantity: e.g. "300 gr", "1/2 muỗng canh", "2 thìa cà phê", "1"
  // Try multi-word units first
  const multiUnitMatch = str.match(/^([\d/.,]+)\s*(muỗng canh|muỗng cà phê|muỗng cf|thìa canh|thìa cà phê|thìa café|thìa cf|thìa súp)\s+(.*)$/i);
  if (multiUnitMatch) {
    const rawVal = multiUnitMatch[1].replace(',', '.');
    parsedAmount = rawVal.includes('/') ? eval(rawVal) : (parseFloat(rawVal) || 1);
    parsedUnit = standardizeUnit(multiUnitMatch[2]);
    parsedName = multiUnitMatch[3].trim();
  } else {
    // Single word unit or just number
    const singleMatch = str.match(/^([\d/.,]+)\s*([a-zA-Zà-ỹÀ-Ỹ]+)?\s*(.*)$/);
    if (singleMatch) {
      const rawVal = singleMatch[1].replace(',', '.');
      parsedAmount = rawVal.includes('/') ? eval(rawVal) : (parseFloat(rawVal) || 1);
      const possibleUnit = (singleMatch[2] || '').trim().toLowerCase();
      if (possibleUnit && KNOWN_UNITS.has(possibleUnit)) {
        parsedUnit = standardizeUnit(possibleUnit);
        parsedName = (singleMatch[3] || '').trim();
      } else {
        // Not a unit! Part of ingredient name
        parsedUnit = '';
        parsedName = `${singleMatch[2] || ''} ${singleMatch[3] || ''}`.trim();
      }
    }
  }

  // Check if parsedName has prep instruction after comma
  if (parsedName.includes(',')) {
    const commaIdx = parsedName.indexOf(',');
    const before = parsedName.slice(0, commaIdx).trim();
    const after = parsedName.slice(commaIdx + 1).trim();
    if (/cắt|thái|băm|xay|nạo|ngâm|rửa|luộc|bóc|lột|đập|ướp|chia|rang|nướng|vắt|khoanh|lát|khúc|sợi|bào|dày|ngón tay|lựu/i.test(after)) {
      parsedName = before;
      prepNote = `${cleanNoun(before)} ${after.toLowerCase()}`;
    } else if (/tùy thích|thay bằng|nếu có/i.test(after)) {
      parsedName = before;
    }
  }

  // Trailing verbs without comma: "tôm tươi thái hạt lựu"
  const trailingVerb = parsedName.match(/^(.*?)\s+(cắt.*|thái.*|băm.*|xay.*|nạo.*|ngâm.*|rửa.*|luộc.*|bóc vỏ.*|bào sợi.*|đập dập.*)$/i);
  if (trailingVerb) {
    const before = trailingVerb[1].trim();
    const after = trailingVerb[2].trim();
    parsedName = before;
    prepNote = `${cleanNoun(before)} ${after.toLowerCase()}`;
  }

  const noun = cleanNoun(parsedName);
  return {
    items: [{ name: noun, amount: parsedAmount, unit: parsedUnit }],
    prepNotes: prepNote ? [prepNote] : []
  };
}

// Process all YAML files
const updatedRecipes = [];

const yamlFiles = fs.readdirSync(yamlDir);
yamlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(yamlDir, file), 'utf8');
  let parsed;
  try {
    parsed = yaml.load(content);
  } catch (e) {
    console.error('Error reading yaml:', file, e);
    return;
  }
  if (!parsed || !parsed.name) return;

  const title = parsed.name.trim();
  const existingRecipe = recipeMetaMap.get(title.toLowerCase());

  const allIngredients = [];
  const prepNotes = [];

  if (Array.isArray(parsed.ingredients)) {
    parsed.ingredients.forEach(rawIng => {
      if (typeof rawIng !== 'string') return;
      const res = parseYamlIngredientLine(rawIng);
      if (res.items) {
        res.items.forEach(it => {
          if (it.name && it.name.length > 1 && !['Gia vị', 'Có thể thay bằng caramel', 'Tùy thích'].includes(it.name)) {
            allIngredients.push(it);
          }
        });
      }
      if (res.prepNotes && res.prepNotes.length > 0) {
        prepNotes.push(...res.prepNotes);
      }
    });
  }

  // Steps
  let steps = [];
  if (existingRecipe && Array.isArray(existingRecipe.steps) && existingRecipe.steps.length > 0) {
    steps = existingRecipe.steps.map(s => ({
      instruction: typeof s === 'string' ? s : (s.instruction || s.content || '')
    }));
  } else if (Array.isArray(parsed.steps)) {
    steps = parsed.steps.map(s => ({
      instruction: typeof s === 'string' ? s : (s.instruction || s.step || '')
    }));
  }

  // Remove any previously generated "Sơ chế: ..." step from steps
  steps = steps.filter(s => {
    const inst = typeof s === 'string' ? s : (s.instruction || s.content || '');
    return !inst.trim().toLowerCase().startsWith('sơ chế:');
  });

  // Prepend prep step if prepNotes exist
  if (prepNotes.length > 0) {
    const prepInstruction = `Sơ chế: ${prepNotes.join('; ')}.`;
    steps.unshift({ instruction: prepInstruction });
  }

  const recipeObj = {
    id: existingRecipe?.id || `recipe-${title.toLowerCase().replace(/\s+/g, '-')}`,
    title: title,
    slug: existingRecipe?.slug || title.toLowerCase().replace(/\s+/g, '-'),
    image_url: existingRecipe?.image_url || parsed.image || '',
    images: existingRecipe?.images || (parsed.image ? [parsed.image] : []),
    parent_id: null,
    prep_time: existingRecipe?.prep_time || 20,
    cook_time: existingRecipe?.cook_time || 30,
    total_time_minutes: existingRecipe?.total_time_minutes || 50,
    difficulty: existingRecipe?.difficulty || 'Vừa',
    calories: existingRecipe?.calories || 450,
    taste_score: 0,
    cooking_history: [],
    servings: existingRecipe?.servings || parsed.servings || 4,
    tags: existingRecipe?.tags || [],
    category: existingRecipe?.category || 'Món chính',
    is_favorite: existingRecipe?.is_favorite || false,
    ingredients: allIngredients,
    steps: steps,
    author_id: 'user',
    created_at: existingRecipe?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    nutrition: {
      calories: existingRecipe?.calories || 450
    }
  };

  updatedRecipes.push(recipeObj);
});

// Re-generate units and catalog
const unitCounts = new Map();
const catalogMap = new Map();

updatedRecipes.forEach(r => {
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
        else if (/rau|hành|cà |ớt|nấm|giá|bắp|dưa|khoai|ngò|tía tô|mùi|chuối|cần|húng|diếp|cúc|thì là/.test(lower)) cat = 'Rau củ';
        else if (/muối|đường|mắm|tiêu|hạt nêm|bột ngọt|dầu|tương|giấm|ngũ vị|cà ri|mật ong|bơ|xì dầu/.test(lower)) cat = 'Gia vị';
        else if (/gạo|bún|phở|mì|miến|bột|bánh|semolina/.test(lower)) cat = 'Ngũ cốc & Bột';
        else if (/sữa|trứng|phô mai|sữa chua/.test(lower)) cat = 'Trứng & Sữa';
        else if (/hạt|đậu|mè|lạc|vừng/.test(lower)) cat = 'Hạt & Đậu';

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

const finalOutput = {
  version: '1.0.0',
  exported_at: new Date().toISOString(),
  units: unitsArray,
  catalog: catalogArray,
  recipes: updatedRecipes
};

fs.writeFileSync(jsonPath, JSON.stringify(finalOutput, null, 2), 'utf8');

if (fs.existsSync(jsonDir)) {
  updatedRecipes.forEach(r => {
    const target = path.join(jsonDir, `${r.slug}.json`);
    fs.writeFileSync(target, JSON.stringify(r, null, 2), 'utf8');
  });
}

if (fs.existsSync(appDataDir)) {
  updatedRecipes.forEach(r => {
    const target = path.join(appDataDir, `${r.slug}.json`);
    fs.writeFileSync(target, JSON.stringify(r, null, 2), 'utf8');
  });
}

console.log('Reparsed all YAML recipes successfully!');
console.log('Total recipes:', updatedRecipes.length);
console.log('Standard units:', unitsArray.length);
console.log('Standard catalog items:', catalogArray.length);
