const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

function inspectBody(file) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const bodyM = content.match(/<div class="page-body">([\s\S]*?)<\/div>\s*<\/article>/);
  console.log('=== ' + file + ' ===');
  if (bodyM) {
    console.log(bodyM[1].slice(0, 1500));
  } else {
    console.log('No body found');
  }
}

inspectBody('Bài 1 Tóm tắt và lưu ý 1744320ba42b800488ecca3ca89a0df9.html');
inspectBody('Eat Clean là gì 1c34320ba42b80ac87fdc2494535b53b.html');
