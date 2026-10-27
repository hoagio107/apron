const fs = require('fs');
const path = require('path');

const NOTION_DIR = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const IMPORT_JSON_PATH = 'C:/Users/Admin/Downloads/cookbook_recipes_import.json';

const importData = JSON.parse(fs.readFileSync(IMPORT_JSON_PATH, 'utf8'));
const existingRecipes = importData.recipes || [];

function stripAccents(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function clean(str) {
  return String(str || '')
    .replace(/\s*\(\d+\)$/, '') // remove (1), (2)
    .trim();
}

function normalize(str) {
  return stripAccents(clean(str))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Phonetic / spelling equivalences in Vietnamese recipe naming:
// kia <-> khia (Ba chỉ kìa / khìa)
// gieng <-> rieng (riềng / giềng)
// xao <-> sao
// xoai <-> soai
function phoneticKey(str) {
  let s = normalize(str);
  s = s.replace(/kh/g, 'k');
  s = s.replace(/^gi/, 'r');
  s = s.replace(/gi/g, 'r');
  s = s.replace(/x/g, 's');
  s = s.replace(/tr/g, 'ch');
  return s;
}

// Build map of 108 recipes
const existingMap = new Map();
const existingPhoneticMap = new Map();

existingRecipes.forEach(r => {
  const n = normalize(r.title);
  const p = phoneticKey(r.title);
  existingMap.set(n, r);
  existingPhoneticMap.set(p, r);
  if (r.slug) {
    existingMap.set(normalize(r.slug), r);
    existingPhoneticMap.set(phoneticKey(r.slug), r);
  }
});

// Read all Notion HTML files
const allFiles = fs.readdirSync(NOTION_DIR).filter(f => f.endsWith('.html'));

// Filter candidates
const candidates = [];
allFiles.forEach(f => {
  const content = fs.readFileSync(path.join(NOTION_DIR, f), 'utf8');
  const titleM = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';

  if (!title || /^\d+(_\d+)*(_n)?$/.test(title) || /^Page \d+$/i.test(title) || /^\d{2}$/.test(title)) return;
  if (/^Bài \d+:/i.test(title)) return;
  if (/Eat Clean là gì|Nguyên tắc quan trọng để giảm cân|Chỉ số BMI|Tính BMR/i.test(title)) return;
  if (/^Mẹo /i.test(title) || /^Chiên đậu hũ không vỡ/i.test(title) || /^Bí quyết /i.test(title) || /^Luộc bánh trôi/i.test(title) || /^Nấu trứng/i.test(title) || /^Chiên không bắn/i.test(title) || /^Chiên nem/i.test(title) || /^Bóc tỏi/i.test(title) || /^Bảo quản/i.test(title) || /^Chữa /i.test(title)) return;
  if (/^Thực đơn \d+M$/i.test(title)) return;
  if (/^(Meal Prep|Lớp học|Nấu ăn|Ăn dặm|Đơn vị|Đồ uống|Web công thức|Gia vị đang dùng|Bữa sáng\/bữa phụ|Các loại rau xanh|Các loại tinh bột|Các loại đạm|Cháo nồi áp suất)$/i.test(title)) return;

  candidates.push({ file: f, title, content });
});

console.log(`Total candidate recipe files: ${candidates.length}`);

// Group by clean title & detect duplicates with 108 existing
const duplicates = [];
const nonDuplicatesMap = new Map();

candidates.forEach(c => {
  const cClean = clean(c.title);
  const cNorm = normalize(c.title);
  const cPhonetic = phoneticKey(c.title);

  // Check against 108 existing
  let matchedExisting = null;
  let matchReason = '';

  if (existingMap.has(cNorm)) {
    matchedExisting = existingMap.get(cNorm);
    matchReason = 'Exact match';
  } else if (existingPhoneticMap.has(cPhonetic)) {
    matchedExisting = existingPhoneticMap.get(cPhonetic);
    matchReason = 'Phonetic match';
  } else {
    // Check partial containment if string is long enough
    for (const ex of existingRecipes) {
      const exNorm = normalize(ex.title);
      // e.g. "Cơm ức gà sốt mật ong" vs "Ức gà sốt mật ong"
      if (cNorm === 'com' + exNorm || exNorm === 'com' + cNorm) {
        matchedExisting = ex;
        matchReason = 'Prefix "Cơm" match';
        break;
      }
      if (cNorm === 'salad' + exNorm || exNorm === 'salad' + cNorm) {
        matchedExisting = ex;
        matchReason = 'Prefix "Salad" match';
        break;
      }
    }
  }

  if (matchedExisting) {
    duplicates.push({
      notionTitle: c.title,
      matchedExistingTitle: matchedExisting.title,
      file: c.file,
      reason: matchReason
    });
  } else {
    // Check internal duplicates within Notion
    const key = cPhonetic;
    if (!nonDuplicatesMap.has(key)) {
      nonDuplicatesMap.set(key, c);
    } else {
      // Keep the one with richer content
      const prev = nonDuplicatesMap.get(key);
      if (c.content.length > prev.content.length) {
        nonDuplicatesMap.set(key, c);
      }
    }
  }
});

console.log(`\n========================================`);
console.log(`DUPLICATE RECIPES FOUND (${duplicates.length}):`);
duplicates.forEach((d, i) => {
  console.log(`  ${i + 1}. [${d.reason}] "${d.notionTitle}" <===> Existing: "${d.matchedExistingTitle}" (${d.file})`);
});

console.log(`\n========================================`);
console.log(`UNIQUE NON-DUPLICATE RECIPES TO EXPORT: ${nonDuplicatesMap.size}`);
