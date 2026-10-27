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
  return String(str || '').replace(/\s*\(\d+\)$/, '').trim();
}

function normalize(str) {
  return stripAccents(clean(str)).toLowerCase().replace(/[^a-z0-9]/g, '');
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

// Read all Notion candidate files
const allFiles = fs.readdirSync(NOTION_DIR).filter(f => f.endsWith('.html'));
const notionRecipes = [];

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

  // Extract ingredients from HTML
  const bodyText = content.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
  notionRecipes.push({
    file: f,
    title,
    cleanTitle: clean(title),
    norm: normalize(title),
    phonetic: phoneticKey(title),
    content,
    bodyText
  });
});

console.log(`Loaded ${existingRecipes.length} existing recipes, ${notionRecipes.length} Notion recipe files.`);

// Cross compare
const matched = [];

existingRecipes.forEach(ex => {
  const exNorm = normalize(ex.title);
  const exPhonetic = phoneticKey(ex.title);
  
  // Find matches
  let candidates = notionRecipes.filter(n => {
    // 1. Exact or phonetic
    if (n.norm === exNorm || n.phonetic === exPhonetic) return true;
    
    // 2. Contains (e.g. Cơm gạo lứt rang ức gà vs Cơm rang ức gà)
    if (n.phonetic.includes(exPhonetic) || exPhonetic.includes(n.phonetic)) {
      // check length
      if (Math.min(n.phonetic.length, exPhonetic.length) >= 8) return true;
    }

    // 3. Prefix difference like "Cơm ức gà..." vs "Ức gà..."
    if (n.phonetic === 'com' + exPhonetic || exPhonetic === 'com' + n.phonetic) return true;
    if (n.phonetic === 'salad' + exPhonetic || exPhonetic === 'salad' + n.phonetic) return true;
    if (n.phonetic === 'mon' + exPhonetic || exPhonetic === 'mon' + n.phonetic) return true;

    return false;
  });

  if (candidates.length > 0) {
    matched.push({
      existing: ex.title,
      matches: candidates.map(c => ({ title: c.title, file: c.file }))
    });
  }
});

console.log(`Total matched existing recipes: ${matched.length} / ${existingRecipes.length}`);
matched.forEach((m, i) => {
  console.log(`${i + 1}. [Existing: "${m.existing}"] matched ${m.matches.length} Notion files:`);
  m.matches.forEach(c => console.log(`    - "${c.title}" (${c.file})`));
});
