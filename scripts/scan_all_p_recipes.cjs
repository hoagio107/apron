const fs = require('fs');
const path = require('path');

const RECIPES_DIR = 'P:\\CookbookData\\recipes';

function scanAllRecipes() {
  const files = fs.readdirSync(RECIPES_DIR).filter(f => f.endsWith('.json'));
  console.log(`Analyzing ${files.length} recipes in ${RECIPES_DIR}...\n`);

  let emptyIngredientsCount = 0;
  let emptyStepsCount = 0;
  let suspiciousIngredients = []; // ingredients with long text or step keywords
  let suspiciousSteps = []; // steps with ingredient quantities or short items
  let missingMetadataCount = 0;
  let weirdTags = [];
  let formatTypes = {
    standardApron: 0, // id, title, slug, ingredients [{name, quantity/amount, unit}], steps [{instruction}]
    legacyOrNotion: 0,
    other: 0
  };

  const issues = [];

  for (const file of files) {
    const fullPath = path.join(RECIPES_DIR, file);
    try {
      const raw = fs.readFileSync(fullPath, 'utf8');
      const data = JSON.parse(raw);

      const title = data.title || data.name || file;
      const ingredients = data.ingredients || [];
      const steps = data.steps || data.instructions || [];
      const tags = data.tags || [];

      let fileIssues = [];

      // Check empty
      if (!ingredients || ingredients.length === 0) {
        emptyIngredientsCount++;
        fileIssues.push('EMPTY_INGREDIENTS');
      }

      if (!steps || steps.length === 0) {
        emptyStepsCount++;
        fileIssues.push('EMPTY_STEPS');
      }

      // Check suspicious ingredients (looks like steps)
      const ingWithLongText = ingredients.filter(ing => {
        const text = typeof ing === 'string' ? ing : (ing.name || '');
        return text.length > 80 || /bước|hướng dẫn|thực hiện|sau đó|đun sôi|phi thơm|cho vào nồi|bật bếp/i.test(text);
      });
      if (ingWithLongText.length > 0) {
        suspiciousIngredients.push({ file, title, count: ingWithLongText.length, sample: ingWithLongText[0] });
        fileIssues.push('INGREDIENT_LOOKS_LIKE_STEP');
      }

      // Check suspicious steps (looks like ingredients)
      const stepsWithIngFormat = steps.filter(step => {
        const text = typeof step === 'string' ? step : (step.instruction || step.step || step.content || '');
        const clean = text.replace(/<[^>]*>/g, '').trim();
        // Short text with unit or quantity: e.g. "500g thịt ba chỉ", "2 quả trứng"
        return clean.length < 35 && /^\d+[\s\w\.\,\/]*(g|kg|ml|l|thìa|muỗng|gam|củ|trái|quả|nhánh|tép|bát|chén)\b/i.test(clean);
      });
      if (stepsWithIngFormat.length > 0 && stepsWithIngFormat.length >= steps.length * 0.5) {
        suspiciousSteps.push({ file, title, count: stepsWithIngFormat.length, sample: stepsWithIngFormat[0] });
        fileIssues.push('STEPS_LOOK_LIKE_INGREDIENTS');
      }

      // Check metadata
      const hasPrep = data.prep_time !== undefined && data.prep_time !== null;
      const hasCook = data.cook_time !== undefined && data.cook_time !== null;
      const hasDifficulty = Boolean(data.difficulty);
      const hasServings = data.servings !== undefined && data.servings !== null;

      if (!hasDifficulty || !hasServings) {
        missingMetadataCount++;
      }

      // Check tags
      if (tags.some(t => /^[0-9]+$/.test(t) || t.includes('/') || t.includes('ing-') || t.includes('cook-'))) {
        weirdTags.push({ file, title, tags });
      }

      if (fileIssues.length > 0) {
        issues.push({ file, title, fileIssues, dataSnippet: {
          ingredientsCount: ingredients.length,
          stepsCount: steps.length,
          hasTags: tags.length,
          difficulty: data.difficulty,
          prep: data.prep_time,
          cook: data.cook_time
        }});
      }
    } catch (e) {
      console.error(`Error parsing ${file}:`, e.message);
    }
  }

  console.log('=== TỔNG KẾT PHÂN TÍCH ===');
  console.log(`Số công thức thiếu nguyên liệu: ${emptyIngredientsCount}`);
  console.log(`Số công thức thiếu bước làm: ${emptyStepsCount}`);
  console.log(`Số công thức nguyên liệu có vẻ chứa BƯỚC LÀM: ${suspiciousIngredients.length}`);
  console.log(`Số công thức bước làm có vẻ chứa NGUYÊN LIỆU: ${suspiciousSteps.length}`);
  console.log(`Số công thức thiếu metadata (difficulty/servings): ${missingMetadataCount}`);
  console.log(`Số công thức có tags lạ (số, ing-, slash): ${weirdTags.length}`);
  console.log(`Tổng số công thức có vấn đề: ${issues.length}\n`);

  if (suspiciousIngredients.length > 0) {
    console.log('--- VÍ DỤ NGUYÊN LIỆU GIỐNG BƯỚC LÀM (Top 5) ---');
    console.log(JSON.stringify(suspiciousIngredients.slice(0, 5), null, 2));
  }

  if (suspiciousSteps.length > 0) {
    console.log('--- VÍ DỤ BƯỚC LÀM GIỐNG NGUYÊN LIỆU (Top 5) ---');
    console.log(JSON.stringify(suspiciousSteps.slice(0, 5), null, 2));
  }

  if (weirdTags.length > 0) {
    console.log('--- VÍ DỤ TAGS LẠ (Top 5) ---');
    console.log(JSON.stringify(weirdTags.slice(0, 5), null, 2));
  }
}

scanAllRecipes();
