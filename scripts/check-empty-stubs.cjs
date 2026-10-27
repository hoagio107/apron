const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

const allFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
const emptyContentFiles = [];

allFiles.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const titleM = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';

  if (!title || /^\d+(_\d+)*(_n)?$/.test(title) || /^Page \d+$/i.test(title) || /^\d{2}$/.test(title)) return;
  if (/^Bài \d+:/i.test(title)) return;
  if (/Eat Clean là gì|Nguyên tắc quan trọng để giảm cân|Chỉ số BMI|Tính BMR/i.test(title)) return;
  if (/^Mẹo /i.test(title) || /^Chiên đậu hũ không vỡ/i.test(title) || /^Bí quyết /i.test(title) || /^Luộc bánh trôi/i.test(title) || /^Nấu trứng/i.test(title) || /^Chiên không bắn/i.test(title) || /^Chiên nem/i.test(title) || /^Bóc tỏi/i.test(title) || /^Bảo quản/i.test(title) || /^Chữa /i.test(title)) return;
  if (/^Thực đơn \d+M$/i.test(title)) return;
  if (/^(Meal Prep|Lớp học|Nấu ăn|Ăn dặm|Đơn vị|Đồ uống|Web công thức|Gia vị đang dùng|Bữa sáng\/bữa phụ|Các loại rau xanh|Các loại tinh bột|Các loại đạm|Cháo nồi áp suất)$/i.test(title)) return;

  // Check body after properties table
  const bodyWithoutProps = content
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<table class="properties"[\s\S]*?<\/table>/gi, '')
    .replace(/<h1 class="page-title"[\s\S]*?<\/h1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .trim();

  if (bodyWithoutProps.length < 15) {
    emptyContentFiles.push({ file: f, title, length: bodyWithoutProps.length, text: bodyWithoutProps });
  }
});

console.log(`Found ${emptyContentFiles.length} files with virtually no content/instructions:`);
emptyContentFiles.forEach(e => console.log(`  - "${e.title}" (${e.file})`));
