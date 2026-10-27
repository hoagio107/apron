const fs = require('fs');
const importData = JSON.parse(fs.readFileSync('C:/Users/Admin/Downloads/cookbook_recipes_import.json', 'utf8'));
console.log('108 existing titles:');
importData.recipes.forEach((r, i) => console.log(`${i+1}. ${r.title}`));
