const fs = require('fs');
const path = require('path');
const NOTION_DIR = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const importData = JSON.parse(fs.readFileSync('C:/Users/Admin/Downloads/cookbook_recipes_import.json', 'utf8'));
const allFiles = fs.readdirSync(NOTION_DIR).filter(f => f.endsWith('.html'));

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

// Build a map of all HTML files with their internal title
const htmlRecords = allFiles.map(f => {
  const content = fs.readFileSync(path.join(NOTION_DIR, f), 'utf8');
  const titleM = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';
  const fileClean = f.replace(/\s[a-f0-9]{32}\.html$/i, '').trim();
  return {
    file: f,
    title,
    normTitle: norm(title),
    normFile: norm(fileClean)
  };
});

const matched = [];
const missing = [];

importData.recipes.forEach(r => {
  const rNorm = norm(r.title);
  // Also try variations (khia <-> kia)
  const rNormK = rNorm.replace(/kh/g, 'k');

  let found = htmlRecords.find(h => h.normTitle === rNorm || h.normFile === rNorm || h.normTitle.replace(/kh/g, 'k') === rNormK);
  
  if (!found) {
    // Try containment if string is long enough
    found = htmlRecords.find(h => {
      if (h.normTitle.length > 7 && rNorm.length > 7) {
        if (h.normTitle.includes(rNorm) || rNorm.includes(h.normTitle)) return true;
      }
      return false;
    });
  }

  if (found) {
    matched.push({ existing: r.title, matchedFile: found.file, notionTitle: found.title });
  } else {
    missing.push(r.title);
  }
});

console.log(`Matched ${matched.length} / ${importData.recipes.length}`);
matched.forEach((m, i) => {
  console.log(`${i+1}. "${m.existing}" <==> "${m.notionTitle}" (${m.matchedFile})`);
});

console.log('\nMissing from export folder (' + missing.length + '):');
console.log(missing.join(', '));
