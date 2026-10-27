const fs = require('fs');
const path = require('path');
const pRecipesDir = 'P:/CookbookData/recipes';
const index = JSON.parse(fs.readFileSync('P:/CookbookData/recipes_index.json', 'utf8'));

const JUNK_IDS = new Set([
  'recipe-c-2d606928',
  'recipe-list-mon-c1f14b87',
  'recipe-vo-mat-ca-fbf18b7a',
  'recipe-thoi-gian-luoc-thit-0865d938',
  'recipe-thoi-gian-luoc-rau-9a31547d',
  'recipe-ra-dong-do-an-nhanh-4db083d1',
  'recipe-ra-dong-tom-b0028158',
  'recipe-giam-toc-do-chin-cua-chuoi-a73cc313',
  'recipe-meo-luoc-rau-cu-12e635ec',
  'recipe-cach-tinh-bmi-bmr-tdee-6f08cb9b',
  'recipe-cach-chuan-bi-bua-an-eat-clean-hieu-qua-de934fb1',
  'recipe-rua-mot-so-loai-thit-dc589959',
  'recipe-quy-trinh-so-che-rau-cu-qua-fe2893cc',
  'recipe-quy-trinh-so-che-dam-de025b60',
  'recipe-quy-trinh-tam-uop-dam-0e479225',
  'recipe-phong-chong-ngua-tay-khi-goi-rau-cu-c5688816',
  'recipe-phi-hanh-gion-b39a62fa',
  'recipe-noi-bat-dinh-chat-nhau-74ba66f6',
  'recipe-nau-com-445f250f',
  'recipe-nau-uc-ga-mem-mong-50e7d7b1',
  'recipe-nau-soup-khong-tach-nuoc-c5b5cd94',
  'recipe-nau-chao-khong-trao-6d473724',
  'recipe-nguyen-tac-chon-thuc-pham-eat-clean-023e61f0',
  'recipe-khi-sup-canh-bi-man-273ee8c4',
  'recipe-luoc-bau-khong-tham-776e544d',
  'recipe-hanh-tay-lam-moi-do-bep-45a5b26f',
  'recipe-giu-khoai-tay-khoi-nay-mam-7b8fd407',
  'recipe-gia-vi-f4bd6b65',
  'recipe-eat-clean-b0c7b9dd'
]);

const valid = index.filter(r => !JUNK_IDS.has(r.id));
const emptyIngs = valid.filter(r => !r.ingredients || r.ingredients.length === 0);

console.log(`Total valid recipes: ${valid.length}`);
console.log(`Empty ingredients recipes to repair: ${emptyIngs.length}`);

// Print all titles of emptyIngs so we have complete visibility
console.log(emptyIngs.map(r => `[${r.category || 'N/A'}] ${r.title}`).join('\n'));
