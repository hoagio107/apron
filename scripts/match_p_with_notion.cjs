const fs = require('fs');
const path = require('path');
const notionDir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const pRecipesDir = 'P:/CookbookData/recipes';

const pFiles = fs.readdirSync(pRecipesDir).filter(f => f.endsWith('.json'));
const notionFiles = fs.readdirSync(notionDir).filter(f => f.endsWith('.html'));

function cleanTitle(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s*\(\d+\)$/, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Map notion files by cleaned title
const notionMap = new Map();
for (const nf of notionFiles) {
  // Notion filenames often start with title, e.g. "Cá hồi sốt chanh dây (1) 2674320ba42b80be983ed3ec5f6ed03b.html"
  const m = nf.match(/^(.*?)\s+[0-9a-f]{32}\.html$/i);
  if (m) {
    const rawTitle = m[1];
    const ct = cleanTitle(rawTitle);
    if (!notionMap.has(ct)) notionMap.set(ct, []);
    notionMap.get(ct).push({ file: nf, rawTitle });
  }
}

console.log(`Total parsed Notion titles: ${notionMap.size}`);

// Check for recipes in P: that are missing ingredients
let matchedCount = 0;
let recoveredIngsCount = 0;

for (const pf of pFiles) {
  const pData = JSON.parse(fs.readFileSync(path.join(pRecipesDir, pf), 'utf8'));
  const ct = cleanTitle(pData.title || pData.name);
  const matches = notionMap.get(ct);
  if (matches && matches.length > 0) {
    matchedCount++;
    if (!pData.ingredients || pData.ingredients.length === 0) {
      // Check if Notion file has "Nguyên liệu"
      for (const m of matches) {
        const content = fs.readFileSync(path.join(notionDir, m.file), 'utf8');
        if (content.includes('Nguyên liệu') && /•|\d+\s*(g|kg|ml|lít|muỗng|thìa|quả|trái)/i.test(content)) {
          recoveredIngsCount++;
          if (recoveredIngsCount <= 10) {
            console.log(`Can recover ingredients for "${pData.title}" from Notion file: ${m.file}`);
          }
          break;
        }
      }
    }
  }
}

console.log(`\nMatched recipes between P: and Notion: ${matchedCount} / ${pFiles.length}`);
console.log(`Recipes with 0 ingredients that CAN BE RECOVERED from Notion: ${recoveredIngsCount}`);
