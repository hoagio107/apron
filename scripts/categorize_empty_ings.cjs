const fs = require('fs');
const report = JSON.parse(fs.readFileSync('c:/apron/scripts/diagnosis_report.json', 'utf8'));

const emptyIngsList = report.only_ingredients_empty;
console.log(`Analyzing ${emptyIngsList.length} recipes with empty ingredients...`);

let hasStepTextLongerThan100 = 0;
let hasStepTextUnder100 = 0;
let stepEqualsTitle = 0;
let hasDescription = 0;
let hasNotes = 0;

const categorized = {
  stepHasIngredientsAndInstructions: [], // e.g. Bánh dừa nướng
  stepIsJustTitleOrUrl: [], // e.g. Bánh đúc thịt heo -> Step: "Bánh đúc thịt heo"
  stepHasNormalInstructions: [], // instructions exist but no ingredients list
  other: []
};

for (const item of emptyIngsList) {
  const data = JSON.parse(fs.readFileSync('P:/CookbookData/recipes/' + item.file, 'utf8'));
  const title = (data.title || data.name || '').trim();
  const steps = data.steps || data.instructions || [];
  const fullStepText = steps.map(s => typeof s === 'string' ? s : (s.instruction || '')).join('\n');

  if (data.description && data.description.trim()) hasDescription++;
  if (data.notes && data.notes.trim()) hasNotes++;

  if (steps.length === 1) {
    const single = (typeof steps[0] === 'string' ? steps[0] : (steps[0].instruction || '')).trim();
    if (single.toLowerCase() === title.toLowerCase() || /^https?:\/\//i.test(single) || single.length === 0) {
      stepEqualsTitle++;
      categorized.stepIsJustTitleOrUrl.push({ file: item.file, title, step: single });
      continue;
    }
  }

  // Check if step text contains ingredients indicators (e.g. "- ", "g ", "ml ", "nguyên liệu")
  if (/-\s*[^:\n]+:\s*\d+|nguyên liệu|\d+\s*(g|kg|ml|lít|muỗng|thìa)\b/i.test(fullStepText)) {
    categorized.stepHasIngredientsAndInstructions.push({ file: item.file, title, stepsCount: steps.length, length: fullStepText.length, sample: fullStepText.slice(0, 150) });
  } else {
    categorized.stepHasNormalInstructions.push({ file: item.file, title, stepsCount: steps.length, length: fullStepText.length, sample: fullStepText.slice(0, 150) });
  }
}

console.log('=== PHÂN LOẠI 160 CÔNG THỨC THIẾU NGUYÊN LIỆU ===');
console.log(`1. Bước làm chỉ là tiêu đề hoặc URL: ${categorized.stepIsJustTitleOrUrl.length}`);
console.log(`2. Bước làm thực chất chứa cả NGUYÊN LIỆU lẫn HƯỚNG DẪN: ${categorized.stepHasIngredientsAndInstructions.length}`);
console.log(`3. Có hướng dẫn nấu nhưng thiếu danh sách nguyên liệu: ${categorized.stepHasNormalInstructions.length}`);

console.log('\n--- VÍ DỤ NHÓM 2 (Chứa cả nguyên liệu trong bước làm) ---');
console.log(JSON.stringify(categorized.stepHasIngredientsAndInstructions.slice(0, 8), null, 2));

console.log('\n--- VÍ DỤ NHÓM 3 (Có hướng dẫn nhưng thiếu nguyên liệu) ---');
console.log(JSON.stringify(categorized.stepHasNormalInstructions.slice(0, 8), null, 2));
