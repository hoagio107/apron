const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const allFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const importData = JSON.parse(fs.readFileSync('C:/Users/Admin/Downloads/cookbook_recipes_import.json', 'utf8'));
const existingTitles = importData.recipes.map(r => r.title.toLowerCase().trim());
console.log('Existing 108 recipe titles in import JSON loaded.');

let recipeLikeFiles = [];
allFiles.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const titleM = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';
  
  if (!title || /^\d+(_\d+)*(_n)?$/.test(title) || /^Page \d+$/i.test(title)) {
    return;
  }
  
  // Check if it's a course lesson or basic tip
  if (/^Bài \d+:/i.test(title) || /^Mẹo /i.test(title) || /Eat Clean là gì/i.test(title)) {
    return;
  }

  const hasIngredients = /nguyên liệu|thành phần/i.test(content);
  const hasSteps = /cách làm|thực hiện|hướng dẫn|chế biến|bước 1/i.test(content);
  
  recipeLikeFiles.push({ file: f, title, hasIngredients, hasSteps, length: content.length });
});

console.log('Total candidate recipe HTML files found:', recipeLikeFiles.length);

// Check duplicate matching
function normalizeTitle(t) {
  return t.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

const normExisting = existingTitles.map(normalizeTitle);

const duplicates = [];
const nonDuplicates = [];

recipeLikeFiles.forEach(r => {
  const norm = normalizeTitle(r.title);
  const isDup = normExisting.some(e => e === norm || (e.length > 5 && norm.length > 5 && (e.includes(norm) || norm.includes(e))));
  if (isDup) {
    duplicates.push(r);
  } else {
    nonDuplicates.push(r);
  }
});

console.log('\n--- DUPLICATE CANDIDATES (' + duplicates.length + ') ---');
duplicates.slice(0, 20).forEach((r, i) => console.log(`${i+1}. "${r.title}" (file: ${r.file})`));

console.log('\n--- NON-DUPLICATE CANDIDATES (' + nonDuplicates.length + ') ---');
console.log('Total Non-duplicate recipes:', nonDuplicates.length);
nonDuplicates.slice(0, 30).forEach((r, i) => console.log(`${i+1}. "${r.title}"`));
