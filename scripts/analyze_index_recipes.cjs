const fs = require('fs');
const path = require('path');
const pRecipesDir = 'P:/CookbookData/recipes';
const index = JSON.parse(fs.readFileSync('P:/CookbookData/recipes_index.json', 'utf8'));

console.log(`Analyzing ${index.length} recipes in recipes_index.json...\n`);

const stats = {
  total: index.length,
  emptyIngredients: 0,
  emptySteps: 0,
  stepIsJustTitle: 0,
  stepContainsIngredients: 0,
  hasWeirdTags: 0,
  tagProblems: {
    numberTags: 0,
    prefixCodeTags: 0,
    slashTags: 0,
    duplicatedParts: 0,
    corruptedConcat: 0
  },
  metadataIssues: {
    noDifficulty: 0,
    invalidDifficulty: 0,
    noServings: 0,
    zeroServings: 0,
    noPrepTime: 0,
    noCookTime: 0
  },
  bogusRecipes: [] // like "C", "LIST MÓN"
};

const validDifficulties = new Set(['Dễ', 'Vừa', 'Khó']);

for (const r of index) {
  const title = (r.title || '').trim();
  const ings = r.ingredients || [];
  const steps = r.steps || [];
  const tags = r.tags || [];

  // Check bogus
  if (title.length <= 2 || title.toUpperCase() === 'LIST MÓN') {
    stats.bogusRecipes.push({ id: r.id, title });
  }

  // Check ings & steps
  if (!ings.length) stats.emptyIngredients++;
  if (!steps.length) stats.emptySteps++;

  if (steps.length === 1) {
    const s = typeof steps[0] === 'string' ? steps[0] : (steps[0].instruction || '');
    const cleanS = s.replace(/<[^>]+>/g, '').trim().toLowerCase();
    if (cleanS === title.toLowerCase() || /^https?:\/\//i.test(cleanS)) {
      stats.stepIsJustTitle++;
    }
  }

  // Check if steps contain ingredient list
  for (const s of steps) {
    const txt = typeof s === 'string' ? s : (s.instruction || '');
    if (/-\s*[^:\n]+:\s*\d+|nguyên liệu\s*:|(\d+\s*(g|kg|ml|lít|muỗng|thìa)\b.*){3,}/i.test(txt)) {
      stats.stepContainsIngredients++;
      break;
    }
  }

  // Check tags
  let hasTagProb = false;
  for (const t of tags) {
    if (/^\d+$/.test(t)) {
      stats.tagProblems.numberTags++;
      hasTagProb = true;
    }
    if (/^(ing-|cook-|dish-|diet-|cuisine-)/.test(t)) {
      stats.tagProblems.prefixCodeTags++;
      hasTagProb = true;
    }
    if (t.includes('/')) {
      stats.tagProblems.slashTags++;
      hasTagProb = true;
    }
    if (/[a-zà-ỹ][A-ZÀ-Ỹ]/.test(t) || t.includes('...')) {
      stats.tagProblems.corruptedConcat++;
      hasTagProb = true;
    }
  }
  if (hasTagProb) stats.hasWeirdTags++;

  // Check metadata
  if (!r.difficulty) stats.metadataIssues.noDifficulty++;
  else if (!validDifficulties.has(r.difficulty)) stats.metadataIssues.invalidDifficulty++;

  if (r.servings === undefined || r.servings === null) stats.metadataIssues.noServings++;
  else if (r.servings === 0) stats.metadataIssues.zeroServings++;

  if (r.prep_time === undefined || r.prep_time === null) stats.metadataIssues.noPrepTime++;
  if (r.cook_time === undefined || r.cook_time === null) stats.metadataIssues.noCookTime++;
}

console.log('=== THỐNG KÊ CHI TIẾT 555 CÔNG THỨC TRONG INDEX ===');
console.log(JSON.stringify(stats, null, 2));
