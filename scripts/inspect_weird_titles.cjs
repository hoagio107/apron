const fs = require('fs');
const path = require('path');
const dir = 'P:/CookbookData/recipes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const weirdTitles = [];
const nonRecipes = [];

for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const title = (data.title || data.name || '').trim();

  if (title.length <= 3 || /^(page|bài \d+|chương|list|test|untitled)/i.test(title)) {
    weirdTitles.push({ file: f, title, dataSnippet: { ings: data.ingredients?.length, steps: data.steps?.length } });
  }

  if (/bmi|bmr|tdee|mẹo luộc|cách chuẩn bị|eat clean hiệu quả|bảo quản/i.test(title)) {
    nonRecipes.push({ file: f, title });
  }
}

console.log('Weird titles:');
console.log(weirdTitles);

console.log('\nNon-recipe articles / tips found in recipes:');
console.log(nonRecipes);
