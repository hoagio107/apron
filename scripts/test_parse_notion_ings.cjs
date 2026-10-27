const fs = require('fs');
const path = require('path');
const notionDir = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const pRecipesDir = 'P:/CookbookData/recipes';
const index = JSON.parse(fs.readFileSync('P:/CookbookData/recipes_index.json', 'utf8'));
const notionFiles = fs.readdirSync(notionDir).filter(f => f.endsWith('.html'));

function normalizeKey(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s*\(\d+\)$/, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function parseNotionIngredients(content) {
  // Look for details or section with "Nguyên liệu"
  let block = '';
  const detailsM = content.match(/<details[\s\S]*?Nguyên liệu[\s\S]*?<\/summary>([\s\S]*?)<\/details>/i);
  if (detailsM) {
    block = detailsM[1];
  } else {
    const secM = content.match(/(?:>|\b)Nguyên liệu[\s\S]*?(?:<h[123]|<details|Cách làm|$)/i);
    if (secM) block = secM[0];
  }

  if (!block) return [];

  // Parse lines: <li>, <p>, or plain text
  const rawLines = block
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const ingredients = [];
  for (const line of rawLines) {
    const clean = line.replace(/^[•\-\*\+–—\s]+/, '').trim();
    if (!clean || clean.toLowerCase() === 'nguyên liệu') continue;

    // Pattern 1: "200g cá hồi" or "6 trái chanh dây" or "1 kg cua"
    const m1 = clean.match(/^(\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?)\s*(g|gr|kg|ml|lít|lit|l|quả|trái|củ|cái|bó|nhánh|tép|lát|miếng|bát|chén|lon|hộp|gói|muỗng canh|muỗng cà phê|thìa canh|thìa cà phê|thìa súp|tcf|mc|tbsp|tsp)?\s*(.*)$/i);
    // Pattern 2: "Cá hồi: 200g" or "Hành tây: 40g"
    const m2 = clean.match(/^([^:\d]+):\s*(\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?)\s*(g|gr|kg|ml|lít|lit|l|quả|trái|củ|cái|bó|nhánh|tép|lát|miếng|bát|chén|lon|hộp|gói|muỗng canh|muỗng cà phê|thìa canh|thìa cà phê|thìa súp|tcf|mc|tbsp|tsp)?/i);

    if (m2) {
      const name = m2[1].trim();
      const qtyStr = m2[2].trim();
      const unit = (m2[3] || '').trim();
      const qty = qtyStr.includes('-') ? qtyStr : (parseFloat(qtyStr.replace(',', '.')) || 1);
      ingredients.push({ name, quantity: qty, unit });
    } else if (m1 && m1[1] && m1[3]) {
      const qtyStr = m1[1].trim();
      const unit = (m1[2] || '').trim();
      const name = m1[3].trim().replace(/^:\s*/, '');
      const qty = qtyStr.includes('-') ? qtyStr : (parseFloat(qtyStr.replace(',', '.')) || 1);
      if (name.length > 1) {
        ingredients.push({ name, quantity: qty, unit });
      }
    } else {
      // Just ingredient name without clear quantity
      if (clean.length > 1 && clean.length < 50 && !clean.includes('http') && !clean.toLowerCase().startsWith('lưu ý')) {
        ingredients.push({ name: clean, quantity: 1, unit: '' });
      }
    }
  }

  return ingredients;
}

// Test on notion files
const samples = [
  'Cá hồi sốt chanh dây (1) 2674320ba42b80be983ed3ec5f6ed03b.html',
  'Salad trứng lòng đào 2934320ba42b8008948edc8ac78a2f20.html',
  'Bibimbap - Cơm trộn Hàn Quốc 2674320ba42b80ae9168d40afc9a9198.html'
];

for (const sf of samples) {
  const c = fs.readFileSync(path.join(notionDir, sf), 'utf8');
  console.log(`=== Sample: ${sf} ===`);
  const ings = parseNotionIngredients(c);
  console.log(JSON.stringify(ings, null, 2));
}
