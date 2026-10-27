const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

// 1. Cơm nắm lessons
console.log('=== CƠM NẮM LESSONS ===');
const comNamFile = 'Cơm nắm 1744320ba42b804c8eb9c1fdffcd8fe7.html';
const comNamContent = fs.readFileSync(path.join(dir, comNamFile), 'utf8');
const comNamLinks = [...comNamContent.matchAll(/<a[^>]+href="([^">]+)"/g)].map(m => decodeURIComponent(m[1])).filter(l => l.endsWith('.html'));

comNamLinks.forEach(l => {
  const c = fs.readFileSync(path.join(dir, l), 'utf8');
  const titleM = c.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';
  const imgM = c.match(/data-notion-image="([^">]+)"/);
  console.log(` - ${title} | img: ${imgM ? imgM[1] : 'none'} | len: ${c.length}`);
});

// 2. Eat Clean lessons
console.log('\n=== EAT CLEAN LESSONS ===');
const eatCleanFile = 'Eat Clean 9a61a63128c7411494aed7aa48d97a8f.html';
const eatCleanContent = fs.readFileSync(path.join(dir, eatCleanFile), 'utf8');
const eatCleanLinks = [...eatCleanContent.matchAll(/<a[^>]+href="([^">]+)"/g)].map(m => decodeURIComponent(m[1])).filter(l => l.endsWith('.html'));

eatCleanLinks.forEach(l => {
  const c = fs.readFileSync(path.join(dir, l), 'utf8');
  const titleM = c.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';
  const imgM = c.match(/data-notion-image="([^">]+)"/);
  console.log(` - ${title} | img: ${imgM ? imgM[1] : 'none'} | len: ${c.length}`);
});
