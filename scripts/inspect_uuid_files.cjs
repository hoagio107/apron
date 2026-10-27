const fs = require('fs');
const path = require('path');
const dir = 'P:/CookbookData/recipes';
const files = fs.readdirSync(dir).filter(f => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json$/i.test(f));

console.log(`Found ${files.length} UUID files:`);
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  console.log(`\nFile: ${f} | ID: ${data.id}`);
  console.log(`Title: ${data.title}`);
  console.log(`Tags:`, data.tags);
  console.log(`Difficulty: ${data.difficulty} | Servings: ${data.servings} | Prep: ${data.prep_time} | Cook: ${data.cook_time}`);
  console.log(`Ings: ${(data.ingredients || []).length} | Steps: ${(data.steps || []).length}`);
  if (data.ingredients && data.ingredients[0]) {
    console.log(`Ing sample:`, data.ingredients[0]);
  }
}
