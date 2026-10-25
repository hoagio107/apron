const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const crypto = require('crypto');

const SOURCE_DIR = 'C:\\Users\\Admin\\Downloads\\CookBook-Recipes-YAML-20261025T1938485310700';
const OUTPUT_JSON_FILE = 'C:\\Users\\Admin\\Downloads\\cookbook_recipes_import.json';
const OUTPUT_DIR = 'C:\\Users\\Admin\\Downloads\\CookBook-Recipes-JSON';

// Unicode fraction mapping
const UNICODE_FRACTIONS = {
  '½': 0.5,
  '⅓': 0.33,
  '⅔': 0.67,
  '¼': 0.25,
  '¾': 0.75,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875
};

const COMMON_UNITS = [
  'muỗng cà phê', 'muỗng canh', 'muỗng cf',
  'thìa cà phê', 'thìa canh', 'thìa cf', 'thìa súp',
  'kg', 'gram', 'gr', 'g',
  'lít', 'lit', 'ml', 'l',
  'quả', 'trái', 'củ', 'cái', 'bó', 'nhánh', 'tép', 'lát', 'miếng', 'khoanh',
  'lon', 'gói', 'hộp', 'chén', 'bát', 'ly',
  'cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'clove', 'cloves', 'slice', 'slices', 'pinch',
  'chút', 'xíu xiu', 'xíu', 'ít'
];

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function parseMinutes(val) {
  if (!val) return 0;
  if (typeof val === 'number') return Math.round(val);
  const str = String(val).trim();
  const isoMatch = str.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (isoMatch) {
    const hours = parseInt(isoMatch[1] || '0', 10);
    const mins = parseInt(isoMatch[2] || '0', 10);
    return hours * 60 + mins;
  }
  const numMatch = str.match(/\d+/);
  return numMatch ? parseInt(numMatch[0], 10) : 0;
}

function parseServings(val) {
  if (!val) return 2;
  if (typeof val === 'number') return val;
  const numMatch = String(val).match(/\d+/);
  return numMatch ? parseInt(numMatch[0], 10) : 2;
}

function parseCalories(val) {
  if (!val) return 0;
  if (typeof val === 'number') return Math.round(val);
  const numMatch = String(val).match(/(\d+)\s*(?:cal|calories|kcal)?/i);
  return numMatch ? parseInt(numMatch[1], 10) : 0;
}

function parseIngredientLine(raw, currentGroup) {
  let line = (raw || '').trim();
  if (!line) return null;

  // Replace unicode fractions with numbers
  for (const [frac, val] of Object.entries(UNICODE_FRACTIONS)) {
    // If line has "1 ½" or "½"
    const mixedRegex = new RegExp(`(\\d+)\\s*${frac}`, 'g');
    line = line.replace(mixedRegex, (_, intPart) => `${parseFloat(intPart) + val}`);
    line = line.replace(new RegExp(frac, 'g'), `${val}`);
  }

  // Fraction like 1/2 or 3/4
  const fracRegex = /^(\d+)\/(\d+)\s*(.*)$/;
  const mixedFracRegex = /^(\d+)\s+(\d+)\/(\d+)\s*(.*)$/;
  const numRegex = /^(\d+(?:[.,]\d+)?)\s*(.*)$/;

  let quantity = 1;
  let remaining = line;

  const mixedFracMatch = line.match(mixedFracRegex);
  if (mixedFracMatch) {
    const whole = parseFloat(mixedFracMatch[1]);
    const num = parseFloat(mixedFracMatch[2]);
    const den = parseFloat(mixedFracMatch[3]);
    if (den !== 0) {
      quantity = Math.round((whole + num / den) * 100) / 100;
      remaining = mixedFracMatch[4].trim();
    }
  } else {
    const fracMatch = line.match(fracRegex);
    if (fracMatch) {
      const num = parseFloat(fracMatch[1]);
      const den = parseFloat(fracMatch[2]);
      if (den !== 0) {
        quantity = Math.round((num / den) * 100) / 100;
        remaining = fracMatch[3].trim();
      }
    } else {
      const numMatch = line.match(numRegex);
      if (numMatch) {
        quantity = parseFloat(numMatch[1].replace(',', '.'));
        remaining = numMatch[2].trim();
      }
    }
  }

  let unit = '';
  let name = remaining;

  for (const u of COMMON_UNITS) {
    const lowerRemaining = remaining.toLowerCase();
    if (lowerRemaining.startsWith(u + ' ') || lowerRemaining === u) {
      unit = u;
      name = remaining.slice(u.length).trim();
      break;
    }
  }

  // If name is empty, fallback
  if (!name && unit) {
    name = unit;
    unit = '';
  }

  return {
    name: name || remaining || line,
    quantity: quantity,
    unit: unit,
    group: currentGroup || undefined
  };
}

function convertYamlRecipe(doc, filename) {
  const title = (doc.name || path.basename(filename, path.extname(filename))).trim();
  const slug = slugify(title);
  const id = `recipe-${slug}-${crypto.randomBytes(4).toString('hex')}`;

  const prep_time = parseMinutes(doc.prep_time);
  const cook_time = parseMinutes(doc.cook_time);
  const servings = parseServings(doc.servings);
  const calories = parseCalories(doc.nutrition);

  // Favorite flag
  const is_favorite = (
    String(doc.favorite).toLowerCase() === 'yes' ||
    String(doc.favorite).toLowerCase() === 'true' ||
    String(doc.on_favorites).toLowerCase() === 'yes' ||
    String(doc.on_favorites).toLowerCase() === 'true'
  );

  // Images
  const image_url = doc.image || (Array.isArray(doc.images) && doc.images.length > 0 ? doc.images[0] : '');
  const images = Array.isArray(doc.images) && doc.images.length > 0 ? doc.images : (image_url ? [image_url] : []);

  // Tags & Keywords
  const tagSet = new Set();
  if (Array.isArray(doc.tags)) {
    doc.tags.forEach(t => {
      if (typeof t === 'string' && t.trim()) tagSet.add(t.trim());
    });
  } else if (typeof doc.tags === 'string' && doc.tags.trim()) {
    doc.tags.split(/[,;/]/).forEach(t => {
      if (t.trim()) tagSet.add(t.trim());
    });
  }
  if (typeof doc.keywords === 'string' && doc.keywords.trim()) {
    doc.keywords.split(/[,;/]/).forEach(t => {
      if (t.trim()) tagSet.add(t.trim());
    });
  }
  const tags = Array.from(tagSet);

  // Parse Ingredients with section header detection
  const ingredients = [];
  let currentIngredientGroup = undefined;

  if (Array.isArray(doc.ingredients)) {
    for (const rawIng of doc.ingredients) {
      if (typeof rawIng !== 'string') continue;
      const trimmed = rawIng.trim();
      if (!trimmed) continue;

      // Section header detection (e.g. "Phần Caramel:", "A) Phần Bánh:")
      if (trimmed.endsWith(':') && trimmed.length < 50) {
        currentIngredientGroup = trimmed.replace(/:$/, '').trim();
        continue;
      }

      const parsedIng = parseIngredientLine(trimmed, currentIngredientGroup);
      if (parsedIng) {
        ingredients.push(parsedIng);
      }
    }
  }

  // Parse Steps / Directions with section header detection
  const steps = [];
  let currentStepGroup = undefined;

  if (Array.isArray(doc.directions)) {
    for (const rawStep of doc.directions) {
      if (typeof rawStep !== 'string') continue;
      const trimmed = rawStep.trim();
      if (!trimmed) continue;

      // Section header detection for steps
      if (trimmed.endsWith(':') && trimmed.length < 50 && !trimmed.includes('\n')) {
        currentStepGroup = trimmed.replace(/:$/, '').trim();
        continue;
      }

      steps.push({
        instruction: trimmed,
        group: currentStepGroup || undefined
      });
    }
  }

  // Notes and description
  let notes = typeof doc.notes === 'string' ? doc.notes.trim() : '';
  let description = typeof doc.description === 'string' ? doc.description.trim() : '';
  const video_url = typeof doc.video === 'string' ? doc.video.trim() : '';
  const source = typeof doc.source === 'string' ? doc.source.trim() : '';

  const recipe = {
    id,
    title,
    slug,
    image_url,
    images,
    parent_id: null,
    prep_time,
    cook_time,
    total_time_minutes: prep_time + cook_time,
    difficulty: 'Vừa',
    calories,
    // USER REQUIREMENT: Xoá toàn bộ "đánh giá" tôi sẽ nhập tay sau
    taste_score: 0,
    cooking_history: [],
    servings,
    tags,
    category: tags[0] || 'Món chính',
    description: description || undefined,
    notes: notes || undefined,
    video_url: video_url || undefined,
    source: source || undefined,
    is_favorite,
    ingredients,
    steps,
    author_id: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    nutrition: calories > 0 ? { calories } : undefined
  };

  return recipe;
}

function run() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error('Source directory does not exist:', SOURCE_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
  console.log(`Found ${files.length} YAML recipe files in ${SOURCE_DIR}`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const convertedRecipes = [];
  let errorCount = 0;

  for (const file of files) {
    try {
      const filePath = path.join(SOURCE_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const doc = yaml.load(content);
      if (!doc || typeof doc !== 'object') {
        console.warn(`Skipping invalid YAML: ${file}`);
        continue;
      }

      const recipe = convertYamlRecipe(doc, file);
      convertedRecipes.push(recipe);

      // Also write individual JSON file
      const singleJsonPath = path.join(OUTPUT_DIR, `${recipe.id}.json`);
      fs.writeFileSync(singleJsonPath, JSON.stringify(recipe, null, 2), 'utf8');
    } catch (err) {
      console.error(`Error converting ${file}:`, err.message);
      errorCount++;
    }
  }

  // Backup format for Apron
  const backupData = {
    exported_at: new Date().toISOString(),
    version: '1.0.0',
    recipes: convertedRecipes
  };

  fs.writeFileSync(OUTPUT_JSON_FILE, JSON.stringify(backupData, null, 2), 'utf8');

  console.log('--- CONVERSION SUMMARY ---');
  console.log(`Total YAML processed: ${files.length}`);
  console.log(`Successfully converted: ${convertedRecipes.length}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Backup JSON file written to: ${OUTPUT_JSON_FILE}`);
  console.log(`Individual JSON files written to: ${OUTPUT_DIR}`);
  console.log('Sample converted recipe:', JSON.stringify(convertedRecipes[0], null, 2).slice(0, 800));
}

run();
