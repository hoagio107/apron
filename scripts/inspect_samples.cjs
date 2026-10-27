const fs = require('fs');
const report = JSON.parse(fs.readFileSync('c:/apron/scripts/diagnosis_report.json', 'utf8'));

console.log('=== 1. SAMPLES OF ONLY STEPS (MISSING INGREDIENTS) - 10 SAMPLES ===');
for (const item of report.only_ingredients_empty.slice(0, 10)) {
  const data = JSON.parse(fs.readFileSync('P:/CookbookData/recipes/' + item.file, 'utf8'));
  console.log(`\nFile: ${item.file} | Title: ${item.title}`);
  console.log(`Tags:`, data.tags);
  console.log(`Steps (${(data.steps || []).length}):`, JSON.stringify(data.steps));
  if (data.notes) console.log(`Notes:`, data.notes);
  if (data.description) console.log(`Description:`, data.description);
}

console.log('\n=== 2. SAMPLES OF ONLY INGREDIENTS (MISSING STEPS) - 5 SAMPLES ===');
for (const item of report.only_steps_empty.slice(0, 5)) {
  const data = JSON.parse(fs.readFileSync('P:/CookbookData/recipes/' + item.file, 'utf8'));
  console.log(`\nFile: ${item.file} | Title: ${item.title}`);
  console.log(`Tags:`, data.tags);
  console.log(`Ingredients (${(data.ingredients || []).length}):`, JSON.stringify(data.ingredients));
  if (data.notes) console.log(`Notes:`, data.notes);
  if (data.description) console.log(`Description:`, data.description);
}

console.log('\n=== 3. SAMPLES OF STEP IS JUST TITLE - 5 SAMPLES ===');
for (const item of report.step_is_just_title.slice(0, 5)) {
  const data = JSON.parse(fs.readFileSync('P:/CookbookData/recipes/' + item.file, 'utf8'));
  console.log(`\nFile: ${item.file} | Title: ${item.title}`);
  console.log(`Image:`, data.image_url);
  console.log(`Category:`, data.category);
  console.log(`Tags:`, data.tags);
  console.log(`Step:`, data.steps);
}
