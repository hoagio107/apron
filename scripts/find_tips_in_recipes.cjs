const fs = require('fs');
const index = JSON.parse(fs.readFileSync('P:/CookbookData/recipes_index.json', 'utf8'));

const tipsInRecipes = [];

for (const r of index) {
  const t = (r.title || '').toLowerCase();
  if (
    t.startsWith('mẹo') ||
    t.startsWith('cách bảo quản') ||
    t.startsWith('bảo quản') ||
    t.startsWith('cách rã đông') ||
    t.startsWith('rã đông') ||
    t.startsWith('thời gian luộc') ||
    t.startsWith('cách tính') ||
    t.startsWith('cách phân biệt') ||
    t.startsWith('cách chọn') ||
    t.startsWith('cách làm sạch') ||
    t.startsWith('giảm tốc độ') ||
    t.startsWith('vỡ mật') ||
    t === 'list món' ||
    t === 'c'
  ) {
    tipsInRecipes.push({ id: r.id, title: r.title, stepsCount: r.steps?.length, ingsCount: r.ingredients?.length });
  }
}

console.log(`Found ${tipsInRecipes.length} tips/broken items in recipes:`);
console.log(JSON.stringify(tipsInRecipes, null, 2));
