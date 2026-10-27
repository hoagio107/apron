const fs = require('fs');
const dir = 'P:/CookbookData/recipes';
const a = JSON.parse(fs.readFileSync(dir + '/banh-mi-nckd.json', 'utf8'));
const b = JSON.parse(fs.readFileSync(dir + '/recipe-banh-mi-nckd-22c3fa17.json', 'utf8'));

console.log('--- banh-mi-nckd.json:');
console.log('id:', a.id, 'title:', a.title, 'updated_at:', a.updated_at);
console.log('tags:', a.tags);
console.log('ings count:', a.ingredients?.length);
console.log('steps count:', a.steps?.length);

console.log('\n--- recipe-banh-mi-nckd-22c3fa17.json:');
console.log('id:', b.id, 'title:', b.title, 'updated_at:', b.updated_at);
console.log('tags:', b.tags);
console.log('ings count:', b.ingredients?.length);
console.log('steps count:', b.steps?.length);

const allKeys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
for (const k of allKeys) {
  if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) {
    console.log(`Difference in key [${k}]:`);
    console.log('  banh-mi-nckd:', JSON.stringify(a[k]));
    console.log('  recipe-banh-mi-nckd-22c3fa17:', JSON.stringify(b[k]));
  }
}
