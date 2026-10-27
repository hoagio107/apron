const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

function cleanLessonHtml(rawHtml) {
  // Extract content between <div class="page-body"> and </div>\s*</article>
  const m = rawHtml.match(/<div class="page-body">([\s\S]*?)<\/div>\s*<\/article>/);
  if (!m) return '';

  let html = m[1];

  // Remove figure images (since hero image is displayed in hero section)
  html = html.replace(/<figure[\s\S]*?<\/figure>/gi, '');

  // Clean notion styles & data attrs
  html = html.replace(/<details open="" class="[^"]*"[^>]*><summary><mark[^>]*><strong>(.*?)<\/strong><\/mark><\/summary><div class="indented">/gi, '<h4>$1</h4><div>');
  html = html.replace(/<\/details>/gi, '');
  html = html.replace(/data-notion-[a-z-]+="[^"]*"/gi, '');
  html = html.replace(/id="[^"]*"/gi, '');
  html = html.replace(/class="bulleted-list"/gi, 'class="list-disc pl-5 my-2 space-y-1"');
  html = html.replace(/class=""/gi, '');
  html = html.replace(/dir="auto"/gi, '');
  html = html.replace(/dir="ltr"/gi, '');
  html = html.replace(/style="list-style-type:disc"/gi, '');
  html = html.replace(/\s{2,}/g, ' ');

  // Clean empty paragraphs
  html = html.replace(/<p>\s*<\/p>/gi, '');

  return html.trim();
}

const sample1 = fs.readFileSync(path.join(dir, 'Bài 1 Tóm tắt và lưu ý 1744320ba42b800488ecca3ca89a0df9.html'), 'utf8');
console.log('Cleaned Bài 1:');
console.log(cleanLessonHtml(sample1).slice(0, 500));

const sample2 = fs.readFileSync(path.join(dir, 'Eat Clean là gì 1c34320ba42b80ac87fdc2494535b53b.html'), 'utf8');
console.log('\nCleaned Eat Clean là gì:');
console.log(cleanLessonHtml(sample2).slice(0, 500));
