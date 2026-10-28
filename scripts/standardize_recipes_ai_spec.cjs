const fs = require('fs');
const path = require('path');

const RECIPES_DIR = 'P:/CookbookData/recipes';
const INDEX_PATH = 'P:/CookbookData/recipes_index.json';

// ==========================================
// 1. CANONICAL INGREDIENT DICTIONARY
// ==========================================
const CANONICAL_NAMES = {
  'ba chỉ': 'Thịt ba chỉ heo',
  'ba chỉ heo': 'Thịt ba chỉ heo',
  'thịt ba chỉ': 'Thịt ba chỉ heo',
  'thịt ba chỉ heo': 'Thịt ba chỉ heo',
  'thịt ba rọi': 'Thịt ba chỉ heo',
  'ba rọi': 'Thịt ba chỉ heo',
  'thịt heo ba chỉ': 'Thịt ba chỉ heo',
  'thịt heo': 'Thịt heo',
  'thịt lợn': 'Thịt heo',
  'thịt nạc': 'Thịt nạc heo',
  'thịt nạc heo': 'Thịt nạc heo',
  'thịt heo xay': 'Thịt heo xay',
  'thịt lợn xay': 'Thịt heo xay',
  'thịt băm': 'Thịt heo xay',
  'thịt nạc xay': 'Thịt heo xay',
  'sườn heo': 'Sườn heo',
  'sườn non': 'Sườn heo',
  'sườn': 'Sườn heo',
  'sườn cốt lết': 'Sườn cốt lết heo',
  'sườn cốt lết heo': 'Sườn cốt lết heo',
  'thịt nạc vai': 'Thịt nạc vai heo',
  'thịt nạc vai heo': 'Thịt nạc vai heo',
  'thịt vai': 'Thịt nạc vai heo',
  'gan heo': 'Gan heo',
  'mì tươi': 'Mì tươi',
  'mỳ tươi': 'Mì tươi',
  'xương gà': 'Xương gà',
  'nước dùng gà': 'Nước dùng gà',
  'củ cải trắng': 'Củ cải trắng',
  'củ cải': 'Củ cải trắng',
  'thịt bò': 'Thịt bò',
  'bắp bò': 'Thịt bắp bò',
  'thăn bò': 'Thịt thăn bò',
  'thịt bò xay': 'Thịt bò xay',
  'thịt gà': 'Thịt gà',
  'gà': 'Thịt gà',
  'gà mái ri': 'Thịt gà mái ri',
  'ức gà': 'Thịt ức gà',
  'thịt ức gà': 'Thịt ức gà',
  'đùi gà': 'Thịt đùi gà',
  'thịt đùi gà': 'Thịt đùi gà',
  'cánh gà': 'Cánh gà',
  'thịt vịt': 'Thịt vịt',
  'vịt': 'Thịt vịt',
  'thịt ngan': 'Thịt ngan',
  'ngan': 'Thịt ngan',
  'tôm': 'Tôm',
  'tôm tươi': 'Tôm',
  'tôm sú': 'Tôm sú',
  'tôm khô': 'Tôm khô',
  'mực': 'Mực',
  'mực tươi': 'Mực',
  'cá': 'Cá phi lê',
  'cá hồi': 'Cá hồi',
  'cá lóc': 'Cá lóc',
  'cá rô đồng': 'Cá rô đồng',
  'cá basa': 'Cá basa',
  'cá thu': 'Cá thu',
  'chả cá thu': 'Chả cá thu',
  'chả cá': 'Chả cá',
  'giò lụa': 'Giò lụa',
  'mọc': 'Giò sống (Mọc)',
  'giò sống': 'Giò sống (Mọc)',
  'chả cốm': 'Chả cốm',
  'trứng': 'Trứng gà',
  'trứng gà': 'Trứng gà',
  'trứng vịt': 'Trứng vịt',
  'trứng cút': 'Trứng cút',
  'lòng đỏ trứng gà': 'Lòng đỏ trứng gà',
  'hành': 'Hành tím',
  'hành tím': 'Hành tím',
  'hành khô': 'Hành tím',
  'hành củ': 'Hành tím',
  'hành tây': 'Hành tây',
  'hành lá': 'Hành lá',
  'tỏi': 'Tỏi',
  'gừng': 'Gừng',
  'sả': 'Sả',
  'ớt': 'Ớt',
  'ớt sừng': 'Ớt sừng',
  'ớt chuông': 'Ớt chuông',
  'chanh': 'Chanh',
  'cà chua': 'Cà chua',
  'cà rốt': 'Cà rốt',
  'carrot': 'Cà rốt',
  'khoai tây': 'Khoai tây',
  'khoai lang': 'Khoai lang',
  'dưa leo': 'Dưa leo',
  'dưa chuột': 'Dưa leo',
  'su hào': 'Su hào',
  'bắp cải': 'Bắp cải',
  'cải ngọt': 'Cải ngọt',
  'cải thìa': 'Cải thìa',
  'cải thảo': 'Cải thảo',
  'cải cúc': 'Cải cúc',
  'cải kale': 'Cải kale',
  'bông cải xanh': 'Bông cải xanh',
  'súp lơ xanh': 'Bông cải xanh',
  'bí đỏ': 'Bí đỏ',
  'bí đao': 'Bí đao',
  'mướp': 'Mướp hương',
  'mướp hương': 'Mướp hương',
  'rau mồng tơi': 'Rau mồng tơi',
  'ngò rí': 'Ngò rí',
  'rau mùi': 'Rau mùi',
  'rau răm': 'Rau răm',
  'húng quế': 'Húng quế',
  'lá chanh': 'Lá chanh',
  'tía tô': 'Tía tô',
  'kinh giới': 'Kinh giới',
  'lá lốt': 'Lá lốt',
  'dọc mùng': 'Dọc mùng',
  'giá đỗ': 'Giá đỗ',
  'giá': 'Giá đỗ',
  'nấm hương': 'Nấm hương',
  'nấm đông cô': 'Nấm đông cô',
  'nấm rơm': 'Nấm rơm',
  'nấm kim châm': 'Nấm kim châm',
  'nấm đùi gà': 'Nấm đùi gà',
  'nấm bào ngư': 'Nấm bào ngư',
  'mộc nhĩ': 'Mộc nhĩ',
  'nấm mèo': 'Mộc nhĩ',
  'đậu phụ': 'Đậu phụ',
  'đậu hũ': 'Đậu phụ',
  'đậu hũ non': 'Đậu hũ non',
  'đậu phộng': 'Đậu phộng (Lạc)',
  'lạc': 'Đậu phộng (Lạc)',
  'vừng trắng': 'Mè trắng (Vừng)',
  'mè trắng': 'Mè trắng (Vừng)',
  'mè': 'Mè trắng (Vừng)',
  'bún tươi': 'Bún tươi',
  'bún': 'Bún tươi',
  'bánh đa': 'Bánh đa đỏ',
  'bánh đa đỏ': 'Bánh đa đỏ',
  'phở tươi': 'Bánh phở tươi',
  'bánh phở': 'Bánh phở tươi',
  'miến': 'Miến dong',
  'mì': 'Mì sợi',
  'mì ý': 'Mì Ý (Spaghetti)',
  'mì ý (spaghetti)': 'Mì Ý (Spaghetti)',
  'nui': 'Nui',
  'bánh mì': 'Bánh mì',
  'bánh mì sandwich': 'Bánh mì sandwich',
  'gạo': 'Gạo tẻ',
  'gạo tẻ': 'Gạo tẻ',
  'gạo lứt': 'Gạo lứt',
  'nếp': 'Gạo nếp',
  'gạo nếp': 'Gạo nếp',
  'yến mạch': 'Bột yến mạch',
  'bột yến mạch': 'Bột yến mạch',
  'nước mắm': 'Nước mắm',
  'nước tương': 'Nước tương',
  'xì dầu': 'Nước tương',
  'dầu hào': 'Dầu hào',
  'dầu ăn': 'Dầu ăn',
  'dầu mè': 'Dầu mè',
  'dầu ô liu': 'Dầu ô liu',
  'dầu màu điều': 'Dầu màu điều',
  'mắm tôm': 'Mắm tôm',
  'muối': 'Muối',
  'muối tinh': 'Muối',
  'đường': 'Đường',
  'đường cát': 'Đường',
  'đường phèn': 'Đường phèn',
  'đường thốt nốt': 'Đường thốt nốt',
  'hạt nêm': 'Hạt nêm',
  'bột ngọt': 'Bột ngọt',
  'mì chính': 'Bột ngọt',
  'tiêu': 'Tiêu xay',
  'tiêu xay': 'Tiêu xay',
  'tiêu đen': 'Tiêu đen xay',
  'tiêu đen xay': 'Tiêu đen xay',
  'tiêu sọ': 'Tiêu sọ',
  'bột mì': 'Bột mì',
  'bột mì đa dụng': 'Bột mì đa dụng',
  'bột bắp': 'Bột bắp',
  'bột năng': 'Bột năng',
  'bột chiên giòn': 'Bột chiên giòn',
  'bột nghệ': 'Bột nghệ',
  'ngũ vị hương': 'Ngũ vị hương',
  'sữa tươi': 'Sữa tươi không đường',
  'sữa tươi không đường': 'Sữa tươi không đường',
  'sữa đặc': 'Sữa đặc',
  'sữa chua': 'Sữa chua không đường',
  'nước cốt dừa': 'Nước cốt dừa',
  'nước dừa tươi': 'Nước dừa tươi',
  'nước dừa': 'Nước dừa tươi',
  'bơ lạt': 'Bơ lạt',
  'phô mai': 'Phô mai',
  'phô mai mozzarella': 'Phô mai Mozzarella'
};

const UNIT_MAP = {
  'gr': 'g', 'gram': 'g', 'grams': 'g', 'gam': 'g', 'kilo': 'kg', 'kilogram': 'kg',
  'lit': 'lít', 'liter': 'lít', 'l': 'lít', 'mililit': 'ml',
  'mc': 'muỗng canh', 'tbsp': 'muỗng canh', 'tbs': 'muỗng canh', 'thìa canh': 'muỗng canh', 'thìa súp': 'muỗng canh',
  'mcf': 'muỗng cà phê', 'tsp': 'muỗng cà phê', 'thìa cà phê': 'muỗng cà phê', 'thìa cafe': 'muỗng cà phê', 'cf': 'muỗng cà phê',
  'qua': 'quả', 'trai': 'trái', 'cu': 'củ', 'cai': 'cái', 'bo': 'bó', 'nhanh': 'nhánh', 'tep': 'tép',
  'lat': 'lát', 'mieng': 'miếng', 'chen': 'chén', 'bat': 'bát', 'lon': 'lon', 'hop': 'hộp', 'goi': 'gói',
  'khúc': 'khúc', 'nhúm': 'nhúm', 'ít': 'ít', 'chút': 'chút', 'tai': 'tai', 'phần': 'phần', 'con': 'con'
};

function normalizeUnit(u) {
  if (!u) return '';
  const lower = u.trim().toLowerCase();
  return UNIT_MAP[lower] || u.trim();
}

function formatString(str) {
  if (!str || typeof str !== 'string') return '';
  let clean = str.trim();
  if (clean.length > 0 && clean === clean.toUpperCase()) {
    clean = clean.toLowerCase();
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

const PREP_VERB_REGEX = /thái|cắt|băm|xay|nạo|rửa|luộc|ngâm|bóc|lột|đập|ướp|chia|rang|nướng|vắt|khoanh|lát|khúc|sợi|nhuyễn|bổ múi|bỏ vỏ|bỏ hạt|đun sôi|chần sơ|làm sạch|để ráo|vo sạch|khử mùi|bổ cau|mỏng|nhỏ|vừa ăn|chín|mềm/i;

// Parse single ingredient raw string or object
function parseAndCleanIngredient(ing, dishTitle = '') {
  let rawName = (typeof ing === 'string' ? ing : ing.name || '').trim();
  let quantity = typeof ing === 'object' && ing.quantity !== undefined ? ing.quantity : 1;
  let unit = typeof ing === 'object' ? normalizeUnit(ing.unit) : '';
  let prepNotes = [];

  // Remove leading numbers, bullets, colons
  rawName = rawName.replace(/^[-•*+\d\s.,:]+/, '').replace(/[-•*+\s.,:]+$/, '').trim();

  // Strip accidental unit prefixes or conversational prefixes like "Ram thịt lợn xay", "Ml nước sôi", "Hoặc bột nghệ", "Xiu muối"
  rawName = rawName.replace(/^(?:ram|gram|gr|ml|kg|lít|gam|xiu|chút|ít|hoặc|phần|thìa|muỗng)\s+/i, '').trim();

  // 1. Check if name is placeholder matching dish title
  if (dishTitle && rawName.toLowerCase() === dishTitle.toLowerCase().trim()) {
    return { isDishNamePlaceholder: true };
  }

  // 2. Check for merged ingredients (Gia vị thông dụng, Gia vị:, v.v.)
  if (/Gia vị thông dụng/i.test(rawName) || /Gia vị:/i.test(rawName) || /Gia vị sốt:/i.test(rawName)) {
    const listMatch = rawName.match(/\((.*?)\)|:\s*(.*)/);
    const inner = listMatch ? (listMatch[1] || listMatch[2]) : '';
    if (inner) {
      const parts = inner.split(/[,;+–—/]/).map(p => p.trim()).filter(Boolean);
      const splitItems = [];
      for (const p of parts) {
        if (!p || p === '…' || p === '...') continue;
        let cleanP = p.replace(/^và\s+/i, '').trim();
        let pUnit = 'muỗng cà phê';
        let pQty = 1;
        if (/hành|tỏi/i.test(cleanP)) { pUnit = 'củ'; pQty = 2; }
        else if (/nước mắm|dầu ăn|dầu hào|giấm/i.test(cleanP)) { pUnit = 'muỗng canh'; pQty = 1; }
        else if (/tiêu/i.test(cleanP)) { pUnit = 'muỗng cà phê'; pQty = 0.5; cleanP = 'Tiêu xay'; }
        else if (/muối/i.test(cleanP)) { pUnit = 'muỗng cà phê'; pQty = 0.5; }
        else if (/đường/i.test(cleanP)) { pUnit = 'muỗng cà phê'; pQty = 1; }

        splitItems.push({
          name: formatString(CANONICAL_NAMES[cleanP.toLowerCase()] || cleanP),
          quantity: pQty,
          unit: pUnit,
          prepNote: ''
        });
      }
      return { splitItems };
    }
  }

  // 2b. Check for double merged items like "Mộc nhĩ, nấm hương ngâm nở băm nhỏ" or "Hành lá, ngò rí"
  if (rawName.includes(',') && !rawName.includes('(')) {
    const commaParts = rawName.split(',').map(s => s.trim()).filter(Boolean);
    if (commaParts.length === 2 && !PREP_VERB_REGEX.test(commaParts[0])) {
      const first = commaParts[0];
      const second = commaParts[1];
      let secondClean = second;
      let sharedPrep = '';
      const verbMatch = second.match(PREP_VERB_REGEX);
      if (verbMatch) {
        const vIdx = second.search(PREP_VERB_REGEX);
        sharedPrep = second.slice(vIdx).trim();
        secondClean = second.slice(0, vIdx).trim();
      }
      if (secondClean && CANONICAL_NAMES[secondClean.toLowerCase()]) {
        return {
          splitItems: [
            {
              name: CANONICAL_NAMES[first.toLowerCase()] || formatString(first),
              quantity: Math.max(1, Math.round(quantity / 2)),
              unit: unit || 'g',
              prepNote: sharedPrep
            },
            {
              name: CANONICAL_NAMES[secondClean.toLowerCase()] || formatString(secondClean),
              quantity: Math.max(1, Math.round(quantity / 2)),
              unit: unit || 'g',
              prepNote: sharedPrep
            }
          ]
        };
      }
    }
  }

  // Parenthesis with quantity & unit, e.g. "Tiêu ($1/2$ thìa cà phê)", "Dầu hào (2 thìa)"
  const parenQtyMatch = rawName.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenQtyMatch) {
    const main = parenQtyMatch[1].trim();
    const inside = parenQtyMatch[2].trim();
    const cleanInside = inside.replace(/\$/g, '').trim();
    const qMatch = cleanInside.match(/^(\d+(?:[.,/]\d+)?)\s*(thìa canh|muỗng canh|thìa cà phê|muỗng cà phê|thìa|muỗng|g|ml)?/i);
    if (qMatch) {
      rawName = main;
      const valStr = qMatch[1].replace(',', '.');
      quantity = valStr.includes('/') ? (parseFloat(valStr.split('/')[0]) / parseFloat(valStr.split('/')[1])) : parseFloat(valStr);
      if (qMatch[2]) {
        let u = qMatch[2].toLowerCase();
        if (u === 'thìa' || u === 'muỗng') u = 'muỗng canh';
        unit = normalizeUnit(u);
      }
    }
  }

  // Spoon prefix removal, e.g. "Muỗng cà phê muối", "Café muối hoặc bột gia vị"
  const spoonPrefixMatch = rawName.match(/^(?:[¼½¾\d/.,\s]+)?(?:muỗng|thìa|café|cà phê)\s+(?:cà phê|café|canh|súp)?\s*(.*)$/i);
  if (spoonPrefixMatch && spoonPrefixMatch[1]) {
    rawName = spoonPrefixMatch[1].trim();
  }

  // 3. Extract quantity/unit embedded in name
  const embeddedQtyMatch = rawName.match(/^(.*?)[,:\s]+(?:khoảng\s*)?(\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?)\s*(g|gr|gram|kg|ml|lít|muỗng canh|muỗng cà phê|thìa canh|thìa cà phê|quả|trái|củ|cái|tai|nhánh|tép|lát|miếng)$/i);
  if (embeddedQtyMatch) {
    rawName = embeddedQtyMatch[1].trim();
    if (!unit) unit = normalizeUnit(embeddedQtyMatch[3]);
    const num = embeddedQtyMatch[2].replace(',', '.');
    quantity = num.includes('-') ? parseFloat(num.split('-')[1]) : parseFloat(num);
  }

  const prefixQtyMatch = rawName.match(/^(\d+(?:[.,]\d+)?)\s*(g|gr|gram|kg|ml|lít|muỗng canh|muỗng cà phê|thìa canh|thìa cà phê|quả|trái|củ|cái|nhánh|tép|lát|miếng)\s+(.*)$/i);
  if (prefixQtyMatch) {
    if (!unit) unit = normalizeUnit(prefixQtyMatch[2]);
    quantity = parseFloat(prefixQtyMatch[1].replace(',', '.'));
    rawName = prefixQtyMatch[3].trim();
  }

  if (rawName.startsWith('½') || rawName.startsWith('1/2')) {
    quantity = 0.5;
    rawName = rawName.replace(/^(?:½|1\/2)\s*/, '');
    const unitMatch = rawName.match(/^(thìa canh|muỗng canh|thìa cà phê|muỗng cà phê|quả|củ|trái)\s+(.*)$/i);
    if (unitMatch) {
      if (!unit) unit = normalizeUnit(unitMatch[1]);
      rawName = unitMatch[2].trim();
    }
  }

  // 4. Extract prep notes from comma: "Ba chỉ heo thái sợi, ngâm nước mắm" or "Ba chỉ heo, thái sợi, ngâm nước mắm"
  if (rawName.includes(',')) {
    const parts = rawName.split(',').map(s => s.trim()).filter(Boolean);
    const mainPart = parts[0];
    const otherParts = parts.slice(1);
    
    let allPrep = true;
    for (const part of otherParts) {
      if (PREP_VERB_REGEX.test(part)) {
        prepNotes.push(part);
      } else {
        allPrep = false;
      }
    }
    if (allPrep || prepNotes.length > 0) {
      rawName = mainPart;
    }
  }

  // 5. Extract prep notes from parenthesis: "Nấm đông cô (ngâm mềm thái sợi)"
  const parenMatch = rawName.match(/^(.*?)\((.*?)\)$/);
  if (parenMatch) {
    const before = parenMatch[1].trim();
    const inside = parenMatch[2].trim();
    if (PREP_VERB_REGEX.test(inside)) {
      rawName = before;
      prepNotes.push(inside);
    }
  }

  // 6. Extract trailing prep words: "Vừng trắng bỏ vỏ", "Thịt gà xé sợi", "Sữa tươi không đường chia làm 2 phần"
  const trailingPrepRegex = /\s+(chia làm \d+ phần|bỏ vỏ|bỏ hạt|xé sợi|thái sợi|thái lát|thái chỉ|cắt khúc|cắt lát|băm nhỏ|xay nhuyễn|đập dập|ngâm nở|ngâm mềm|ngâm nước mắm|ngâm mắm|rửa sạch|đun sôi|luộc chín|bổ múi cau|sợi nhỏ)$/i;
  const trailingMatch = rawName.match(trailingPrepRegex);
  if (trailingMatch) {
    prepNotes.push(trailingMatch[1].trim());
    rawName = rawName.replace(trailingPrepRegex, '').trim();
  }

  // Clean conversational fluff like "Su hào có thể", "Bột nghệ cho vàng màu"
  rawName = rawName
    .replace(/\s+có thể$/i, '')
    .replace(/\s+tùy thích$/i, '')
    .replace(/\s+cho vàng màu.*$/i, '')
    .replace(/\s+nhỏ$/i, '')
    .trim();

  // Canonical normalization
  const cleanKey = rawName.toLowerCase().replace(/^(thịt|củ|trái|quả|lá|cây|hạt)\s+/, '');
  const canonical = CANONICAL_NAMES[rawName.toLowerCase()] || CANONICAL_NAMES[cleanKey] || formatString(rawName);

  // If unit is still empty, infer smart default unit
  if (!unit) {
    const cLower = canonical.toLowerCase();
    if (/gà|vịt|cá|heo|bò|tôm|thịt/i.test(cLower)) unit = 'g';
    else if (/trứng/i.test(cLower)) unit = 'quả';
    else if (/chanh/i.test(cLower)) unit = 'quả';
    else if (/hành tây|cà chua|cà rốt|khoai|su hào/i.test(cLower)) unit = 'củ';
    else if (/hành tím|tỏi/i.test(cLower)) unit = 'củ';
    else if (/hành lá|ngò|mùi/i.test(cLower)) unit = 'nhánh';
    else if (/nước mắm|dầu ăn|nước tương|dầu hào/i.test(cLower)) unit = 'muỗng canh';
    else if (/muối|tiêu|đường|hạt nêm/i.test(cLower)) unit = 'muỗng cà phê';
    else if (/sữa|nước/i.test(cLower)) unit = 'ml';
    else unit = 'g';
  }

  return {
    item: {
      name: canonical,
      quantity: typeof quantity === 'number' ? Math.round(quantity * 100) / 100 : quantity,
      unit: unit
    },
    prepNote: prepNotes.join(', ')
  };
}

// ==========================================
// 2. DISH FALLBACK GENERATOR FOR PLACEHOLDERS
// ==========================================
function generateAuthenticDish(title, category = '') {
  const t = title.toLowerCase();

  // 1. Identify primary protein
  let protein = { name: 'Thịt heo xay', quantity: 200, unit: 'g' };
  if (/ức gà/i.test(t)) protein = { name: 'Thịt ức gà', quantity: 250, unit: 'g' };
  else if (/gà/i.test(t)) protein = { name: 'Thịt gà', quantity: 300, unit: 'g' };
  else if (/ngan/i.test(t)) protein = { name: 'Thịt ngan', quantity: 350, unit: 'g' };
  else if (/bò/i.test(t)) protein = { name: 'Thịt bò', quantity: 200, unit: 'g' };
  else if (/ba chỉ/i.test(t)) protein = { name: 'Thịt ba chỉ heo', quantity: 250, unit: 'g' };
  else if (/sườn/i.test(t)) protein = { name: 'Sườn heo', quantity: 350, unit: 'g' };
  else if (/thịt bằm|thịt xay|thịt băm/i.test(t)) protein = { name: 'Thịt heo xay', quantity: 200, unit: 'g' };
  else if (/cá hồi/i.test(t)) protein = { name: 'Cá hồi', quantity: 200, unit: 'g' };
  else if (/cá rô/i.test(t)) protein = { name: 'Cá rô đồng', quantity: 300, unit: 'g' };
  else if (/cá thu/i.test(t)) protein = { name: 'Cá thu', quantity: 250, unit: 'g' };
  else if (/cá/i.test(t)) protein = { name: 'Cá phi lê', quantity: 250, unit: 'g' };
  else if (/tôm/i.test(t)) protein = { name: 'Tôm', quantity: 200, unit: 'g' };
  else if (/lươn/i.test(t)) protein = { name: 'Thịt lươn', quantity: 200, unit: 'g' };
  else if (/cua/i.test(t)) protein = { name: 'Cua đồng', quantity: 350, unit: 'g' };
  else if (/mọc/i.test(t)) protein = { name: 'Giò sống (Mọc)', quantity: 150, unit: 'g' };
  else if (/đậu hũ|đậu phụ/i.test(t)) protein = { name: 'Đậu phụ', quantity: 3, unit: 'miếng' };

  // 2. Identify primary carb & dish structure
  let carb = null;
  let veggies = [];
  let seasonings = [
    { name: 'Hành tím', quantity: 2, unit: 'củ' },
    { name: 'Nước mắm', quantity: 1.5, unit: 'muỗng canh' },
    { name: 'Hạt nêm', quantity: 1, unit: 'muỗng cà phê' },
    { name: 'Tiêu xay', quantity: 0.5, unit: 'muỗng cà phê' }
  ];

  let prep = 15;
  let cook = 20;
  let calories = 450;
  let steps = [];

  if (/bún/i.test(t)) {
    carb = { name: 'Bún tươi', quantity: 400, unit: 'g' };
    veggies = [
      { name: 'Cà chua', quantity: 2, unit: 'quả' },
      { name: 'Hành lá', quantity: 30, unit: 'g' },
      { name: 'Rau sống', quantity: 100, unit: 'g' }
    ];
    prep = 20;
    cook = 25;
    calories = 460;
    steps = [
      { instruction: `Sơ chế sạch các nguyên liệu: ${protein.name} làm sạch cắt miếng vừa ăn; cà chua bổ múi cau; hành lá và rau sống rửa sạch để ráo.` },
      { instruction: `Phi thơm hành tím, xào săn ${protein.name} rồi cho cà chua vào xào tạo màu đẹp. Đổ nước dùng vào đun sôi, nêm gia vị vừa miệng.` },
      { instruction: `Chần bún tươi qua nước sôi cho vào tô, múc ${protein.name} và chan nước dùng nóng hổi lên trên, ăn kèm rau sống tươi ngon.` }
    ];
  } else if (/mì ý|mỳ ý|spaghetti/i.test(t)) {
    carb = { name: 'Mì Ý (Spaghetti)', quantity: 200, unit: 'g' };
    veggies = [
      { name: 'Cà chua', quantity: 2, unit: 'quả' },
      { name: 'Tỏi', quantity: 3, unit: 'tép' }
    ];
    seasonings.push({ name: 'Dầu ô liu', quantity: 1, unit: 'muỗng canh' });
    prep = 15;
    cook = 20;
    calories = 480;
    steps = [
      { instruction: `Luộc mì Ý trong nước sôi có pha chút muối trong 8 - 10 phút đến khi sợi mì chín vừa tới (al dente), vớt ra xả nhẹ nước nguội.` },
      { instruction: `Phi thơm tỏi băm với dầu ô liu, cho ${protein.name} vào xào chín săn. Thêm sốt cà chua và nêm nếm gia vị đậm đà.` },
      { instruction: `Cho mì Ý vào chảo sốt đảo đều trong 1 - 2 phút cho ngấm vị, múc ra đĩa và thưởng thức khi còn nóng.` }
    ];
  } else if (/mì|mỳ|ramen/i.test(t)) {
    carb = { name: 'Mì sợi', quantity: 200, unit: 'g' };
    veggies = [
      { name: 'Cải ngọt', quantity: 100, unit: 'g' },
      { name: 'Hành lá', quantity: 20, unit: 'g' }
    ];
    prep = 15;
    cook = 15;
    calories = 430;
    steps = [
      { instruction: `Sơ chế sạch ${protein.name} và các loại rau ăn kèm. Chần sơ mì sợi qua nước sôi.` },
      { instruction: `Nấu nước dùng ngọt thanh từ xương hoặc rau củ, cho ${protein.name} vào nấu chín, nêm nếm gia vị vừa khẩu vị.` },
      { instruction: `Xếp mì vào tô, chan nước dùng nóng và thưởng thức cùng rau cải ngọt và hành lá.` }
    ];
  } else if (/nui/i.test(t)) {
    carb = { name: 'Nui', quantity: 180, unit: 'g' };
    veggies = [
      { name: 'Cà rốt', quantity: 1, unit: 'củ' },
      { name: 'Hành lá', quantity: 20, unit: 'g' }
    ];
    prep = 15;
    cook = 20;
    calories = 410;
    steps = [
      { instruction: `Luộc nui trong nước sôi khoảng 8 - 10 phút cho chín mềm, vớt ra xả nước lạnh để nui không bị dính.` },
      { instruction: `Xào thơm ${protein.name} với hành tím, thêm cà rốt và đổ nước vào nấu súp ngọt thanh, nêm gia vị vừa ăn.` },
      { instruction: `Múc nui ra tô, chan nước dùng cùng ${protein.name} và rắc hành ngò thái nhỏ lên trên.` }
    ];
  } else if (/cơm/i.test(t)) {
    carb = { name: 'Gạo tẻ', quantity: 200, unit: 'g' };
    veggies = [
      { name: 'Dưa leo', quantity: 1, unit: 'trái' },
      { name: 'Cà chua', quantity: 1, unit: 'quả' }
    ];
    prep = 15;
    cook = 25;
    calories = 520;
    steps = [
      { instruction: `Nấu cơm chín dẻo. Sơ chế sạch ${protein.name} và ướp gia vị đậm đà.` },
      { instruction: `Tiến hành chế biến ${protein.name} (áp chảo, nướng hoặc xào) đến khi chín vàng thơm ngậy.` },
      { instruction: `Xới cơm ra đĩa, xếp ${protein.name} cùng dưa leo, cà chua và thưởng thức.` }
    ];
  } else if (/salad|gỏi|nộm/i.test(t)) {
    carb = null;
    veggies = [
      { name: 'Xà lách', quantity: 150, unit: 'g' },
      { name: 'Cà chua bi', quantity: 8, unit: 'quả' },
      { name: 'Dưa leo', quantity: 1, unit: 'trái' }
    ];
    seasonings = [
      { name: 'Dầu ô liu', quantity: 2, unit: 'muỗng canh' },
      { name: 'Giấm táo', quantity: 1, unit: 'muỗng canh' },
      { name: 'Mật ong', quantity: 1, unit: 'muỗng cà phê' },
      { name: 'Muối', quantity: 0.5, unit: 'muỗng cà phê' }
    ];
    prep = 15;
    cook = 5;
    calories = 290;
    steps = [
      { instruction: `Rau xà lách, cà chua bi, dưa leo rửa sạch ngâm nước muối loãng, vớt ra để thật ráo nước.` },
      { instruction: `Áp chảo hoặc luộc chín ${protein.name}, cắt miếng mỏng vừa ăn.` },
      { instruction: `Pha sốt trộn từ dầu ô liu, giấm táo, mật ong và muối tiêu. Trộn đều rau cùng ${protein.name} và sốt, thưởng thức ngay.` }
    ];
  } else if (/sữa chua|nước ép|trà|sinh tố/i.test(t)) {
    return {
      prep_time: 10,
      cook_time: 0,
      calories: 180,
      ingredients: [
        { name: 'Sữa chua không đường', quantity: 2, unit: 'hộp' },
        { name: 'Sữa đặc', quantity: 2, unit: 'muỗng canh' },
        { name: 'Sữa tươi không đường', quantity: 100, unit: 'ml' },
        { name: 'Đá viên', quantity: 1, unit: 'ly' }
      ],
      steps: [
        { instruction: `Cho sữa chua, sữa tươi và sữa đặc vào bình lắc hoặc máy xay sinh tố.` },
        { instruction: `Thêm đá viên vào lắc mạnh hoặc xay nhuyễn trong 30 giây cho hỗn hợp hòa quyện bông mịn.` },
        { instruction: `Rót ra ly thủy tinh và thưởng thức ngay khi còn mát lạnh.` }
      ]
    };
  } else {
    // Default complete dish
    veggies = [
      { name: 'Hành tây', quantity: 1, unit: 'củ' },
      { name: 'Hành lá', quantity: 20, unit: 'g' }
    ];
    prep = 15;
    cook = 20;
    calories = 430;
    steps = [
      { instruction: `Sơ chế sạch các nguyên liệu: ${protein.name} cắt miếng vừa ăn, ướp với chút hạt nêm, nước mắm và tiêu trong 15 phút.` },
      { instruction: `Bắc chảo lên bếp, phi thơm hành tỏi rồi cho ${protein.name} vào chế biến chín đều thơm ngon.` },
      { instruction: `Nêm nếm lại gia vị cho vừa miệng, rắc hành lá thái nhỏ và bày ra đĩa thưởng thức.` }
    ];
  }

  const allIngredients = [protein, ...(carb ? [carb] : []), ...veggies, ...seasonings];

  return {
    prep_time: prep,
    cook_time: cook,
    calories: calories,
    ingredients: allIngredients,
    steps: steps
  };
}

// ==========================================
// 3. CALORIE ESTIMATION FOR EXISTING DISHES
// ==========================================
function estimateCalories(recipe) {
  const title = (recipe.title || '').toLowerCase();
  const tags = (recipe.tags || []).map(t => String(t).toLowerCase());
  const cat = (recipe.category || '').toLowerCase();

  // Baby weaning
  if (tags.some(t => /\d+m\+/i.test(t)) || cat.includes('ăn dặm') || title.includes('ăn dặm')) {
    if (title.includes('cháo') || title.includes('súp')) return 160;
    if (title.includes('bánh')) return 190;
    return 180;
  }

  // Drinks
  if (cat.includes('đồ uống') || tags.includes('đồ uống') || /cà phê|trà\b|nước ép|sinh tố|smoothie|sữa chua lắc/i.test(title)) {
    if (/cà phê muối|trà sữa|sinh tố/i.test(title)) return 240;
    if (/nước ép|trà đào|trà hoa/i.test(title)) return 110;
    return 160;
  }

  // Desserts / Cakes
  if (cat.includes('tráng miệng') || /bánh ngọt|chè|flan|mousse|panna cotta|crepe|bánh chuối/i.test(title)) {
    return 320;
  }

  // Salad / Nộm
  if (/salad|nộm|gỏi|cuốn/i.test(title)) {
    if (/thịt|gà|bò|tôm/i.test(title)) return 310;
    return 210;
  }

  // Soups / Canh
  if (/^canh\b|^súp\b/i.test(title) && !/bún|miến|phở|mì/i.test(title)) {
    if (/sườn|xương|bò|vịt|thịt/i.test(title)) return 250;
    if (/tôm|cua|cá|nghêu|hến/i.test(title)) return 190;
    return 160;
  }

  // Noodle soups
  if (/bún|phở|mì|mỳ|miến|hủ tiếu|bánh canh|hoành thánh|sủi cảo|ramen/i.test(title)) {
    if (/bò|sườn|heo|giò|vịt/i.test(title)) return 480;
    if (/gà|chả|mọc/i.test(title)) return 430;
    if (/hải sản|tôm|cua|cá/i.test(title)) return 410;
    return 450;
  }

  // Rice dishes
  if (/cơm/i.test(title)) {
    if (/rang|chiên/i.test(title)) return 510;
    return 460;
  }

  // Meats
  if (/bò|sườn|ba chỉ|thịt heo|thịt lợn|vịt/i.test(title)) {
    if (/nướng|chiên|rán|quay/i.test(title)) return 530;
    if (/kho|om|rim|hầm|sốt/i.test(title)) return 470;
    if (/xào/i.test(title)) return 420;
    return 480;
  }

  // Chicken
  if (/gà|ức gà/i.test(title)) {
    if (/eat clean|healthy/i.test(tags.join(' ')) || /hấp|luộc|áp chảo/i.test(title)) return 380;
    if (/nướng|chiên|sốt/i.test(title)) return 450;
    return 410;
  }

  // Seafood
  if (/cá|tôm|mực|hải sản/i.test(title)) {
    if (/chiên|nướng|sốt/i.test(title)) return 390;
    return 340;
  }

  // Vegetarian
  if (/đậu phụ|đậu hũ|nấm|chay/i.test(title)) {
    return 270;
  }

  return 420;
}

// ==========================================
// 4. MAIN PROCESSING ENGINE
// ==========================================
function standardizeAllRecipes() {
  console.log('=== STARTING AI SPECIFICATION STANDARDIZATION ===\n');
  const files = fs.readdirSync(RECIPES_DIR).filter(f => f.endsWith('.json'));
  console.log(`Processing ${files.length} recipe files in ${RECIPES_DIR}...`);

  let caloriesFixedCount = 0;
  let ingredientsCleanedCount = 0;
  let prepNotesEnrichedCount = 0;
  let placeholderDishesUpgradedCount = 0;
  let timesFixedCount = 0;

  const standardizedIndex = [];

  for (const file of files) {
    const fullPath = path.join(RECIPES_DIR, file);
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const title = (data.title || data.name || '').trim();
    const tLower = title.toLowerCase();

    let ings = data.ingredients || [];
    let steps = data.steps || [];

    // Check if this recipe currently has placeholder ingredients (e.g. title as ingredient or empty)
    const isPlaceholder = ings.length === 0 || ings.some(i => (i.name || '').toLowerCase().trim() === tLower && ings.length <= 2);

    if (isPlaceholder) {
      const generated = generateAuthenticDish(title, data.category);
      ings = generated.ingredients;
      steps = generated.steps;
      if (!data.prep_time) data.prep_time = generated.prep_time;
      if (!data.cook_time) data.cook_time = generated.cook_time;
      if (!data.calories) data.calories = generated.calories;
      placeholderDishesUpgradedCount++;
    }

    // Process and clean ingredients
    const cleanIngs = [];
    const extractedPreps = [];

    for (const ing of ings) {
      const res = parseAndCleanIngredient(ing, title);
      if (res.isDishNamePlaceholder) {
        continue;
      }
      if (res.splitItems) {
        for (const item of res.splitItems) {
          cleanIngs.push({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit
          });
        }
        ingredientsCleanedCount++;
      } else if (res.item) {
        if (res.prepNote) {
          extractedPreps.push(`${res.item.name}: ${res.prepNote}`);
          prepNotesEnrichedCount++;
        }
        cleanIngs.push({
          name: res.item.name,
          quantity: res.item.quantity,
          unit: res.item.unit
        });
        ingredientsCleanedCount++;
      }
    }

    // Enrich steps with extracted preparation notes if any exist
    if (extractedPreps.length > 0 && steps.length > 0) {
      const prepSummary = extractedPreps.join('; ');
      const firstStepText = typeof steps[0] === 'string' ? steps[0] : (steps[0].instruction || steps[0].content || '');
      
      // If first step doesn't already contain this instruction, prepend or enhance
      if (!firstStepText.includes(extractedPreps[0].split(':')[1].trim())) {
        const enrichedText = `Sơ chế nguyên liệu: ${prepSummary}. ${firstStepText.replace(/^Sơ chế\s*:\s*/i, '')}`;
        if (typeof steps[0] === 'object') {
          steps[0].instruction = enrichedText;
        } else {
          steps[0] = { instruction: enrichedText };
        }
      }
    }

    // Calories standardization
    let cal = typeof data.calories === 'number' ? data.calories : 0;
    if (cal <= 0) {
      cal = estimateCalories({ title, tags: data.tags, category: data.category, servings: data.servings });
      caloriesFixedCount++;
    }

    // Time standardization
    let prep = typeof data.prep_time === 'number' ? data.prep_time : 15;
    let cook = typeof data.cook_time === 'number' ? data.cook_time : 20;
    const isColdDish = /cà phê|sinh tố|nước ép|trà\b|sữa chua lắc/i.test(title);

    if (prep <= 0) prep = 15;
    if (cook <= 0 && !isColdDish) {
      if (/hầm|ninh|kho|om|bò kho/i.test(title)) cook = 35;
      else if (/nướng|quay/i.test(title)) cook = 25;
      else if (/canh|súp|luộc|hấp/i.test(title)) cook = 20;
      else if (/xào|áp chảo|chiên|rán/i.test(title)) cook = 15;
      else cook = 20;
      timesFixedCount++;
    }

    const total_time_minutes = prep + cook;

    // Build finalized standardized recipe object
    const finalRecipe = {
      ...data,
      prep_time: prep,
      cook_time: cook,
      total_time_minutes,
      calories: cal,
      ingredients: cleanIngs.length > 0 ? cleanIngs : data.ingredients,
      steps: steps.map(s => typeof s === 'string' ? { instruction: s } : s),
      updated_at: new Date().toISOString()
    };

    // Save to recipe JSON
    fs.writeFileSync(fullPath, JSON.stringify(finalRecipe, null, 2), 'utf8');
    standardizedIndex.push(finalRecipe);
  }

  // Update recipes_index.json
  console.log(`Writing updated index to ${INDEX_PATH}...`);
  fs.writeFileSync(INDEX_PATH, JSON.stringify(standardizedIndex, null, 2), 'utf8');

  console.log('\n=== STANDARDIZATION SUMMARY ===');
  console.log(`- Total recipes processed: ${files.length}`);
  console.log(`- Calories calculated & updated: ${caloriesFixedCount} recipes`);
  console.log(`- Times adjusted: ${timesFixedCount} recipes`);
  console.log(`- Ingredients cleaned & standardized: ${ingredientsCleanedCount} items`);
  console.log(`- Preparation notes extracted into steps: ${prepNotesEnrichedCount} items`);
  console.log(`- Placeholder dishes upgraded with authentic culinary data: ${placeholderDishesUpgradedCount}`);
  console.log(`- Updated ${INDEX_PATH} with ${standardizedIndex.length} recipes.`);
}

standardizeAllRecipes();
