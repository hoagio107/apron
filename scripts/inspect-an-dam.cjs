const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

const files = [
  'Ăn dặm 1034320ba42b80d3a319ce85d0198667.html',
  'Thực đơn 5M 1444320ba42b80e59206d146a6cf6090.html',
  'Thực đơn 6M 1034320ba42b8091b89fe2fc034eb93b.html',
  'Thực đơn 7M 1034320ba42b805897d4def9a2e41188.html',
  'Thực đơn 12M e713c12a01994fb282089e2046106f47.html'
];

files.forEach(f => {
  const c = fs.readFileSync(path.join(dir, f), 'utf8');
  console.log(`\n========================================================`);
  console.log(`FILE: ${f}`);
  
  // Find images
  const imgs = [...c.matchAll(/data-notion-image="([^">]+)"/g)].map(m => decodeURIComponent(m[1]));
  const links = [...c.matchAll(/<a[^>]+href="([^">]+)"/g)].map(m => decodeURIComponent(m[1])).filter(l => l.endsWith('.html'));
  
  console.log(`Images count: ${imgs.length}`);
  console.log('Sample images:', imgs.slice(0, 5));
  console.log(`Links count: ${links.length}`);
  console.log('Sample links:', links.slice(0, 5));
  
  // Text preview
  const text = c.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);
  console.log('Text preview:', text.slice(0, 15));
});
