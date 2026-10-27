const fs = require('fs');
const path = require('path');
const notionDir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const files = fs.readdirSync(notionDir).filter(f => f.endsWith('.html'));

let countWithDetailsIng = 0;
const samples = [];

for (const f of files) {
  const content = fs.readFileSync(path.join(notionDir, f), 'utf8');
  if (content.includes('Nguyên liệu')) {
    // Check if it's inside <details>
    const m = content.match(/<details[\s\S]*?Nguyên liệu[\s\S]*?<\/details>/i);
    if (m) {
      countWithDetailsIng++;
      if (samples.length < 10) {
        // extract title
        const tm = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
        const title = tm ? tm[1].replace(/<[^>]+>/g, '').trim() : f;
        samples.push({ file: f, title });
      }
    }
  }
}

console.log(`Total Notion files with Nguyên liệu inside <details>: ${countWithDetailsIng} / ${files.length}`);
console.log('Samples:', samples);
