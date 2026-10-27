const fs = require('fs');
const path = require('path');
const dir = 'P:/CookbookData/recipes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const titleMap = new Map();

for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const title = (data.title || data.name || '').trim().toLowerCase();
  if (!titleMap.has(title)) titleMap.set(title, []);
  titleMap.get(title).push({
    file: f,
    id: data.id,
    ingsCount: data.ingredients?.length || 0,
    stepsCount: (data.steps || data.instructions || []).length,
    updatedAt: data.updated_at || data.created_at,
    hasImage: Boolean(data.image_url || (data.images && data.images.length > 0))
  });
}

let dupCount = 0;
for (const [title, list] of titleMap.entries()) {
  if (list.length > 1) {
    dupCount++;
    if (dupCount <= 15) {
      console.log(`Title: "${title}" (${list.length} files):`);
      for (const item of list) {
        console.log(`  - ${item.file} (id: ${item.id}, ings: ${item.ingsCount}, steps: ${item.stepsCount}, img: ${item.hasImage})`);
      }
    }
  }
}
console.log('Total duplicated titles:', dupCount);
console.log('Total unique titles:', titleMap.size);
