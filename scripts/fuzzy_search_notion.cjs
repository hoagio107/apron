const fs = require('fs');
const path = require('path');
const notionDir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const files = fs.readdirSync(notionDir).filter(f => f.endsWith('.html'));

function stripAccents(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

const list = [
  'Đồ xôi', 'Bún đậu mắm tôm', 'Canh Vịt Nấu Măng', 'Canh Trứng Cà Chua',
  'Canh Khổ Qua Nhồi Thịt', 'Canh Cá Dưa Chua', 'Bún cá rô đồng', 'Bún bò trộn Nam Bộ',
  'Cháo sườn quẩy', 'Cơm sườn nướng', 'Ngan cháy tỏi', 'Lẩu cua đồng'
];

for (const name of list) {
  const words = stripAccents(name).split(/\s+/).filter(w => w.length > 1);
  const matched = files.filter(f => {
    const fn = stripAccents(f);
    return words.every(w => fn.includes(w));
  });
  if (matched.length > 0) {
    console.log(`Found "${name}" in Notion:`, matched[0]);
    // Check if it has content
    const c = fs.readFileSync(path.join(notionDir, matched[0]), 'utf8');
    const text = c.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    console.log('   Snippet:', text.slice(0, 150));
  } else {
    console.log(`Not found in Notion: "${name}"`);
  }
}
