const fs = require('fs');
const path = require('path');

const NOTION_DIR = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const IMPORT_JSON_PATH = 'C:/Users/Admin/Downloads/cookbook_recipes_import.json';

// 1. Load 108 existing recipes
const importData = JSON.parse(fs.readFileSync(IMPORT_JSON_PATH, 'utf8'));
const existingRecipes = importData.recipes || [];
console.log(`Loaded ${existingRecipes.length} existing recipes from import JSON.`);

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

const existingNormalizedMap = new Map();
existingRecipes.forEach(r => {
  existingNormalizedMap.set(normalizeText(r.title), r);
  if (r.slug) existingNormalizedMap.set(normalizeText(r.slug), r);
});

// Also create keywords for fuzzy matching
const existingTitleList = existingRecipes.map(r => ({
  title: r.title,
  norm: normalizeText(r.title)
}));

// 2. Discover all recipe HTML files
const allFiles = fs.readdirSync(NOTION_DIR);
const htmlFiles = allFiles.filter(f => f.endsWith('.html'));

console.log(`Found ${htmlFiles.length} total HTML files in Notion export.`);

// Classify HTML files
const recipeCandidates = [];
const nonRecipeFiles = [];

htmlFiles.forEach(f => {
  const filePath = path.join(NOTION_DIR, f);
  const content = fs.readFileSync(filePath, 'utf8');

  // Title
  const titleM = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';

  // Exclude image dumps, lessons, tips, basic knowledge
  if (!title || /^\d+(_\d+)*(_n)?$/.test(title) || /^Page \d+$/i.test(title)) {
    nonRecipeFiles.push({ file: f, title, reason: 'Image gallery / number ID' });
    return;
  }
  if (/^Bài \d+:/i.test(title)) {
    nonRecipeFiles.push({ file: f, title, reason: 'Course lesson' });
    return;
  }
  if (/^Mẹo /i.test(title) || /^Chiên đậu hũ không vỡ/i.test(title) || /^Bí quyết /i.test(title)) {
    nonRecipeFiles.push({ file: f, title, reason: 'Kitchen tip' });
    return;
  }
  if (/Eat Clean là gì|Nguyên tắc quan trọng để giảm cân|Chỉ số BMI|Tính BMR/i.test(title)) {
    nonRecipeFiles.push({ file: f, title, reason: 'Basic knowledge article' });
    return;
  }

  // Check if it has recipe properties or content
  const hasProperties = /<table class="properties">/i.test(content);
  const hasIngredients = /nguyên liệu|thành phần/i.test(content);
  const hasSteps = /cách làm|thực hiện|hướng dẫn|chế biến|bước 1|sơ chế/i.test(content);
  const hasImage = /<figure[^>]+data-notion-image/i.test(content);

  recipeCandidates.push({
    file: f,
    title,
    content,
    hasProperties,
    hasIngredients,
    hasSteps,
    hasImage
  });
});

console.log(`Filtered out ${nonRecipeFiles.length} non-recipe HTML files.`);
console.log(`Found ${recipeCandidates.length} candidate recipe HTML files.`);

// 3. Deduplicate candidates amongst themselves (since some recipes exist in multiple Notion views)
const uniqueCandidates = new Map();

recipeCandidates.forEach(rc => {
  // Clean title (remove trailing ' (1)', etc.)
  const cleanTitle = rc.title.replace(/\s*\(\d+\)$/, '').trim();
  const norm = normalizeText(cleanTitle);

  if (!uniqueCandidates.has(norm)) {
    uniqueCandidates.set(norm, { ...rc, cleanTitle });
  } else {
    // If existing has less content or lacks ingredients, take the better one
    const existing = uniqueCandidates.get(norm);
    if ((!existing.hasIngredients && rc.hasIngredients) || rc.content.length > existing.content.length) {
      uniqueCandidates.set(norm, { ...rc, cleanTitle });
    }
  }
});

console.log(`After deduplicating within Notion export: ${uniqueCandidates.size} unique candidate recipes.`);

// 4. Match against the 108 existing recipes
const matchedDuplicates = [];
const nonDuplicates = [];

uniqueCandidates.forEach((candidate, norm) => {
  // Check exact match
  if (existingNormalizedMap.has(norm)) {
    matchedDuplicates.push({
      notionTitle: candidate.title,
      matchedExisting: existingNormalizedMap.get(norm).title,
      file: candidate.file,
      type: 'Exact match'
    });
    return;
  }

  // Check fuzzy / word containment (e.g., "Ba chỉ kìa nước dừa" vs "BA CHỈ KHÌA NƯỚC DỪA")
  let fuzzyMatch = null;
  for (const ex of existingTitleList) {
    // Spelling variations: khia vs kia
    const normK = norm.replace(/kh/g, 'k');
    const exK = ex.norm.replace(/kh/g, 'k');
    if (normK === exK) {
      fuzzyMatch = { existing: ex.title, type: 'Spelling variation (k/kh)' };
      break;
    }
    // High similarity
    if (norm.length > 8 && ex.norm.length > 8) {
      if (norm === ex.norm + '1' || ex.norm === norm + '1') {
        fuzzyMatch = { existing: ex.title, type: 'Suffix number' };
        break;
      }
    }
  }

  if (fuzzyMatch) {
    matchedDuplicates.push({
      notionTitle: candidate.title,
      matchedExisting: fuzzyMatch.existing,
      file: candidate.file,
      type: fuzzyMatch.type
    });
  } else {
    nonDuplicates.push(candidate);
  }
});

console.log(`\n========================================`);
console.log(`DUPLICATES WITH 108 RECIPES: ${matchedDuplicates.length}`);
matchedDuplicates.forEach((d, i) => {
  console.log(`  ${i + 1}. [${d.type}] Notion: "${d.notionTitle}" <===> Existing: "${d.matchedExisting}"`);
});

console.log(`\n========================================`);
console.log(`NON-DUPLICATE RECIPES TO IMPORT: ${nonDuplicates.length}`);
console.log(`First 30 non-duplicates:`);
nonDuplicates.slice(0, 30).forEach((nd, i) => {
  console.log(`  ${i + 1}. "${nd.cleanTitle}" (File: ${nd.file})`);
});
