const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

['01 474b3cb6bb2644b688a30e26ad10889a.html', '259461510_3066295940307299_5729241000276160624_n 1034320ba42b80a1a8f6e8065e5d690c.html'].forEach(f => {
  if (!fs.existsSync(path.join(dir, f))) {
    console.log('Not found:', f);
    return;
  }
  const c = fs.readFileSync(path.join(dir, f), 'utf8');
  console.log('=== ' + f + ' ===');
  console.log(c.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '\n').split('\n').map(l => l.trim()).filter(Boolean).slice(0, 20).join('\n'));
  const imgs = [...c.matchAll(/data-notion-image="([^">]+)"/g)].map(m => decodeURIComponent(m[1]));
  console.log('Images:', imgs);
});
