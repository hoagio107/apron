const fs = require('fs');
const path = require('path');
const notionDir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const pRecipesDir = 'P:/CookbookData/recipes';
const index = JSON.parse(fs.readFileSync('P:/CookbookData/recipes_index.json', 'utf8'));
const notionFiles = fs.readdirSync(notionDir).filter(f => f.endsWith('.html'));

function stripAccents(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Index all Notion files
const parsedNotion = [];
for (const f of notionFiles) {
  const content = fs.readFileSync(path.join(notionDir, f), 'utf8');
  const tm = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const rawTitle = tm ? tm[1].replace(/<[^>]+>/g, '').trim() : f;
  parsedNotion.push({
    file: f,
    rawTitle,
    cleanTitle: stripAccents(rawTitle),
    content,
    hasIng: content.includes('Nguyên liệu') && /•|\d+\s*(g|kg|ml|lít|muỗng|thìa|quả|trái|củ|lát|miếng)/i.test(content),
    hasSteps: content.includes('Cách làm') && content.length > 500
  });
}

console.log(`Parsed ${parsedNotion.length} Notion files.`);

const JUNK_IDS = new Set([
  'recipe-c-2d606928', 'recipe-list-mon-c1f14b87', 'recipe-vo-mat-ca-fbf18b7a',
  'recipe-thoi-gian-luoc-thit-0865d938', 'recipe-thoi-gian-luoc-rau-9a31547d',
  'recipe-ra-dong-do-an-nhanh-4db083d1', 'recipe-ra-dong-tom-b0028158',
  'recipe-giam-toc-do-chin-cua-chuoi-a73cc313', 'recipe-meo-luoc-rau-cu-12e635ec',
  'recipe-cach-tinh-bmi-bmr-tdee-6f08cb9b', 'recipe-cach-chuan-bi-bua-an-eat-clean-hieu-qua-de934fb1',
  'recipe-rua-mot-so-loai-thit-dc589959', 'recipe-quy-trinh-so-che-rau-cu-qua-fe2893cc',
  'recipe-quy-trinh-so-che-dam-de025b60', 'recipe-quy-trinh-tam-uop-dam-0e479225',
  'recipe-phong-chong-ngua-tay-khi-goi-rau-cu-c5688816', 'recipe-phi-hanh-gion-b39a62fa',
  'recipe-noi-bat-dinh-chat-nhau-74ba66f6', 'recipe-nau-com-445f250f',
  'recipe-nau-uc-ga-mem-mong-50e7d7b1', 'recipe-nau-soup-khong-tach-nuoc-c5b5cd94',
  'recipe-nau-chao-khong-trao-6d473724', 'recipe-nguyen-tac-chon-thuc-pham-eat-clean-023e61f0',
  'recipe-khi-sup-canh-bi-man-273ee8c4', 'recipe-luoc-bau-khong-tham-776e544d',
  'recipe-hanh-tay-lam-moi-do-bep-45a5b26f', 'recipe-giu-khoai-tay-khoi-nay-mam-7b8fd407',
  'recipe-gia-vi-f4bd6b65', 'recipe-eat-clean-b0c7b9dd'
]);

const emptyRecipes = index.filter(r => !JUNK_IDS.has(r.id) && (!r.ingredients || r.ingredients.length === 0));
let recoveredCount = 0;
const recoveredList = [];
const notFoundList = [];

for (const r of emptyRecipes) {
  const rClean = stripAccents(r.title);
  const rWords = rClean.split(/\s+/).filter(w => w.length > 1);

  // Find best match in Notion
  let best = null;
  let bestScore = 0;

  for (const n of parsedNotion) {
    if (n.cleanTitle === rClean) {
      best = n;
      bestScore = 1.0;
      break;
    }
    const nWords = n.cleanTitle.split(/\s+/).filter(w => w.length > 1);
    const common = rWords.filter(w => nWords.includes(w)).length;
    const score = common / Math.max(rWords.length, nWords.length);
    if (score > 0.6 && score > bestScore) {
      bestScore = score;
      best = n;
    }
  }

  if (best && (best.hasIng || best.hasSteps)) {
    recoveredCount++;
    recoveredList.push({ id: r.id, title: r.title, notionFile: best.file, hasIng: best.hasIng, hasSteps: best.hasSteps });
  } else {
    notFoundList.push({ id: r.id, title: r.title, category: r.category, steps: r.steps?.length });
  }
}

console.log(`\n=== KẾT QUẢ KHÔI PHỤC TỪ NOTION ===`);
console.log(`Tổng số công thức thiếu nguyên liệu: ${emptyRecipes.length}`);
console.log(`Số công thức tìm thấy trong Notion có nội dung: ${recoveredCount}`);
console.log(`Số công thức còn lại: ${notFoundList.length}\n`);

console.log('Sample recovered:');
console.log(recoveredList.slice(0, 15));

console.log('\nRemaining recipes:');
console.log(notFoundList.map(x => `[${x.category}] ${x.title}`).join('\n'));
