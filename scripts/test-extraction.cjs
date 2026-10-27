const fs = require('fs');
const path = require('path');

const NOTION_DIR = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

// Include the unit and fraction mappings from perfect-standardize-108-recipes.cjs
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

function parseIngredientString(raw) {
  let line = raw.replace(/^[-_•*·\s]+/, '').trim();
  if (!line) return null;

  let name = '';
  let amount = 1;
  let unit = '';

  // 1. Colon format: "Thịt thăn bò: 300g" or "Gạo lứt: 30g - Ngâm 45 phút"
  const colonMatch = line.match(/^([^:]+):\s*([0-9\.,\/\s½⅓⅔¼¾⅛⅜⅝⅞-]+)\s*([a-zA-Zà-ỹÀ-Ỹ\s]+)?(?:\s*-\s*(.*))?$/);
  if (colonMatch) {
    name = colonMatch[1].trim();
    const rawAmt = colonMatch[2].trim();
    const rawUnit = (colonMatch[3] || '').trim().toLowerCase();

    // Check fraction in rawAmt
    if (fractionMap[rawAmt]) {
      amount = fractionMap[rawAmt];
    } else if (rawAmt.includes('/')) {
      const parts = rawAmt.split('/');
      amount = parseFloat(parts[0]) / parseFloat(parts[1]);
    } else if (rawAmt.includes('-')) {
      // Range: "20 - 40" -> average 30
      const parts = rawAmt.split('-').map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
      amount = parts.length === 2 ? (parts[0] + parts[1]) / 2 : (parts[0] || 1);
    } else {
      amount = parseFloat(rawAmt.replace(',', '.')) || 1;
    }

    if (rawUnit) {
      unit = unitMap[rawUnit] || rawUnit;
    }
    return { name, amount, unit, quantity: amount };
  }

  // 2. Quantity at start: "150gr bột gạo", "1 quả chuối chín", "1/2 củ cà rốt"
  // Check fraction symbol
  for (const [fChar, fVal] of Object.entries(fractionMap)) {
    if (line.startsWith(fChar)) {
      amount = fVal;
      let rest = line.slice(fChar.length).trim();
      const uMatch = rest.match(/^(muỗng canh|muỗng cà phê|muỗng cafe|thìa canh|thìa cà phê|thìa cafe|thìa|muỗng|trái|củ|quả|con|nhánh|tép|bó|lát|miếng|khúc|bát|chén|ly|lon|hộp|gói|lá|cái|kg|g|gr|gram|ml|lít|lit|l)\s+(.*)$/i);
      if (uMatch) {
        unit = unitMap[uMatch[1].toLowerCase()] || uMatch[1].toLowerCase();
        rest = uMatch[2].trim();
      }
      name = rest;
      return { name, amount, unit, quantity: amount };
    }
  }

  // Check numeric at start: "150gr ...", "1,2L ...", "1/2 ..."
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
      // might be part of unit like "muỗng" or part of name
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
    return { name, amount, unit, quantity: amount };
  }

  // Fallback: just name
  name = line;
  return { name, amount: 1, unit: '', quantity: 1 };
}

// Test sample files
const testFiles = [
  'Ba chỉ giòn bì 1394320ba42b80079a4ac947cad3066a.html',
  'Bibimbap - Cơm trộn Hàn Quốc 2674320ba42b80ae9168d40afc9a9198.html',
  'Bánh chuối yến mạch 2834320ba42b80e7a185f19caefb25b5.html',
  'Bò lúc lắc (1) 2674320ba42b80eb8302e7d8d4f6e0d9.html',
  'Bánh giò 5b54895a7b6b4997881ebc8cb2ffe95a.html'
];

testFiles.forEach(tf => {
  const content = fs.readFileSync(path.join(NOTION_DIR, tf), 'utf8');
  console.log(`\n========================================================`);
  console.log(`FILE: ${tf}`);
  
  // Extract title
  const titleM = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';
  console.log(`Title: "${title}"`);

  // Extract properties
  const props = {};
  const propMatches = [...content.matchAll(/<tr class="property-row[^"]*"><th>[\s\S]*?<\/span>([^<]+)<\/th><td>([\s\S]*?)<\/td><\/tr>/g)];
  propMatches.forEach(m => {
    const key = m[1].trim();
    const val = m[2].replace(/<[^>]+>/g, '').trim();
    props[key] = val;
  });
  console.log('Props:', props);

  // Extract image
  const imgM = content.match(/data-notion-image="([^">]+)"/);
  const image = imgM ? decodeURIComponent(imgM[1]) : '';
  console.log('Image:', image);

  // Extract ingredients
  let rawIngs = [];
  const ingDetailsM = content.match(/<details[^>]*>[\s\S]*?<strong>Nguyên liệu<\/strong>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/i);
  if (ingDetailsM) {
    const ingHtml = ingDetailsM[1];
    const liMatches = [...ingHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)];
    if (liMatches.length > 0) {
      rawIngs = liMatches.map(m => m[1].replace(/<[^>]+>/g, '').trim());
    } else {
      const pMatches = [...ingHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)];
      rawIngs = pMatches.map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
    }
  }

  // If rawIngs is empty, look in body text
  if (rawIngs.length === 0) {
    const bodyText = content.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '\n');
    const lines = bodyText.split('\n').map(l => l.trim()).filter(Boolean);
    lines.forEach(l => {
      // Check if line looks like an ingredient
      if (/^[-_•*·]\s*\d/.test(l) || /^[-_•*·]\s*[a-zA-Zà-ỹÀ-Ỹ]+:/.test(l) || /^[a-zA-Zà-ỹÀ-Ỹ\s]+:\s*\d+/.test(l)) {
        rawIngs.push(l);
      }
    });
  }

  const parsedIngs = rawIngs.map(parseIngredientString).filter(Boolean);
  console.log(`Ingredients parsed (${parsedIngs.length}):`, parsedIngs.slice(0, 5));
});
