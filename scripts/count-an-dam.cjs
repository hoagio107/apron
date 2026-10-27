const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

const months = ['5M', '6M', '7M', '8M', '9M', '10M', '11M', '12M', '15M', 'bữa phụ'];
months.forEach(m => {
  const f = fs.readdirSync(dir).find(file => file.toLowerCase().includes(m.toLowerCase()) && file.endsWith('.html'));
  if (f) {
    const c = fs.readFileSync(path.join(dir, f), 'utf8');
    const links = [...c.matchAll(/<a[^>]+href="([^">]+)"/g)].map(x => decodeURIComponent(x[1])).filter(l => l.endsWith('.html'));
    const imgs = [...c.matchAll(/data-notion-image="([^">]+)"/g)].map(x => decodeURIComponent(x[1]));
    
    // In child pages, count images
    let childImages = 0;
    links.forEach(l => {
      const p = path.join(dir, l);
      if (fs.existsSync(p)) {
        const childC = fs.readFileSync(p, 'utf8');
        const childImgs = [...childC.matchAll(/data-notion-image="([^">]+)"/g)];
        childImages += childImgs.length;
      }
    });

    console.log(`${m.padEnd(15)} => Links: ${links.length.toString().padEnd(4)} | Direct imgs: ${imgs.length} | Total child imgs: ${childImages}`);
  }
});
