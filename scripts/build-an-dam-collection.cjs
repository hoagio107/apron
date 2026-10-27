const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const NOTION_DIR = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

// Targets
const APP_COLLECTIONS_DIR = 'C:/Users/Admin/Documents/CookbookData/collections';
const APP_IMAGES_DIR = 'C:/Users/Admin/Documents/CookbookData/images';

const DOWNLOADS_COLLECTIONS_DIR = 'C:/Users/Admin/Downloads/collections';
const DOWNLOADS_IMAGES_DIR = 'C:/Users/Admin/Downloads/CookBook-Non-Duplicates-Images';

[APP_COLLECTIONS_DIR, APP_IMAGES_DIR, DOWNLOADS_COLLECTIONS_DIR, DOWNLOADS_IMAGES_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

function copyImage(rawImgName) {
  if (!rawImgName) return '';
  const decoded = decodeURIComponent(rawImgName);
  const basename = path.basename(decoded);
  const src = path.join(NOTION_DIR, basename);
  if (fs.existsSync(src)) {
    const destApp = path.join(APP_IMAGES_DIR, basename);
    const destDl = path.join(DOWNLOADS_IMAGES_DIR, basename);
    if (!fs.existsSync(destApp)) fs.copyFileSync(src, destApp);
    if (!fs.existsSync(destDl)) fs.copyFileSync(src, destDl);
    return `images/${basename}`;
  }
  return '';
}

// Map each month folder to its Notion parent file and icon
const folderConfigs = [
  { key: '5M', name: 'Thực đơn 5 tháng (5M)', file: 'Thực đơn 5M 1444320ba42b80e59206d146a6cf6090.html', icon: 'Milk' },
  { key: '6M', name: 'Thực đơn 6 tháng (6M)', file: 'Thực đơn 6M 1034320ba42b8091b89fe2fc034eb93b.html', icon: 'Baby' },
  { key: '7M', name: 'Thực đơn 7 tháng (7M)', file: 'Thực đơn 7M 1034320ba42b805897d4def9a2e41188.html', icon: 'Apple' },
  { key: '8M', name: 'Thực đơn 8 tháng (8M)', file: 'Thực đơn 8M 1034320ba42b809497a6dc6fe0cbcc5b.html', icon: 'Carrot' },
  { key: '9M', name: 'Thực đơn 9 tháng (9M)', file: 'Thực đơn 9M 1034320ba42b80fea819e3394a082ba8.html', icon: 'Cookie' },
  { key: '10M', name: 'Thực đơn 10 tháng (10M)', file: 'Thực đơn 10M 1034320ba42b8038bbebf44676781f5d.html', icon: 'Utensils' },
  { key: '11M', name: 'Thực đơn 11 tháng (11M)', file: 'Thực đơn 11M 1034320ba42b8075bc5fd0ba0254a65f.html', icon: 'CookingPot' },
  { key: '12M', name: 'Thực đơn 12 tháng (12M)', file: 'Thực đơn 12M e713c12a01994fb282089e2046106f47.html', icon: 'ChefHat' },
  { key: '15M', name: 'Thực đơn 15 tháng (15M+)', file: 'Thực đơn 15M 1124320ba42b8036928bc4d83af7987c.html', icon: 'Sparkles' },
  { key: 'bua-phu', name: 'Gợi ý Bữa sáng & Bữa phụ', file: 'Bữa sáng bữa phụ bf6e49784cb44e138d259aa92ae5b3f5.html', icon: 'Coffee' }
];

console.log('Building Collection: Thực đơn Ăn dặm cho bé...');

let totalImagesCopied = 0;
const folders = [];

folderConfigs.forEach((cfg, fIdx) => {
  const filePath = path.join(NOTION_DIR, cfg.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${cfg.file}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Extract linked child pages
  const linkMatches = [...content.matchAll(/<a[^>]+href="([^">]+)"/g)].map(m => decodeURIComponent(m[1])).filter(l => l.endsWith('.html'));

  const items = [];

  // Also check if the parent file itself has direct images (e.g. 5M)
  const directImgs = [...content.matchAll(/data-notion-image="([^">]+)"/g)].map(m => decodeURIComponent(m[1]));
  directImgs.forEach((img, idx) => {
    const imgUrl = copyImage(img);
    if (imgUrl) {
      totalImagesCopied++;
      items.push({
        id: `item-${cfg.key}-direct-${idx + 1}`,
        title: `Thực đơn ${cfg.name} - Ngày ${idx + 1}`,
        image_url: imgUrl,
        notes: `Gợi ý thực đơn ăn dặm cho bé giai đoạn ${cfg.name}.`,
        created_at: new Date().toISOString()
      });
    }
  });

  linkMatches.forEach((childHtmlFile, idx) => {
    const childPath = path.join(NOTION_DIR, childHtmlFile);
    if (!fs.existsSync(childPath)) return;

    const childContent = fs.readFileSync(childPath, 'utf8');
    const childTitleM = childContent.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
    let childTitle = childTitleM ? childTitleM[1].replace(/<[^>]+>/g, '').trim() : '';

    // If title is just a number like "01", name it "Ngày 01" or "Món 01"
    if (/^\d+$/.test(childTitle)) {
      childTitle = `Thực đơn Ngày ${childTitle}`;
    } else if (/^\d+(_\d+)*(_n)?$/.test(childTitle)) {
      childTitle = `Thực đơn mẫu #${idx + 1}`;
    } else if (!childTitle) {
      childTitle = `Thực đơn mẫu #${idx + 1}`;
    }

    // Find image in child page
    const imgM = childContent.match(/data-notion-image="([^">]+)"/) || childContent.match(/<img[^>]+src="([^">]+\.(?:jpg|png|webp|jpeg))"/i);
    let imgUrl = '';
    if (imgM) {
      imgUrl = copyImage(imgM[1]);
      if (imgUrl) totalImagesCopied++;
    }

    // Extract any text / notes
    const textLines = childContent
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<table class="properties"[\s\S]*?<\/table>/gi, '')
      .replace(/<h1 class="page-title"[\s\S]*?<\/h1>/gi, '')
      .replace(/<[^>]+>/g, '\n')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 5 && !l.includes('Trạng thái') && !l.includes('Bữa') && !l.includes('Tags'));

    const notes = textLines.slice(0, 3).join('\n') || `Gợi ý thực đơn ăn dặm giai đoạn ${cfg.name}.`;

    const itemId = `item-${cfg.key}-${idx + 1}-${crypto.createHash('md5').update(childHtmlFile).digest('hex').slice(0, 6)}`;

    items.push({
      id: itemId,
      title: childTitle,
      image_url: imgUrl || undefined,
      notes,
      created_at: new Date().toISOString()
    });
  });

  console.log(` - Folder "${cfg.name}": ${items.length} items/images`);

  folders.push({
    id: `folder-${cfg.key}`,
    name: cfg.name,
    description: `Bộ sưu tập thực đơn dinh dưỡng ăn dặm ${cfg.name}`,
    icon: cfg.icon,
    items
  });
});

const collectionAnDam = {
  id: 'collection-thuc-don-an-dam-cho-be',
  title: 'Thực đơn Ăn dặm cho bé',
  slug: 'thuc-don-an-dam-cho-be',
  description: 'Bộ sưu tập 652 thực đơn ăn dặm toàn diện theo từng tháng tuổi từ 5 tháng đến 15 tháng và gợi ý bữa phụ dinh dưỡng cho bé.',
  cover_image_url: copyImage('1000009143.jpg') || 'images/1000009143.jpg',
  folders,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Write collection to app database & downloads
const appPath = path.join(APP_COLLECTIONS_DIR, `${collectionAnDam.id}.json`);
const dlPath = path.join(DOWNLOADS_COLLECTIONS_DIR, `${collectionAnDam.id}.json`);

fs.writeFileSync(appPath, JSON.stringify(collectionAnDam, null, 2), 'utf8');
fs.writeFileSync(dlPath, JSON.stringify(collectionAnDam, null, 2), 'utf8');

console.log(`\n==================================================`);
console.log(`SUCCESSFULLY CREATED COLLECTION!`);
console.log(`- Collection title: "${collectionAnDam.title}"`);
console.log(`- Total folders: ${folders.length}`);
const totalItems = folders.reduce((acc, f) => acc + f.items.length, 0);
console.log(`- Total items/dishes: ${totalItems}`);
console.log(`- Total images copied: ${totalImagesCopied}`);
console.log(`- Saved to Database: ${appPath}`);
console.log(`- Saved to Downloads: ${dlPath}`);
