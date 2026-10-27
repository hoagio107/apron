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
    .replace(/\s*\(\d+\)$/, '')
    .replace(/\//g, ' ')
    .trim();
}

function words(str) {
  return stripAccents(clean(str))
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
}

function jaccard(words1, words2) {
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  let inter = 0;
  for (const w of set1) {
    if (set2.has(w)) inter++;
  }
  const union = set1.size + set2.size - inter;
  return union === 0 ? 0 : inter / union;
}

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

  notionRecipes.push({
    file: f,
    title,
    words: words(title)
  });
});

const highMatches = [];

existingRecipes.forEach(ex => {
  const exW = words(ex.title);
  
  notionRecipes.forEach(nr => {
    const score = jaccard(exW, nr.words);
    const isExactWords = exW.length === nr.words.length && exW.every((w, i) => nr.words[i] === w);
    const isSameWordSet = exW.length === nr.words.length && exW.every(w => nr.words.includes(w));
    
    if (score >= 0.75 || isExactWords || isSameWordSet) {
      highMatches.push({
        existing: ex.title,
        notion: nr.title,
        file: nr.file,
        score
      });
    }
  });
});

console.log(`High confidence duplicate pairs: ${highMatches.length}`);
// Deduplicate by notion file
const seenNotionFiles = new Set();
highMatches.forEach((m, i) => {
  console.log(`${i+1}. Existing: "${m.existing}" <===> Notion: "${m.notion}" (${m.file}) [score: ${m.score.toFixed(2)}]`);
  seenNotionFiles.add(m.file);
});
console.log(`Unique Notion files matched: ${seenNotionFiles.size}`);
