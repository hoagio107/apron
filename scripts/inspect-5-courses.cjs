const fs = require('fs');
const path = require('path');

const NOTION_DIR = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

const files = [
  'Eat Clean 9a61a63128c7411494aed7aa48d97a8f.html',
  'Mì rau củ c38fe7332af04e8d9279287436564986.html',
  'Cơm nắm 1744320ba42b804c8eb9c1fdffcd8fe7.html',
  'Bánh bao 19f4320ba42b80d798d7e9e19070a967.html',
  'Meal Prep 2644320ba42b80cd994aea18aa645069.html'
];

files.forEach(f => {
  const content = fs.readFileSync(path.join(NOTION_DIR, f), 'utf8');
  console.log(`\n========================================================`);
  console.log(`COURSE FILE: ${f}`);
  console.log(content.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '\n').split('\n').map(l => l.trim()).filter(Boolean).slice(0, 40).join('\n'));
});
