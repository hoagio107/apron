const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '');
}

const csvFiles = [
  'Công thức 819711dc522d494f910e9eff8540517f.csv',
  'Chưa có tiêu đề 1034320ba42b80e1ab4dfc8ee6723513.csv',
  'Các công thức cơ bản với máy làm mỳ cbb201f2b545418f88a3766f0f876f8b.csv',
  'Đồ uống 2994320ba42b80d5ad42d09cd37f5e2e.csv'
];

const csvTitles = new Set();
csvFiles.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const lines = content.split('\n').filter(Boolean);
  lines.slice(1).forEach(l => {
    let title = l.split(',')[0].replace(/^["']|["']$/g, '').trim();
    if (title) csvTitles.add(norm(title));
  });
});

console.log('Unique normalized titles in 4 recipe CSVs:', csvTitles.size);

const allHtml = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
const nonCsvHtml = [];
allHtml.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const titleM = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';
  const n = norm(title.replace(/\s*\(\d+\)$/, ''));
  if (title && !/^\d+(_\d+)*(_n)?$/.test(title) && !/^Page \d+$/i.test(title) && !/^Bài \d+:/i.test(title)) {
    if (!csvTitles.has(n)) {
      nonCsvHtml.push({ file: f, title, length: content.length });
    }
  }
});

console.log('HTML files not in CSVs:', nonCsvHtml.length);
nonCsvHtml.slice(0, 50).forEach(x => console.log(' - ', x.title, '(', x.file, ') length:', x.length));
