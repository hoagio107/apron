const fs = require('fs');
const report = JSON.parse(fs.readFileSync('c:/apron/scripts/diagnosis_report.json', 'utf8'));

const list = [
  'recipe-banh-dua-nuong-5de8961a.json',
  'recipe-bo-kho-d79a8a64.json',
  'recipe-canh-cua-mong-toi-muop-d92efe6e.json',
  'recipe-chao-yen-mach-ga-ngo-nam-52bf0292.json',
  'recipe-ca-hoi-sot-chanh-day-f710e8a9.json'
];

for (const f of list) {
  const data = JSON.parse(fs.readFileSync('P:/CookbookData/recipes/' + f, 'utf8'));
  console.log(`\n========================================`);
  console.log(`FILE: ${f} | TITLE: ${data.title}`);
  console.log(`Ingredients:`, data.ingredients);
  console.log(`Steps (${(data.steps || []).length}):`);
  for (let i = 0; i < (data.steps || []).length; i++) {
    const s = data.steps[i];
    console.log(`  [Step ${i}]:`, typeof s === 'string' ? s : s.instruction);
  }
}
