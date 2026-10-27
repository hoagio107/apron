const fs = require('fs');
const path = require('path');
const notionDir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const files = fs.readdirSync(notionDir).filter(f => f.endsWith('.html'));

function searchTitle(q) {
  for (const f of files) {
    const content = fs.readFileSync(path.join(notionDir, f), 'utf8');
    if (content.toLowerCase().includes(q.toLowerCase())) {
      console.log(`Found "${q}" in: ${f}`);
      const titleM = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
      console.log('  Page Title:', titleM ? titleM[1] : 'none');
      const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      console.log('  Snippet:', text.slice(0, 300));
      return;
    }
  }
  console.log('Not found:', q);
}

searchTitle('Bánh đúc thịt heo');
searchTitle('Bún chả ức gà');
searchTitle('Bánh đa cua');
