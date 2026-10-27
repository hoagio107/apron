const fs = require('fs');
const path = require('path');
const dir = 'P:/CookbookData/recipes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const embeddedIngsInSteps = [];

for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const ings = data.ingredients || [];
  const steps = data.steps || data.instructions || [];

  // If ingredients are empty or very few, and steps contain text with ingredients pattern:
  // e.g. "- ...: 100g" or "nguyên liệu" or bullet points with grams/ml
  let matched = false;
  for (const s of steps) {
    const text = typeof s === 'string' ? s : (s.instruction || '');
    if (/-\s*[^:\n]+:\s*\d+|(nguyên liệu|thành phần)\s*:|(\d+\s*(g|kg|ml|lít|muỗng|thìa|quả|trái|củ)\b.*){3,}/i.test(text)) {
      matched = true;
      embeddedIngsInSteps.push({
        file: f,
        title: data.title,
        ingsCount: ings.length,
        stepsCount: steps.length,
        snippet: text.slice(0, 200)
      });
      break;
    }
  }
}

console.log(`Recipes with embedded ingredients in steps: ${embeddedIngsInSteps.length}`);
console.log(JSON.stringify(embeddedIngsInSteps.slice(0, 15), null, 2));
