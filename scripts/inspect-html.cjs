const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

function inspectFile(filename) {
  const content = fs.readFileSync(path.join(dir, filename), 'utf8');
  console.log('====================================');
  console.log('FILE:', filename);
  
  // Title
  const titleM = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  console.log('TITLE:', titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '');

  // Properties
  const propTable = content.match(/<table class="properties">([\s\S]*?)<\/table>/);
  if (propTable) {
    const rows = propTable[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];
    rows.forEach(r => {
      const th = r.match(/<th[^>]*>([\s\S]*?)<\/th>/);
      const td = r.match(/<td[^>]*>([\s\S]*?)<\/td>/);
      const key = th ? th[1].replace(/<[^>]+>/g, '').trim() : '';
      const val = td ? td[1].replace(/<[^>]+>/g, '').trim() : '';
      if (key) console.log(`  PROP: "${key}" = "${val}"`);
    });
  }

  // Check images
  const images = [];
  const imgMatches = content.matchAll(/<(?:img|figure)[^>]+(?:src|data-notion-image)="([^"]+)"/g);
  for (const m of imgMatches) {
    if (!m[1].includes('notion.so/icons')) {
      images.push(m[1]);
    }
  }
  console.log('IMAGES:', Array.from(new Set(images)));

  // Body content preview
  const bodyM = content.match(/<div class="page-body">([\s\S]*?)<\/article>/);
  if (bodyM) {
    // Strip tags and show text
    const text = bodyM[1]
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n\s*\n+/g, '\n')
      .trim();
    console.log('TEXT PREVIEW (first 600 chars):');
    console.log(text.substring(0, 600));
  }
}

// Inspect 3 different recipe HTML files
const sampleFiles = [
  'CÁ LÓC CHIÊN GIÒN SỐT ME a8009b6dd1314d47afaca5b817b54e12.html',
  'Ba chỉ giòn bì 819711dc522d42e6ab20c85c2c77399f.html',
  'Bibimbap - Cơm trộn Hàn Quốc a4167e492ae54c5eab6637b774676575.html'
];

sampleFiles.forEach(inspectFile);
