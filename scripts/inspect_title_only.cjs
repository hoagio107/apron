const fs = require('fs');
const index = JSON.parse(fs.readFileSync('P:/CookbookData/recipes_index.json', 'utf8'));

const titleOnly = [];
for (const r of index) {
  const title = (r.title || '').trim();
  const steps = r.steps || [];
  if (steps.length === 1) {
    const s = typeof steps[0] === 'string' ? steps[0] : (steps[0].instruction || '');
    const cleanS = s.replace(/<[^>]+>/g, '').trim().toLowerCase();
    if (cleanS === title.toLowerCase() || /^https?:\/\//i.test(cleanS)) {
      titleOnly.push({
        id: r.id,
        title: r.title,
        category: r.category,
        tags: r.tags,
        image_url: r.image_url,
        servings: r.servings,
        difficulty: r.difficulty
      });
    }
  }
}

console.log(`Total title-only recipes: ${titleOnly.length}`);
console.log('Sample title-only recipes:');
console.log(JSON.stringify(titleOnly.slice(0, 15), null, 2));

// Check categories
const cats = {};
for (const t of titleOnly) {
  cats[t.category] = (cats[t.category] || 0) + 1;
}
console.log('\nCategories of title-only recipes:', cats);
