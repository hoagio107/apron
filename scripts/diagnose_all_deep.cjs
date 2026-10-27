const fs = require('fs');
const path = require('path');
const dir = 'P:/CookbookData/recipes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

console.log(`Checking ${files.length} recipe files...\n`);

const issues = {
  swapped_ingredients_and_steps: [],
  ingredients_contain_instructions: [],
  steps_contain_ingredients_only: [],
  step_is_just_title: [],
  both_empty: [],
  only_ingredients_empty: [],
  only_steps_empty: [],
  weird_tags: [],
  tags_are_numbers: [],
  tags_have_category_code: [],
  tags_have_slashes: [],
  missing_metadata: [],
  duplicate_slug_files: []
};

for (const file of files) {
  const full = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(full, 'utf8'));
  const title = (data.title || data.name || '').trim();
  const ings = data.ingredients || [];
  const steps = data.steps || data.instructions || [];
  const tags = data.tags || [];

  // Check duplicate slug files (e.g. 'ba-chi-kia-nuoc-dua.json' vs 'recipe-ba-chi-kia-nuoc-dua-2eb460f3.json')
  if (!file.startsWith('recipe-') && !/^[0-9a-f]{8}-/i.test(file)) {
    issues.duplicate_slug_files.push(file);
  }

  // Check emptiness
  if (ings.length === 0 && steps.length === 0) {
    issues.both_empty.push({ file, title });
  } else if (ings.length === 0) {
    issues.only_ingredients_empty.push({ file, title, stepsCount: steps.length });
  } else if (steps.length === 0) {
    issues.only_steps_empty.push({ file, title, ingsCount: ings.length });
  }

  // Check if step is just title
  if (steps.length === 1) {
    const text = typeof steps[0] === 'string' ? steps[0] : (steps[0].instruction || steps[0].content || '');
    const cleanText = text.replace(/<[^>]+>/g, '').trim().toLowerCase();
    if (cleanText === title.toLowerCase() || cleanText === '') {
      issues.step_is_just_title.push({ file, title, step: text });
    }
  }

  // Check if ingredients look like full steps
  let ingsWithSteps = 0;
  for (const ing of ings) {
    const name = typeof ing === 'string' ? ing : (ing.name || '');
    if (name.length > 60 || /bước \d|rửa sạch rồi|đun sôi|phi thơm|bắc chảo|hướng dẫn|thực hiện/i.test(name)) {
      ingsWithSteps++;
    }
  }
  if (ingsWithSteps > 0 && ingsWithSteps >= Math.min(2, ings.length)) {
    issues.ingredients_contain_instructions.push({ file, title, count: ingsWithSteps, total: ings.length, sample: ings[0] });
  }

  // Check if steps look like ingredients
  let stepsWithIngs = 0;
  for (const step of steps) {
    const text = typeof step === 'string' ? step : (step.instruction || step.step || step.content || '');
    const clean = text.replace(/<[^>]+>/g, '').trim();
    // Short line with typical ingredient pattern: e.g., "300g thịt bò", "2 thìa cà phê muối"
    if (clean.length < 40 && /^\d+[\s\w\.\,\/]*(g|kg|ml|l|thìa|muỗng|gam|củ|trái|quả|nhánh|tép|bát|chén|gói|hộp|lon)\b/i.test(clean)) {
      stepsWithIngs++;
    }
  }
  if (steps.length > 0 && stepsWithIngs >= steps.length * 0.6) {
    issues.steps_contain_ingredients_only.push({ file, title, count: stepsWithIngs, total: steps.length, sample: steps[0] });
  }

  // Check metadata
  const missingMeta = [];
  if (!data.difficulty) missingMeta.push('difficulty');
  if (data.servings === undefined || data.servings === null || data.servings === 0) missingMeta.push('servings');
  if (data.prep_time === undefined || data.prep_time === null) missingMeta.push('prep_time');
  if (data.cook_time === undefined || data.cook_time === null) missingMeta.push('cook_time');
  if (missingMeta.length > 0) {
    issues.missing_metadata.push({ file, title, missingMeta });
  }

  // Check tags
  let hasNumTag = false;
  let hasCodeTag = false;
  let hasSlashTag = false;
  for (const t of tags) {
    if (/^\d+$/.test(t)) hasNumTag = true;
    if (/^(ing-|cook-|dish-)/.test(t)) hasCodeTag = true;
    if (t.includes('/')) hasSlashTag = true;
  }
  if (hasNumTag) issues.tags_are_numbers.push({ file, title, tags });
  if (hasCodeTag) issues.tags_have_category_code.push({ file, title, tags });
  if (hasSlashTag) issues.tags_have_slashes.push({ file, title, tags });
}

console.log('=== KẾT QUẢ KIỂM TRA TOÀN DIỆN ===');
console.log(`1. Duplicate slug files (108 legacy duplicate files): ${issues.duplicate_slug_files.length}`);
console.log(`2. Cả nguyên liệu & bước làm đều rỗng: ${issues.both_empty.length}`);
console.log(`3. Chỉ có bước làm (thiếu nguyên liệu): ${issues.only_ingredients_empty.length}`);
console.log(`4. Chỉ có nguyên liệu (thiếu bước làm): ${issues.only_steps_empty.length}`);
console.log(`5. Bước làm duy nhất chỉ là tiêu đề công thức: ${issues.step_is_just_title.length}`);
console.log(`6. Nguyên liệu chứa câu hướng dẫn làm: ${issues.ingredients_contain_instructions.length}`);
console.log(`7. Bước làm chỉ chứa định lượng nguyên liệu: ${issues.steps_contain_ingredients_only.length}`);
console.log(`8. Thiếu metadata (difficulty/servings/times): ${issues.missing_metadata.length}`);
console.log(`9. Tags chứa số ('1', '3', '6', '7'...): ${issues.tags_are_numbers.length}`);
console.log(`10. Tags chứa mã code ('ing-*', 'cook-*', 'dish-*'): ${issues.tags_have_category_code.length}`);
console.log(`11. Tags chứa dấu gạch chéo ('/'): ${issues.tags_have_slashes.length}`);

fs.writeFileSync('c:/apron/scripts/diagnosis_report.json', JSON.stringify(issues, null, 2), 'utf8');
console.log('\nDetailed report written to c:/apron/scripts/diagnosis_report.json');
