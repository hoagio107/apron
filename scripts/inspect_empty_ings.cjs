const fs = require('fs');
const path = require('path');
const dir = 'P:/CookbookData/recipes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const emptyIngs = [];
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const ings = data.ingredients || [];
  if (ings.length === 0) {
    emptyIngs.push({
      file: f,
      id: data.id,
      title: data.title || data.name,
      stepsCount: (data.steps || data.instructions || []).length,
      category: data.category,
      tags: data.tags,
      hasNotes: Boolean(data.notes),
      hasDesc: Boolean(data.description),
      hasContent: Boolean(data.content)
    });
  }
}

console.log(`Total recipes with 0 ingredients: ${emptyIngs.length}`);
console.log('Sample empty ingredients recipes:');
console.log(JSON.stringify(emptyIngs.slice(0, 20), null, 2));

// Group by category or source
const catMap = {};
for (const item of emptyIngs) {
  const cat = item.category || 'NO_CATEGORY';
  catMap[cat] = (catMap[cat] || 0) + 1;
}
console.log('\nDistribution by Category:', catMap);
