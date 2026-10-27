const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

const samples = [
  'Ba chỉ giòn bì 1394320ba42b80079a4ac947cad3066a.html',
  'Bibimbap - Cơm trộn Hàn Quốc 2674320ba42b80ae9168d40afc9a9198.html',
  'Bánh chuối yến mạch 2834320ba42b80e7a185f19caefb25b5.html',
  'Bò lúc lắc (1) 2674320ba42b80eb8302e7d8d4f6e0d9.html',
  'Miến xào tôm cà rốt 1034320ba42b80e4b52fe6df50257e84.html'
];

samples.forEach(s => {
  const content = fs.readFileSync(path.join(dir, s), 'utf8');
  console.log('========================================================');
  console.log('FILE:', s);
  
  // Extract text inside page-body
  const bodyM = content.match(/<div class="page-body">([\s\S]*?)<\/div>\s*<\/article>/);
  if (bodyM) {
    // print first 1500 chars of body with tags partially cleaned
    const preview = bodyM[1].replace(/<table[\s\S]*?<\/table>/, '[PROPERTIES TABLE]');
    console.log(preview.slice(0, 1500));
  } else {
    console.log(content.slice(0, 1000));
  }
});
