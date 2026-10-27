const fs = require('fs');
const path = require('path');
const notionDir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const pRecipesDir = 'P:/CookbookData/recipes';
const index = JSON.parse(fs.readFileSync('P:/CookbookData/recipes_index.json', 'utf8'));
const notionFiles = fs.readdirSync(notionDir).filter(f => f.endsWith('.html'));

function normalizeKey(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s*\(\d+\)$/, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Build map of Notion files
const notionMap = new Map();
for (const f of notionFiles) {
  const content = fs.readFileSync(path.join(notionDir, f), 'utf8');
  const tm = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const title = tm ? tm[1].replace(/<[^>]+>/g, '').trim() : f;
  const k = normalizeKey(title);
  if (!notionMap.has(k)) notionMap.set(k, []);
  notionMap.get(k).push({ file: f, title, content });
}

console.log(`Loaded ${notionMap.size} unique keys from Notion.\n`);

const missingIngRecipes = index.filter(r => (!r.ingredients || r.ingredients.length === 0));
console.log(`Total recipes with 0 ingredients: ${missingIngRecipes.length}`);

let canEnrichFromNotion = 0;
let canEnrichFromSteps = 0;
let remainingWithoutSource = [];

for (const r of missingIngRecipes) {
  const k = normalizeKey(r.title);
  const matches = notionMap.get(k) || [];
  let foundInNotion = false;

  for (const m of matches) {
    if (m.content.includes('Nguyên liệu') && /•|\d+\s*(g|kg|ml|lít|muỗng|thìa|quả|trái|củ|miếng|hộp|gói)/i.test(m.content)) {
      canEnrichFromNotion++;
      foundInNotion = true;
      break;
    }
  }

  if (!foundInNotion) {
    // Check if steps contain ingredients
    const stepsText = (r.steps || []).map(s => typeof s === 'string' ? s : (s.instruction || '')).join('\n');
    if (/-\s*[^:\n]+:\s*\d+|nguyên liệu\s*:|(\d+\s*(g|kg|ml|lít|muỗng|thìa)\b.*){2,}/i.test(stepsText)) {
      canEnrichFromSteps++;
    } else {
      remainingWithoutSource.push({ id: r.id, title: r.title, category: r.category, steps: r.steps?.length, image: r.image_url });
    }
  }
}

console.log(`Can enrich directly from Notion HTML: ${canEnrichFromNotion}`);
console.log(`Can enrich by extracting from embedded steps: ${canEnrichFromSteps}`);
console.log(`Remaining without ingredients text: ${remainingWithoutSource.length}`);
console.log('\nSample remaining without ingredients text:');
console.log(JSON.stringify(remainingWithoutSource.slice(0, 15), null, 2));
