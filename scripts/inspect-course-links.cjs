const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

function getLinks(file) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const links = [...content.matchAll(/<a[^>]+href="([^">]+)"/g)].map(m => decodeURIComponent(m[1]));
  return links.filter(l => l.endsWith('.html'));
}

console.log('Lớp học links:');
console.log(getLinks('Lớp học 25a4320ba42b80ab9f19d36ab0abe7b0.html'));

console.log('\nEat Clean links:');
console.log(getLinks('Eat Clean 9a61a63128c7411494aed7aa48d97a8f.html'));

console.log('\nCơm nắm links:');
console.log(getLinks('Cơm nắm 1744320ba42b804c8eb9c1fdffcd8fe7.html'));

console.log('\nMì rau củ links:');
console.log(getLinks('Mì rau củ c38fe7332af04e8d9279287436564986.html'));

console.log('\nBánh bao links:');
console.log(getLinks('Bánh bao 19f4320ba42b80d798d7e9e19070a967.html'));
