const fs = require('fs');
const path = require('path');

const NOTION_DIR = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const allFiles = fs.readdirSync(NOTION_DIR);

console.log('Searching for course-related files in Notion export...');

// 1. Check CSV files
const csvFiles = allFiles.filter(f => f.endsWith('.csv'));
console.log('\n--- CSV FILES ---');
csvFiles.forEach(f => {
  const content = fs.readFileSync(path.join(NOTION_DIR, f), 'utf8');
  console.log(`\nCSV: ${f}`);
  const lines = content.split('\n').filter(Boolean);
  console.log(`  Rows: ${lines.length}, Header: ${lines[0]}`);
  lines.slice(1, 6).forEach(l => console.log(`   * ${l}`));
});

// 2. Search HTML files with "Lớp học", "Khóa học", "Khoá học", "Bài học", "Bài "
console.log('\n--- HTML FILES MATCHING COURSE PATTERNS ---');
const courseHtml = allFiles.filter(f => {
  if (!f.endsWith('.html')) return false;
  return /lớp học|khoá học|khóa học|bài \d+|chương \d+|module|giáo trình/i.test(f);
});

courseHtml.forEach(f => {
  const content = fs.readFileSync(path.join(NOTION_DIR, f), 'utf8');
  const titleM = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';
  console.log(`  File: ${f} -> Title: "${title}", Length: ${content.length}`);
});
