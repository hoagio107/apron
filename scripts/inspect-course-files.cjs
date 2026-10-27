const fs = require('fs');
const path = require('path');

const NOTION_DIR = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

function inspectFile(filename) {
  const content = fs.readFileSync(path.join(NOTION_DIR, filename), 'utf8');
  console.log(`\n========================================================`);
  console.log(`FILE: ${filename}`);
  console.log(content.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '\n').split('\n').map(l => l.trim()).filter(Boolean).slice(0, 30).join('\n'));
}

inspectFile('Lớp học 25a4320ba42b80ab9f19d36ab0abe7b0.html');
inspectFile('Cơm nắm 1744320ba42b804c8eb9c1fdffcd8fe7.html');
