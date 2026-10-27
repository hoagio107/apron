const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

const allFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let withSummaryIng = 0;
let withBulletedIng = 0;
let withParagraphIng = 0;
let withoutIng = 0;
const emptyIngSamples = [];

allFiles.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const titleM = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';

  // Filter out non-recipes
  if (!title || /^\d+(_\d+)*(_n)?$/.test(title) || /^Page \d+$/i.test(title) || /^\d{2}$/.test(title)) return;
  if (/^Bài \d+:/i.test(title)) return;
  if (/Eat Clean là gì|Nguyên tắc quan trọng để giảm cân|Chỉ số BMI|Tính BMR/i.test(title)) return;
  if (/^Mẹo /i.test(title) || /^Chiên đậu hũ không vỡ/i.test(title) || /^Bí quyết /i.test(title)) return;
  if (/^Thực đơn \d+M$/i.test(title)) return;
  if (/^(Meal Prep|Lớp học|Nấu ăn|Ăn dặm|Đơn vị|Đồ uống|Web công thức|Gia vị đang dùng|Bữa sáng\/bữa phụ)$/i.test(title)) return;

  // Check how ingredients are present
  // 1. Look for <details ...> or section with "Nguyên liệu"
  const ingSectionM = content.match(/<details[^>]*>[\s\S]*?<strong>Nguyên liệu<\/strong>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/i);
  if (ingSectionM) {
    const ingBody = ingSectionM[1];
    const hasBullets = ingBody.includes('<li');
    const text = ingBody.replace(/<[^>]+>/g, '').trim();
    if (hasBullets) {
      withBulletedIng++;
    } else if (text.length > 5) {
      withParagraphIng++;
    } else {
      withoutIng++;
      emptyIngSamples.push({ file: f, title, reason: 'Empty details block' });
    }
    withSummaryIng++;
  } else {
    // Check if "nguyên liệu" appears in text
    if (/nguyên liệu/i.test(content)) {
      withParagraphIng++;
    } else {
      withoutIng++;
      emptyIngSamples.push({ file: f, title, reason: 'No nguyên liệu found' });
    }
  }
});

console.log(`Summary:`);
console.log(`With details summary: ${withSummaryIng}`);
console.log(`Bulleted: ${withBulletedIng}`);
console.log(`Paragraph / text: ${withParagraphIng}`);
console.log(`Without ingredients: ${withoutIng}`);
console.log(`\nSamples without ingredients (${emptyIngSamples.length}):`);
emptyIngSamples.slice(0, 20).forEach(s => console.log(`  - [${s.reason}] "${s.title}" (${s.file})`));
