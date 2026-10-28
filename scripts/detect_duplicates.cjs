const fs = require('fs');
const path = require('path');

const RECIPES_DIR = 'P:\\CookbookData\\recipes';

function normalizeTitle(t) {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function analyze() {
  if (!fs.existsSync(RECIPES_DIR)) {
    console.error('Directory does not exist:', RECIPES_DIR);
    return;
  }

  const files = fs.readdirSync(RECIPES_DIR).filter(f => f.endsWith('.json'));
  console.log(`Total recipe files: ${files.length}`);

  const byNormTitle = new Map();
  const byExactTitle = new Map();
  const byId = new Map();

  for (const file of files) {
    const filePath = path.join(RECIPES_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const id = data.id || file.replace(/\.json$/, '');
      const title = data.title || '';
      const normTitle = normalizeTitle(title);

      // check id
      if (!byId.has(id)) byId.set(id, []);
      byId.get(id).push({ file, title, data });

      // check exact title
      if (!byExactTitle.has(title)) byExactTitle.set(title, []);
      byExactTitle.get(title).push({ file, id, data });

      // check normalized title
      if (!byNormTitle.has(normTitle)) byNormTitle.set(normTitle, []);
      byNormTitle.get(normTitle).push({ file, id, title, data });
    } catch (e) {
      console.error('Error reading', file, e.message);
    }
  }

  console.log('\n--- EXACT TITLE DUPLICATES ---');
  let exactDupCount = 0;
  for (const [title, list] of byExactTitle.entries()) {
    if (list.length > 1) {
      exactDupCount++;
      console.log(`[Exact Title: "${title}"] x${list.length}:`);
      list.forEach(item => {
        const ingCount = item.data.ingredients?.length || 0;
        const stepCount = item.data.steps?.length || 0;
        const hasImg = !!item.data.image_url;
        console.log(`   - File: ${item.file} | ID: ${item.id} | Ings: ${ingCount} | Steps: ${stepCount} | HasImg: ${hasImg}`);
      });
    }
  }
  console.log(`Total exact title duplicates: ${exactDupCount}`);

  console.log('\n--- NORMALIZED TITLE DUPLICATES (Differing only in accents/case/punctuation) ---');
  let normDupCount = 0;
  for (const [normTitle, list] of byNormTitle.entries()) {
    if (list.length > 1) {
      const uniqueExact = new Set(list.map(x => x.title));
      if (uniqueExact.size > 1) {
        normDupCount++;
        console.log(`[Norm: "${normTitle}"] Titles: ${Array.from(uniqueExact).join(' vs ')}`);
        list.forEach(item => {
          console.log(`   - File: ${item.file} | Title: ${item.title}`);
        });
      }
    }
  }
  console.log(`Total normalized-only title duplicates: ${normDupCount}`);
}

analyze();
