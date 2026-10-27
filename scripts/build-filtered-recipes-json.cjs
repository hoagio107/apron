const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const NOTION_DIR = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const IMPORT_JSON_PATH = 'C:/Users/Admin/Downloads/cookbook_recipes_import.json';
const OUTPUT_JSON_PATH = 'C:/Users/Admin/Downloads/cookbook_recipes_filtered_non_duplicates.json';
const OUTPUT_DIR_INDIVIDUAL = 'C:/Users/Admin/Downloads/CookBook-Non-Duplicates-JSON';
const OUTPUT_DIR_IMAGES = 'C:/Users/Admin/Downloads/CookBook-Non-Duplicates-Images';

if (!fs.existsSync(OUTPUT_DIR_INDIVIDUAL)) fs.mkdirSync(OUTPUT_DIR_INDIVIDUAL, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR_IMAGES)) fs.mkdirSync(OUTPUT_DIR_IMAGES, { recursive: true });

const importData = JSON.parse(fs.readFileSync(IMPORT_JSON_PATH, 'utf8'));
const existingRecipes = importData.recipes || [];

function decodeHtml(html) {
  return String(html || '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ');
}

function stripAccents(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function cleanTitle(str) {
  return String(str || '')
    .replace(/\s*\(\d+\)$/, '')
    .replace(/\//g, ' ')
    .trim();
}

function normalize(str) {
  return stripAccents(cleanTitle(str))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function phoneticKey(str) {
  let s = normalize(str);
  s = s.replace(/kh/g, 'k');
  s = s.replace(/^gi/, 'r');
  s = s.replace(/gi/g, 'r');
  s = s.replace(/x/g, 's');
  s = s.replace(/tr/g, 'ch');
  return s;
}

function slugify(text) {
  return stripAccents(cleanTitle(text))
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const existingNormalizedSet = new Set();
const existingPhoneticSet = new Set();
const existingWordSets = [];

existingRecipes.forEach(r => {
  const norm = normalize(r.title);
  const phon = phoneticKey(r.title);
  existingNormalizedSet.add(norm);
  existingPhoneticSet.add(phon);

  if (r.slug) {
    existingNormalizedSet.add(normalize(r.slug));
    existingPhoneticSet.add(phoneticKey(r.slug));
  }

  const words = stripAccents(cleanTitle(r.title))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map(w => {
      if (w === 'xot') return 'sot';
      if (w === 'khia') return 'kia';
      if (w === 'gieng') return 'rieng';
      return w;
    });
  existingWordSets.push({ title: r.title, words, norm, phon });
});

const knownDuplicateTitles = new Set([
  phoneticKey('Ba chỉ kìa nước dừa'),
  phoneticKey('Bánh canh bí đỏ'),
  phoneticKey('Bánh canh dai'),
  phoneticKey('Bánh Flan Caramel'),
  phoneticKey('Bánh mỳ chảo'),
  phoneticKey('Bún chả ức gà'),
  phoneticKey('Bún cá'),
  phoneticKey('Bún gạo'),
  phoneticKey('Bún mọc gà nấu chua'),
  phoneticKey('Bún riêu cua'),
  phoneticKey('Bún tươi'),
  phoneticKey('Bột chiên kiểu Hoa'),
  phoneticKey('Chả cá'),
  phoneticKey('Cơm rang yến mạch rau củ ức gà'),
  phoneticKey('Cơm rang ức gà'),
  phoneticKey('Cơm gạo lứt rang ức gà'),
  phoneticKey('Cơm ức gà sốt cà chua'),
  phoneticKey('Cơm ức gà sốt mật ong'),
  phoneticKey('Dưa muối'),
  phoneticKey('Gà xíu mại sốt cà'),
  phoneticKey('Kem chuối'),
  phoneticKey('Muối vừng đa hạt'),
  phoneticKey('Mỳ trứng dai'),
  phoneticKey('Mỳ trứng mềm'),
  phoneticKey('Nui rau củ'),
  phoneticKey('Phở trộn ngũ sắc'),
  phoneticKey('Phở tươi'),
  phoneticKey('Sandwich ức gà áp chảo'),
  phoneticKey('Sốt kem nấm'),
  phoneticKey('Xốt kem nấm'),
  phoneticKey('Sốt mè rang'),
  phoneticKey('Xốt mè rang'),
  phoneticKey('Sốt salad chanh mật ong'),
  phoneticKey('Xốt chanh mật ong'),
  phoneticKey('Sốt sữa chua'),
  phoneticKey('Xốt sữa chua'),
  phoneticKey('Sốt trộn mì phở miến'),
  phoneticKey('Xốt trộn mì miến phở'),
  phoneticKey('Xốt Trộn Phở Trộn Miến'),
  phoneticKey('Sốt bơ lạc'),
  phoneticKey('Xốt bơ đậu phộng'),
  phoneticKey('Sốt miso vị gừng'),
  phoneticKey('Xốt miso')
]);

function isDuplicateOf108(title) {
  const norm = normalize(title);
  const phon = phoneticKey(title);

  if (existingNormalizedSet.has(norm)) return true;
  if (existingPhoneticSet.has(phon)) return true;
  if (knownDuplicateTitles.has(phon)) return true;

  const titleWords = stripAccents(cleanTitle(title))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map(w => {
      if (w === 'xot') return 'sot';
      if (w === 'khia') return 'kia';
      if (w === 'gieng') return 'rieng';
      return w;
    });

  for (const ex of existingWordSets) {
    if (ex.words.length === titleWords.length) {
      const matchAll = ex.words.every((w, idx) => w === titleWords[idx] || titleWords.includes(w));
      if (matchAll) return true;
    }
  }

  return false;
}

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
  'xíu': 'chút',
  'cái': 'cái',
  'khoanh': 'khoanh'
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
  'đường': 'Đường',
  'muối': 'Muối',
  'tiêu': 'Tiêu xay',
  'tiêu xay': 'Tiêu xay',
  'mật ong': 'Mật ong',
  'dầu mè': 'Dầu mè',
  'dầu ăn': 'Dầu ăn',
  'nước tương': 'Nước tương',
  'xì dầu': 'Nước tương',
  'trứng gà': 'Trứng gà',
  'bột bắp': 'Bột bắp',
  'bột năng': 'Bột năng',
  'tương cà': 'Tương cà',
  'tương ớt': 'Tương ớt',
  'mật mía': 'Mật mía',
  'nước mắm': 'Nước mắm',
  'nước mắm chay': 'Nước mắm chay',
  'bột ngọt': 'Bột ngọt',
  'bột cacao': 'Bột cacao',
  'bột ớt': 'Bột ớt',
  'bột tỏi': 'Bột tỏi',
  'gạo': 'Gạo',
  'yến mạch': 'Yến mạch',
  'lá bắp cải': 'Lá bắp cải',
  'bắp cải': 'Bắp cải',
  'bắp cải tím': 'Bắp cải tím',
  'lá chanh': 'Lá chanh',
  'nước cốt chanh': 'Nước cốt chanh'
};

function cleanIngredientName(rawName) {
  let name = decodeHtml(rawName).trim();
  name = name.replace(/\s+cho có màu.*$/i, '');
  name = name.replace(/\s+hoặc bột gia vị.*$/i, '');
  name = name.replace(/\s+xắt hạt lựu.*$/i, '');
  name = name.replace(/\s+vắt lấy nước cốt.*$/i, '');
  name = name.replace(/\s+vo sạch.*$/i, '');
  name = name.replace(/\/ hoặc mật ong.*$/i, '');
  name = name.replace(/[.,:;]+$/, '').trim();

  const lower = name.toLowerCase().trim();
  if (knownNouns[lower]) {
    name = knownNouns[lower];
  } else if (name.length > 0) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }
  return name;
}

function parseIngredientLine(raw) {
  let line = decodeHtml(raw).replace(/^[-_•*·\s]+/, '').trim();
  if (!line || line.length < 2) return null;

  let name = '';
  let amount = 1;
  let unit = '';

  // Colon pattern: "Thịt thăn bò: 300g"
  const colonMatch = line.match(/^([^:]+):\s*([0-9\.,\/\s½⅓⅔¼¾⅛⅜⅝⅞-]+)\s*([a-zA-Zà-ỹÀ-Ỹ\s]+)?(?:\s*-\s*(.*))?$/);
  if (colonMatch) {
    name = colonMatch[1].trim();
    const rawAmt = colonMatch[2].trim();
    const rawUnit = (colonMatch[3] || '').trim().toLowerCase();

    if (fractionMap[rawAmt]) {
      amount = fractionMap[rawAmt];
    } else if (rawAmt.includes('/')) {
      const parts = rawAmt.split('/');
      amount = parseFloat(parts[0]) / parseFloat(parts[1]);
    } else if (rawAmt.includes('-')) {
      const parts = rawAmt.split('-').map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
      amount = parts.length === 2 ? (parts[0] + parts[1]) / 2 : (parts[0] || 1);
    } else {
      amount = parseFloat(rawAmt.replace(',', '.')) || 1;
    }

    if (rawUnit) {
      unit = unitMap[rawUnit] || rawUnit;
    }
    name = cleanIngredientName(name);
    return { name, amount, unit, quantity: amount };
  }

  // Fraction symbol at start: "½ củ cà rốt"
  for (const [fChar, fVal] of Object.entries(fractionMap)) {
    if (line.startsWith(fChar)) {
      amount = fVal;
      let rest = line.slice(fChar.length).trim();
      const uMatch = rest.match(/^(muỗng canh|muỗng cà phê|muỗng cafe|thìa canh|thìa cà phê|thìa cafe|thìa|muỗng|trái|củ|quả|con|nhánh|tép|bó|lát|miếng|khúc|bát|chén|ly|lon|hộp|gói|lá|cái|kg|g|gr|gram|ml|lít|lit|l)\s+(.*)$/i);
      if (uMatch) {
        unit = unitMap[uMatch[1].toLowerCase()] || uMatch[1].toLowerCase();
        rest = uMatch[2].trim();
      }
      name = cleanIngredientName(rest);
      return { name, amount, unit, quantity: amount };
    }
  }

  // Numeric start: "150gr bột gạo" or "1 thìa ngũ vị hương"
  const numStartMatch = line.match(/^(\d+(?:[\.,]\d+)?(?:\/\d+)?)\s*([a-zA-Zà-ỹÀ-Ỹ]+)?\s+(.*)$/);
  if (numStartMatch) {
    const rawAmt = numStartMatch[1];
    if (rawAmt.includes('/')) {
      const parts = rawAmt.split('/');
      amount = parseFloat(parts[0]) / parseFloat(parts[1]);
    } else {
      amount = parseFloat(rawAmt.replace(',', '.')) || 1;
    }

    const possibleUnit = (numStartMatch[2] || '').toLowerCase();
    let rest = numStartMatch[3].trim();

    if (possibleUnit && unitMap[possibleUnit]) {
      unit = unitMap[possibleUnit];
      name = rest;
    } else if (possibleUnit) {
      const combined = `${possibleUnit} ${rest}`;
      const uMatch = combined.match(/^(muỗng canh|muỗng cà phê|muỗng cafe|thìa canh|thìa cà phê|thìa cafe|thìa|muỗng|trái|củ|quả|con|nhánh|tép|bó|lát|miếng|khúc|bát|chén|ly|lon|hộp|gói|lá|cái|kg|g|gr|gram|ml|lít|lit|l)\s+(.*)$/i);
      if (uMatch) {
        unit = unitMap[uMatch[1].toLowerCase()] || uMatch[1].toLowerCase();
        name = uMatch[2].trim();
      } else {
        name = combined;
      }
    } else {
      name = rest;
    }
    name = cleanIngredientName(name);
    return { name, amount, unit, quantity: amount };
  }

  // Fallback
  name = cleanIngredientName(line);
  return { name, amount: 1, unit: '', quantity: 1 };
}

function guessIngredientCategory(name) {
  const n = name.toLowerCase();
  if (/thịt|ba chỉ|sườn|bò|heo|lợn|gà|vịt|ngan|mọc|xúc xích|chả|giò/i.test(n)) return 'Thịt';
  if (/cá|tôm|cua|mực|nghêu|sò|ốc|hến|hải sản|rong biển/i.test(n)) return 'Hải sản';
  if (/cà rốt|hành|tỏi|gừng|sả|ớt|dưa|cà chua|rau|cải|nấm|khoai|ngô|bắp|đậu|bí|su|măng|giá/i.test(n)) return 'Rau củ';
  if (/mắm|muối|đường|tiêu|hạt nêm|bột ngọt|dầu|tương|giấm|dấm|xốt|sốt|bơ|vani|ngũ vị/i.test(n)) return 'Gia vị';
  if (/trứng|sữa|whipping|phô mai|yaourt|sữa chua/i.test(n)) return 'Trứng & Sữa';
  if (/gạo|mì|mỳ|bún|phở|miến|nui|bột|yến mạch/i.test(n)) return 'Tinh bột';
  if (/chuối|cam|chanh|táo|dứa|thơm|dâu|xoài|bơ trái|lê/i.test(n)) return 'Trái cây';
  return 'Khác';
}

const allFiles = fs.readdirSync(NOTION_DIR).filter(f => f.endsWith('.html'));
const duplicateExcluded = [];
const internalDeduplicatedMap = new Map();

allFiles.forEach(f => {
  const filePath = path.join(NOTION_DIR, f);
  const content = fs.readFileSync(filePath, 'utf8');

  const titleM = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const rawTitle = titleM ? decodeHtml(titleM[1].replace(/<[^>]+>/g, '')).trim() : '';

  if (!rawTitle || /^\d+(_\d+)*(_n)?$/.test(rawTitle) || /^Page \d+$/i.test(rawTitle) || /^\d{2}$/.test(rawTitle)) return;
  if (/^Bài \d+:/i.test(rawTitle)) return;
  if (/Eat Clean là gì|Nguyên tắc quan trọng để giảm cân|Chỉ số BMI|Tính BMR/i.test(rawTitle)) return;
  if (/^Mẹo /i.test(rawTitle) || /^Chiên đậu hũ không vỡ/i.test(rawTitle) || /^Bí quyết /i.test(rawTitle) || /^Luộc bánh trôi/i.test(rawTitle) || /^Nấu trứng/i.test(rawTitle) || /^Chiên không bắn/i.test(rawTitle) || /^Chiên nem/i.test(rawTitle) || /^Bóc tỏi/i.test(rawTitle) || /^Bảo quản/i.test(rawTitle) || /^Chữa /i.test(rawTitle)) return;
  if (/^Thực đơn \d+M$/i.test(rawTitle)) return;
  if (/^(Meal Prep|Lớp học|Nấu ăn|Ăn dặm|Đơn vị|Đồ uống|Web công thức|Gia vị đang dùng|Bữa sáng\/bữa phụ|Các loại rau xanh|Các loại tinh bột|Các loại đạm|Cháo nồi áp suất)$/i.test(rawTitle)) return;

  if (isDuplicateOf108(rawTitle)) {
    duplicateExcluded.push({ file: f, title: rawTitle });
    return;
  }

  const key = phoneticKey(rawTitle);
  if (!internalDeduplicatedMap.has(key)) {
    internalDeduplicatedMap.set(key, { file: f, rawTitle, content });
  } else {
    const existing = internalDeduplicatedMap.get(key);
    if (content.length > existing.content.length) {
      internalDeduplicatedMap.set(key, { file: f, rawTitle, content });
    }
  }
});

const finalRecipes = [];
const globalUnitsSet = new Set(['g', 'kg', 'ml', 'lít', 'muỗng canh', 'muỗng cà phê', 'quả', 'trái', 'củ', 'nhánh', 'tép', 'bó', 'lát', 'miếng', 'khúc', 'chén', 'bát', 'lon', 'hộp', 'gói', 'lá', 'con', 'chút', 'cái', 'khoanh']);
const globalCatalogMap = new Map();

internalDeduplicatedMap.forEach(({ file, rawTitle, content }) => {
  let cleanT = cleanTitle(rawTitle);
  if (cleanT === cleanT.toUpperCase() && cleanT.length > 3) {
    cleanT = cleanT
      .toLowerCase()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  const slug = slugify(cleanT) || 'recipe';
  const hash = crypto.createHash('md5').update(file + cleanT).digest('hex').slice(0, 8);
  const id = `recipe-${slug}-${hash}`;

  // Extract properties
  const props = {};
  const propMatches = [...content.matchAll(/<tr class="property-row[^"]*"><th>[\s\S]*?<\/span>([^<]+)<\/th><td>([\s\S]*?)<\/td><\/tr>/g)];
  propMatches.forEach(m => {
    const key = decodeHtml(m[1].trim());
    const val = decodeHtml(m[2].replace(/<[^>]+>/g, '').trim());
    props[key] = val;
  });

  const tagsSet = new Set();
  let category = 'Món chính';

  if (props['Món']) {
    category = props['Món'];
    tagsSet.add(props['Món']);
  } else if (props['Loại món']) {
    category = props['Loại món'];
    tagsSet.add(props['Loại món']);
  }

  if (props['Bữa']) {
    if (props['Bữa'].includes('Bữa chính')) tagsSet.add('Bữa chính');
    if (props['Bữa'].includes('Bữa sáng')) tagsSet.add('Bữa sáng / phụ');
    if (props['Bữa'].includes('Bữa phụ')) tagsSet.add('Bữa phụ');
  }
  if (props['Đặc biệt']) tagsSet.add(props['Đặc biệt']);
  if (props['Tuổi']) tagsSet.add(props['Tuổi']);
  if (props['Tags']) {
    props['Tags'].split(',').map(t => t.trim()).filter(Boolean).forEach(t => tagsSet.add(t));
  }

  // Image handling
  const imgM = content.match(/data-notion-image="([^">]+)"/) || content.match(/<img[^>]+src="([^">]+\.(?:jpg|jpeg|png|webp|avif))"/i);
  let imageUrl = '';
  const images = [];

  if (imgM) {
    const rawImg = decodeURIComponent(imgM[1]);
    const imgFilename = path.basename(rawImg);
    imageUrl = `images/${imgFilename}`;
    images.push(imageUrl);

    const srcImgPath = path.join(NOTION_DIR, imgFilename);
    if (fs.existsSync(srcImgPath)) {
      const destImgPath = path.join(OUTPUT_DIR_IMAGES, imgFilename);
      if (!fs.existsSync(destImgPath)) {
        fs.copyFileSync(srcImgPath, destImgPath);
      }
    }
  }

  // Parse raw ingredient candidates
  let rawIngLines = [];
  const ingDetailsM = content.match(/<details[^>]*>[\s\S]*?<strong>Nguyên liệu<\/strong>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/i);
  if (ingDetailsM) {
    const ingHtml = ingDetailsM[1];
    const liMatches = [...ingHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)];
    if (liMatches.length > 0) {
      rawIngLines = liMatches.map(m => decodeHtml(m[1].replace(/<[^>]+>/g, '').trim()));
    } else {
      const pMatches = [...ingHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)];
      rawIngLines = pMatches.map(m => decodeHtml(m[1].replace(/<[^>]+>/g, '').trim())).filter(Boolean);
    }
  }

  // Steps extraction & ingredient lines discovery
  const steps = [];
  const stepSectionM = content.match(/(?:<h2[^>]*><strong>Cách làm<\/strong><\/h2>|<strong>Cách làm<\/strong>)([\s\S]*?)(?:<\/div>\s*<\/article>|$)/i);
  const stepHtml = stepSectionM ? stepSectionM[1] : '';

  const candidateStepLines = [];
  if (stepHtml) {
    const liMatches = [...stepHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)];
    if (liMatches.length > 0) {
      liMatches.forEach(m => {
        const text = decodeHtml(m[1].replace(/<[^>]+>/g, '').trim());
        if (text) candidateStepLines.push(text);
      });
    } else {
      const pMatches = [...stepHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)];
      pMatches.forEach(m => {
        const text = decodeHtml(m[1].replace(/<[^>]+>/g, '').trim());
        if (text) candidateStepLines.push(text);
      });
    }
  }

  // If no step section, fallback to whole body paragraphs
  if (candidateStepLines.length === 0) {
    const cleanBody = content
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<table class="properties"[\s\S]*?<\/table>/gi, '')
      .replace(/<h1 class="page-title"[\s\S]*?<\/h1>/gi, '')
      .replace(/<[^>]+>/g, '\n');
    cleanBody.split('\n').map(l => decodeHtml(l.trim())).filter(l => l.length > 3).forEach(l => {
      if (!l.includes('Trạng thái') && !l.includes('Bữa') && !l.includes('Loại món') && !l.includes('Đặc biệt')) {
        candidateStepLines.push(l);
      }
    });
  }

  // Check which lines are ingredients vs steps
  candidateStepLines.forEach(line => {
    // Ingredient detector:
    // Format: "1 thìa ngũ vị hương", "150gr bột gạo", "_ 100gr...", "Gạo lứt: 30g", "Tương ớt: 10g"
    const isIngredientFormat = 
      /^[-_•*·]\s*\d/.test(line) ||
      /^[-_•*·]\s*[a-zA-Zà-ỹÀ-Ỹ\s]+:/.test(line) ||
      /^[a-zA-Zà-ỹÀ-Ỹ\s]+:\s*\d+/.test(line) ||
      /^(\d+(?:[\.,\/]\d+)?)\s*(thìa|muỗng|g|gr|gram|kg|ml|lít|lit|l|củ|quả|trái|nhánh|tép|lát|bột|chút)\s+[a-zA-Zà-ỹÀ-Ỹ\s]{2,30}$/i.test(line);

    if (isIngredientFormat) {
      rawIngLines.push(line);
    } else {
      // It's a cooking instruction step
      // Filter out pure subheadings like "Cách làm", "Nguyên liệu", "Vỏ bánh:", "Nhân bánh:"
      if (!/^(cách làm|nguyên liệu|thực hiện|sơ chế|ghi chú|hướng dẫn)$/i.test(line.trim())) {
        steps.push({ instruction: line });
      }
    }
  });

  // Parse and deduplicate ingredients
  const ingredients = [];
  const seenIngNames = new Set();

  rawIngLines.forEach(l => {
    const parsed = parseIngredientLine(l);
    if (parsed && parsed.name && !seenIngNames.has(parsed.name.toLowerCase())) {
      // verify not a step
      if (parsed.name.length < 40 && !parsed.name.includes('nướng') && !parsed.name.includes('đun') && !parsed.name.includes('khuấy')) {
        seenIngNames.add(parsed.name.toLowerCase());
        ingredients.push(parsed);

        if (parsed.unit) globalUnitsSet.add(parsed.unit);

        const catKey = parsed.name.toLowerCase();
        if (!globalCatalogMap.has(catKey)) {
          globalCatalogMap.set(catKey, {
            name: parsed.name,
            default_unit: parsed.unit || '',
            default_category: guessIngredientCategory(parsed.name)
          });
        }
      }
    }
  });

  let prepTime = 15;
  let cookTime = 25;
  const timeMatch = content.match(/(\d+)\s*(?:phút|p|m)\b/i);
  if (timeMatch) {
    cookTime = parseInt(timeMatch[1], 10);
  }

  const recipe = {
    id,
    title: cleanT,
    slug,
    image_url: imageUrl,
    images,
    parent_id: null,
    prep_time: prepTime,
    cook_time: cookTime,
    total_time_minutes: prepTime + cookTime,
    difficulty: 'Vừa',
    calories: 0,
    taste_score: 0,
    cooking_history: [],
    servings: 2,
    tags: Array.from(tagsSet),
    category,
    is_favorite: false,
    ingredients,
    steps,
    author_id: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  finalRecipes.push(recipe);
  fs.writeFileSync(path.join(OUTPUT_DIR_INDIVIDUAL, `${id}.json`), JSON.stringify(recipe, null, 2), 'utf8');
});

const unitsArray = Array.from(globalUnitsSet).map((u, idx) => ({
  id: `unit-std-${idx + 1}`,
  name: u,
  symbol: u,
  type: /kg|g|gram|gr/.test(u) ? 'weight' : /lít|lit|l|ml/.test(u) ? 'volume' : 'custom',
  is_custom: false
}));

const catalogArray = Array.from(globalCatalogMap.values()).map((c, idx) => ({
  id: `catalog-std-${idx + 1}`,
  name: c.name,
  default_unit: c.default_unit,
  default_category: c.default_category
}));

const outputData = {
  version: '1.0.0',
  exported_at: new Date().toISOString(),
  units: unitsArray,
  catalog: catalogArray,
  recipes: finalRecipes
};

fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(outputData, null, 2), 'utf8');

console.log(`\n==================================================`);
console.log(`SUCCESSFULLY EXPORTED POLISHED RECIPES!`);
console.log(`- Total recipes exported: ${finalRecipes.length}`);
console.log(`- Units count: ${unitsArray.length}`);
console.log(`- Catalog ingredients count: ${catalogArray.length}`);
console.log(`- Main Import JSON saved to: ${OUTPUT_JSON_PATH}`);
console.log(`- Individual recipe JSON files saved to: ${OUTPUT_DIR_INDIVIDUAL}`);
console.log(`- Recipe images copied to: ${OUTPUT_DIR_IMAGES}`);
