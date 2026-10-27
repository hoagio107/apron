const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const sampleHtml = 'Ba chỉ giòn bì 1394320ba42b80079a4ac947cad3066a.html';
const content = fs.readFileSync(path.join(dir, sampleHtml), 'utf8');

// Find images
const imgMatches = [...content.matchAll(/<img[^>]+src="([^">]+)"/g)];
const figureMatches = [...content.matchAll(/data-notion-image="([^">]+)"/g)];

console.log('imgMatches:', imgMatches.map(m => m[1]));
console.log('figureMatches:', figureMatches.map(m => m[1]));

figureMatches.forEach(m => {
  const imgName = decodeURIComponent(m[1]);
  console.log('File exists?', imgName, fs.existsSync(path.join(dir, imgName)));
});
