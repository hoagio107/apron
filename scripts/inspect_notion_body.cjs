const fs = require('fs');
const path = require('path');
const notionDir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

function showDetails(f) {
  const content = fs.readFileSync(path.join(notionDir, f), 'utf8');
  console.log('=== ' + f + ' ===');
  const details = content.match(/<details[\s\S]*?<\/details>/g);
  if (details) {
    for (const d of details) {
      console.log('DETAILS CONTENT:');
      console.log(d.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    }
  } else {
    console.log('No details tag found. Content after body:');
    const bodyM = content.match(/<div class="page-body">([\s\S]*?)<\/div>/);
    console.log((bodyM ? bodyM[1] : content).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500));
  }
}

showDetails('Bún chả ức gà (1) 2674320ba42b80c0b8b3d98a06639f38.html');
showDetails('Bánh đa cua 1154320ba42b80e89d51cce4819b90f9.html');
showDetails('Bánh đúc thịt heo 1034320ba42b80a3ac9cc97734198206.html');
