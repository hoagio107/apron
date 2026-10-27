const fs = require('fs');
const path = require('path');

const RECIPES_DIR = 'P:\\CookbookData\\recipes';

function run() {
  const files = fs.readdirSync(RECIPES_DIR).filter(f => f.endsWith('.json'));
  console.log(`Total JSON files: ${files.length}`);

  // Sample files
  const sampleNames = [
    'recipe-ba-chi-kia-nuoc-dua-2eb460f3.json',
    'recipe-banh-canh-bi-do-a94176d7.json',
    '1b47aa80-a221-4805-ba41-af0e86e4e8a3.json',
    files[10],
    files[20],
    files[50]
  ].filter(Boolean);

  for (const name of sampleNames) {
    const fullPath = path.join(RECIPES_DIR, name);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const data = JSON.parse(content);
      console.log('====================================');
      console.log(`FILE: ${name} (size: ${content.length} chars)`);
      console.log('KEYS:', Object.keys(data));
      console.log('TITLE:', data.title || data.name);
      console.log('METADATA:', {
        difficulty: data.difficulty,
        prep_time: data.prep_time,
        cook_time: data.cook_time,
        servings: data.servings,
        tags: data.tags,
        category: data.category,
        categories: data.categories
      });
      console.log('INGREDIENTS sample (first 3):', JSON.stringify((data.ingredients || []).slice(0, 3), null, 2));
      console.log('STEPS/INSTRUCTIONS sample (first 3):', JSON.stringify((data.steps || data.instructions || []).slice(0, 3), null, 2));
      if (data.description) {
        console.log('DESCRIPTION (preview 150 chars):', data.description.slice(0, 150));
      }
      if (data.notes) {
        console.log('NOTES (preview 150 chars):', JSON.stringify(data.notes).slice(0, 150));
      }
    } catch (e) {
      console.error(`Error reading ${name}:`, e.message);
    }
  }
}

run();
