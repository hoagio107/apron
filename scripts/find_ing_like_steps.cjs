const fs = require('fs');
const index = JSON.parse(fs.readFileSync('P:/CookbookData/recipes_index.json', 'utf8'));

const recipesWithIngredientSteps = [];

for (const r of index) {
  if (r.ingredients && r.ingredients.length > 0) continue; // already has ingredients
  const steps = r.steps || [];
  if (steps.length <= 1) continue;

  // Check if steps contain items like "Sốt: ...", "... & ...", "... luộc", "... bào", "... xé sợi"
  let ingLikeSteps = 0;
  for (const s of steps) {
    const txt = typeof s === 'string' ? s : (s.instruction || '');
    if (/sốt\s*:|nước sốt\s*:|(&|\+)\s*|rau củ|ướp|thái lát|xé sợi|bào sợi|rửa sạch|luộc chín/i.test(txt) && txt.length < 100) {
      ingLikeSteps++;
    }
  }

  if (ingLikeSteps >= Math.ceil(steps.length / 2)) {
    recipesWithIngredientSteps.push({
      id: r.id,
      title: r.title,
      stepsCount: steps.length,
      steps: steps.map(s => typeof s === 'string' ? s : s.instruction)
    });
  }
}

console.log(`Recipes with ingredient-like steps: ${recipesWithIngredientSteps.length}`);
console.log(JSON.stringify(recipesWithIngredientSteps.slice(0, 10), null, 2));
