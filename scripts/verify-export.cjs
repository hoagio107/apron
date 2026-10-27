const fs = require('fs');
const path = require('path');

const EXPORT_PATH = 'C:/Users/Admin/Downloads/cookbook_recipes_filtered_non_duplicates.json';
const IMPORT_108_PATH = 'C:/Users/Admin/Downloads/cookbook_recipes_import.json';

const exportData = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8'));
const import108Data = JSON.parse(fs.readFileSync(IMPORT_108_PATH, 'utf8'));

console.log('=== VALIDATION OF EXPORTED JSON ===');
console.log('Top level keys:', Object.keys(exportData));
console.log('Version:', exportData.version);
console.log('Exported at:', exportData.exported_at);
console.log('Units count:', exportData.units.length);
console.log('Catalog count:', exportData.catalog.length);
console.log('Recipes count:', exportData.recipes.length);

function strip(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '');
}

// 1. Cross-check for ANY duplicate with 108 recipes
const existing108Set = new Set(import108Data.recipes.map(r => strip(r.title)));
let overlapCount = 0;
exportData.recipes.forEach(r => {
  const norm = strip(r.title);
  if (existing108Set.has(norm)) {
    console.error(`ERROR: Overlap found: "${r.title}"`);
    overlapCount++;
  }
});

if (overlapCount === 0) {
  console.log('SUCCESS: Exactly ZERO overlap with the 108 existing recipes!');
} else {
  console.error(`FAILURE: Found ${overlapCount} overlapping recipes!`);
}

// 2. Validate recipe structure
let missingTitle = 0;
let missingId = 0;
let missingCategory = 0;
let emptySteps = 0;
let emptyIngredients = 0;

exportData.recipes.forEach(r => {
  if (!r.title) missingTitle++;
  if (!r.id) missingId++;
  if (!r.category) missingCategory++;
  if (!r.steps || r.steps.length === 0) emptySteps++;
  if (!r.ingredients || r.ingredients.length === 0) emptyIngredients++;
});

console.log('\nRecipe structure checks:');
console.log('- Missing title:', missingTitle);
console.log('- Missing id:', missingId);
console.log('- Missing category:', missingCategory);
console.log('- Empty steps:', emptySteps);
console.log('- Empty ingredients:', emptyIngredients);

// 3. Print 3 random samples
console.log('\n--- SAMPLE RECIPE 1 ---');
console.log(JSON.stringify(exportData.recipes[0], null, 2));

console.log('\n--- SAMPLE RECIPE 2 (with steps & ingredients) ---');
const sample2 = exportData.recipes.find(r => r.ingredients.length > 3 && r.steps.length > 2);
console.log(JSON.stringify(sample2, null, 2));

console.log('\n--- SAMPLE RECIPE 3 (baby food or snack) ---');
const sample3 = exportData.recipes.find(r => r.tags.some(t => t.includes('7M') || t.includes('12M')));
console.log(JSON.stringify(sample3, null, 2));
