const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

['Bài 1 Tóm tắt và lưu ý 1744320ba42b800488ecca3ca89a0df9.html', 'Bài 2 Cách nấu cơm 1744320ba42b80b5b153e94cb366c296.html'].forEach(f => {
  const c = fs.readFileSync(path.join(dir, f), 'utf8');
  console.log('=== ' + f + ' ===');
  console.log(c.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '\n').split('\n').map(l => l.trim()).filter(Boolean).slice(0, 30).join('\n'));
});
