const fs = require('fs');
const path = require('path');
const dir = 'P:/CookbookData/recipes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const tagCounts = new Map();
const recipeCount = files.length;

for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const tags = data.tags || [];
  for (const t of tags) {
    tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
  }
}

const sorted = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]);
console.log(`Total unique tags: ${sorted.length}\n`);
console.log('Top 40 most common tags:');
console.log(sorted.slice(0, 40));

console.log('\nTags that look like IDs (numbers or slugs):');
const idLikeTags = sorted.filter(([t]) => /^\d+$/.test(t) || /^(ing-|cook-|dish-|diet-|cuisine-)/.test(t));
console.log(idLikeTags);

console.log('\nTags with slashes:');
const slashTags = sorted.filter(([t]) => t.includes('/'));
console.log(slashTags);
