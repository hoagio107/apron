const fs = require('fs');
const path = require('path');
const pRecipesDir = 'P:/CookbookData/recipes';
const notionDir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const index = JSON.parse(fs.readFileSync('P:/CookbookData/recipes_index.json', 'utf8'));

// Filter out tips & bogus recipes
const junkIds = new Set([
  'recipe-c-2d606928',
  'recipe-list-mon-c1f14b87',
  'recipe-vo-mat-ca-fbf18b7a',
  'recipe-thoi-gian-luoc-thit-0865d938',
  'recipe-thoi-gian-luoc-rau-9a31547d',
  'recipe-ra-dong-do-an-nhanh-4db083d1',
  'recipe-ra-dong-tom-b0028158',
  'recipe-giam-toc-do-chin-cua-chuoi-a73cc313',
  'recipe-meo-luoc-rau-cu-12e635ec',
  'recipe-cach-tinh-bmi-bmr-tdee-6f08cb9b',
  'recipe-cach-chuan-bi-bua-an-eat-clean-hieu-qua-de934fb1'
]);

const validRecipes = index.filter(r => !junkIds.has(r.id));
console.log(`Valid recipes in catalog: ${validRecipes.length}`);

const emptyIngs = validRecipes.filter(r => !r.ingredients || r.ingredients.length === 0);
console.log(`Valid recipes with 0 ingredients: ${emptyIngs.length}`);

// Group by category
const byCat = {};
for (const r of emptyIngs) {
  const cat = r.category || 'Khác';
  if (!byCat[cat]) byCat[cat] = [];
  byCat[cat].push({ id: r.id, title: r.title, stepsCount: (r.steps || []).length });
}

console.log('\nDistribution by Category of 0-ingredient recipes:');
for (const [cat, list] of Object.entries(byCat)) {
  console.log(`  - [${cat}] (${list.length}): ${list.slice(0, 3).map(x => x.title).join(', ')}${list.length > 3 ? '...' : ''}`);
}
