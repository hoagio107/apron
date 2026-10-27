const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

function cleanTitle(s) {
  return String(s || '').replace(/\s*\(\d+\)$/, '').trim();
}

function norm(s) {
  return cleanTitle(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '');
}

// 1. Gather all recipe CSVs
const recipeCsvFiles = [
  'Công thức 819711dc522d494f910e9eff8540517f.csv',
  'Chưa có tiêu đề 1034320ba42b80e1ab4dfc8ee6723513.csv',
  'Các công thức cơ bản với máy làm mỳ cbb201f2b545418f88a3766f0f876f8b.csv',
  'Đồ uống 2994320ba42b80d5ad42d09cd37f5e2e.csv'
];

const recipeTitles = new Map();
recipeCsvFiles.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const lines = content.split('\n').filter(Boolean);
  lines.slice(1).forEach(l => {
    let raw = l.split(',')[0].replace(/^["']|["']$/g, '').trim();
    if (raw) recipeTitles.set(norm(raw), { rawTitle: raw, sourceCsv: f });
  });
});

console.log(`Found ${recipeTitles.size} unique recipe titles in the 4 recipe CSV databases.`);

// Other CSVs:
const otherCsvFiles = [
  'Mẹo nấu ăn 0870ca20734c4b369ac58db270c0b42e.csv',
  'Kiến thức cơ bản 1c34320ba42b802e93e5e0257c5d7370.csv',
  'Chưa có tiêu đề 1744320ba42b804a85cbf4dd91285d48.csv' // Bài 1, 2...
];
const otherTitles = new Set();
otherCsvFiles.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const lines = content.split('\n').filter(Boolean);
  lines.slice(1).forEach(l => {
    let raw = l.split(',')[0].replace(/^["']|["']$/g, '').trim();
    if (raw) otherTitles.add(norm(raw));
  });
});

// Check all HTML files
const allHtml = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
const uncategorized = [];

allHtml.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const titleM = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';
  if (!title) return;

  // Ignore photo filenames
  if (/^\d+(_\d+)*(_n)?$/.test(title) || /^Page \d+$/i.test(title) || /^\d{2}$/.test(title)) return;
  if (/^Bài \d+:/i.test(title)) return;

  const n = norm(title);
  if (!recipeTitles.has(n) && !otherTitles.has(n)) {
    uncategorized.push({ file: f, title, length: content.length });
  }
});

console.log(`Uncategorized HTML files: ${uncategorized.length}`);
uncategorized.forEach(u => console.log(`  - "${u.title}" (${u.file}) len:${u.length}`));
