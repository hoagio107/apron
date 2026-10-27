const fs = require('fs');
const path = require('path');

const RECIPES_DIR = 'P:/CookbookData/recipes';
const NOTION_DIR = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';
const INDEX_PATH = 'P:/CookbookData/recipes_index.json';

const { JUNK_FILES, cleanRecipeTags, cleanIngredient } = require('./standardize_utils.cjs');
const { CUSTOM_RECIPES } = require('./recipe_repair_data.cjs');
const { generateDishDetails } = require('./recipe_catalog_fallbacks.cjs');

function stripAccents(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNotionIngredients(content) {
  let block = '';
  const detailsM = content.match(/<details[\s\S]*?Nguyên liệu[\s\S]*?<\/summary>([\s\S]*?)<\/details>/i);
  if (detailsM) {
    block = detailsM[1];
  } else {
    const secM = content.match(/(?:>|\b)Nguyên liệu[\s\S]*?(?:<h[123]|<details|Cách làm|$)/i);
    if (secM) block = secM[0];
  }
  if (!block) return [];

  const rawLines = block
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const ingredients = [];
  for (const line of rawLines) {
    const clean = line.replace(/^[•\-\*\+–—\s]+/, '').trim();
    if (!clean || clean.toLowerCase() === 'nguyên liệu') continue;

    const m2 = clean.match(/^([^:\d]+):\s*(\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?)\s*(g|gr|kg|ml|lít|lit|l|quả|trái|củ|cái|bó|nhánh|tép|lát|miếng|bát|chén|lon|hộp|gói|muỗng canh|muỗng cà phê|thìa canh|thìa cà phê|thìa súp|tcf|mc|tbsp|tsp)?/i);
    const m1 = clean.match(/^(\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?)\s*(g|gr|kg|ml|lít|lit|l|quả|trái|củ|cái|bó|nhánh|tép|lát|miếng|bát|chén|lon|hộp|gói|muỗng canh|muỗng cà phê|thìa canh|thìa cà phê|thìa súp|tcf|mc|tbsp|tsp)?\s*(.*)$/i);

    if (m2) {
      const name = m2[1].trim();
      const qtyStr = m2[2].trim();
      const unit = (m2[3] || '').trim();
      const qty = qtyStr.includes('-') ? qtyStr : (parseFloat(qtyStr.replace(',', '.')) || 1);
      ingredients.push({ name, quantity: qty, unit });
    } else if (m1 && m1[1] && m1[3]) {
      const qtyStr = m1[1].trim();
      const unit = (m1[2] || '').trim();
      const name = m1[3].trim().replace(/^:\s*/, '');
      const qty = qtyStr.includes('-') ? qtyStr : (parseFloat(qtyStr.replace(',', '.')) || 1);
      if (name.length > 1) {
        ingredients.push({ name, quantity: qty, unit });
      }
    } else if (clean.length > 1 && clean.length < 50 && !clean.includes('http') && !clean.toLowerCase().startsWith('lưu ý')) {
      ingredients.push({ name: clean, quantity: 1, unit: '' });
    }
  }
  return ingredients;
}

function parseNotionSteps(content) {
  let block = '';
  const secM = content.match(/Cách làm[\s\S]*?(?:<article|<\/div><\/div>|$)/i);
  if (secM) block = secM[0];
  if (!block) return [];

  const rawLines = block
    .replace(/<h[123][^>]*>([\s\S]*?)<\/h[123]>/gi, '\n### $1\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const steps = [];
  for (const line of rawLines) {
    const clean = line.replace(/^[•\-\*\+–—\s]+/, '').trim();
    if (!clean || clean.toLowerCase() === 'cách làm' || clean.startsWith('### Cách làm')) continue;
    if (clean.length > 5) {
      steps.push({ instruction: clean });
    }
  }
  return steps;
}

function runStandardization() {
  console.log('=== STARTING RECIPE STANDARDIZATION ===\n');

  // Load Notion files
  console.log('Indexing Notion HTML export files...');
  const notionFiles = fs.readdirSync(NOTION_DIR).filter(f => f.endsWith('.html'));
  const parsedNotion = [];
  for (const f of notionFiles) {
    const content = fs.readFileSync(path.join(NOTION_DIR, f), 'utf8');
    const tm = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
    const rawTitle = tm ? tm[1].replace(/<[^>]+>/g, '').trim() : f;
    parsedNotion.push({
      file: f,
      rawTitle,
      cleanTitle: stripAccents(rawTitle),
      content,
      hasIng: content.includes('Nguyên liệu') && /•|\d+\s*(g|kg|ml|lít|muỗng|thìa|quả|trái|củ|lát|miếng)/i.test(content),
      hasSteps: content.includes('Cách làm') && content.length > 400
    });
  }
  console.log(`Indexed ${parsedNotion.length} Notion export files.\n`);

  // Read all recipe files in P:/CookbookData/recipes
  const allFiles = fs.readdirSync(RECIPES_DIR).filter(f => f.endsWith('.json'));
  console.log(`Found ${allFiles.length} JSON files in ${RECIPES_DIR}.`);

  let duplicateSlugFilesRemoved = 0;
  let junkFilesRemoved = 0;
  let recipesProcessed = 0;

  // STEP 1: Delete duplicate slug files
  for (const f of allFiles) {
    if (!f.startsWith('recipe-') && !/^[0-9a-f]{8}-/i.test(f)) {
      // Slug-only file (e.g. banh-mi-nckd.json)
      const fullPath = path.join(RECIPES_DIR, f);
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const canonicalFile = (data.id || '') + '.json';
      if (fs.existsSync(path.join(RECIPES_DIR, canonicalFile))) {
        fs.unlinkSync(fullPath);
        duplicateSlugFilesRemoved++;
      }
    }
  }
  console.log(`Removed ${duplicateSlugFilesRemoved} redundant slug duplicate files.`);

  // STEP 2: Delete junk and tip files
  for (const f of JUNK_FILES) {
    const p = path.join(RECIPES_DIR, f);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      junkFilesRemoved++;
    }
  }
  console.log(`Removed ${junkFilesRemoved} junk/tip non-recipe files.\n`);

  // STEP 3: Process and standardize all remaining active recipe files
  const activeFiles = fs.readdirSync(RECIPES_DIR).filter(f => f.endsWith('.json'));
  console.log(`Standardizing ${activeFiles.length} active recipe files...`);

  const standardizedIndex = [];

  for (const file of activeFiles) {
    const fullPath = path.join(RECIPES_DIR, file);
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const title = (data.title || data.name || '').trim();
    const recipeId = data.id || file.replace('.json', '');

    // 3.1 Check Custom Repairs first
    if (CUSTOM_RECIPES[recipeId]) {
      const cr = CUSTOM_RECIPES[recipeId];
      if (cr.ingredients) data.ingredients = cr.ingredients;
      if (cr.steps) data.steps = cr.steps;
      if (cr.notes) data.notes = cr.notes;
      if (cr.description) data.description = cr.description;
      if (cr.video_url) data.video_url = cr.video_url;
    }

    // 3.2 If ingredients or steps are missing, look up in Notion
    let ings = data.ingredients || [];
    let steps = data.steps || data.instructions || [];

    if (!ings.length || !steps.length || (steps.length === 1 && (steps[0].instruction || '').trim().toLowerCase() === title.toLowerCase())) {
      const rClean = stripAccents(title);
      const rWords = rClean.split(/\s+/).filter(w => w.length > 1);

      let best = null;
      let bestScore = 0;
      for (const n of parsedNotion) {
        if (n.cleanTitle === rClean) {
          best = n;
          bestScore = 1.0;
          break;
        }
        const nWords = n.cleanTitle.split(/\s+/).filter(w => w.length > 1);
        const common = rWords.filter(w => nWords.includes(w)).length;
        const score = common / Math.max(rWords.length, nWords.length);
        if (score > 0.6 && score > bestScore) {
          bestScore = score;
          best = n;
        }
      }

      if (best) {
        if (!ings.length && best.hasIng) {
          const parsedIngs = parseNotionIngredients(best.content);
          if (parsedIngs.length > 0) ings = parsedIngs;
        }
        if ((!steps.length || (steps.length === 1 && (steps[0].instruction || '').trim().toLowerCase() === title.toLowerCase())) && best.hasSteps) {
          const parsedSteps = parseNotionSteps(best.content);
          if (parsedSteps.length > 0) steps = parsedSteps;
        }
      }
    }

    // 3.3 If still missing ingredients or steps, use intelligent culinary fallbacks
    if (!ings.length || !steps.length || (steps.length === 1 && (steps[0].instruction || '').trim().toLowerCase() === title.toLowerCase())) {
      const fallback = generateDishDetails(title, data.category, data.tags);
      if (!ings.length) ings = fallback.ingredients;
      if (!steps.length || (steps.length === 1 && (steps[0].instruction || '').trim().toLowerCase() === title.toLowerCase())) {
        steps = fallback.steps;
      }
    }

    // 3.4 Clean and normalize all ingredients
    const cleanIngs = ings.map(ing => cleanIngredient(ing));

    // 3.5 Clean and normalize all steps
    const cleanSteps = [];
    for (const s of steps) {
      let txt = typeof s === 'string' ? s : (s.instruction || s.content || s.step || '');
      // Strip html
      txt = txt.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!txt) continue;
      // If step is just title, replace with guidance
      if (txt.toLowerCase() === title.toLowerCase()) {
        txt = `Chuẩn bị và tiến hành chế biến món ${title} theo khẩu vị.`;
      }
      cleanSteps.push({
        instruction: txt,
        ...(s.images && s.images.length > 0 ? { images: s.images } : {}),
        ...(s.group ? { group: s.group } : {})
      });
    }

    // 3.6 Clean and normalize tags
    const cleanTags = cleanRecipeTags(data.tags, title);

    // 3.7 Standardize Metadata
    let difficulty = data.difficulty;
    if (!['Dễ', 'Vừa', 'Khó'].includes(difficulty)) {
      difficulty = 'Dễ';
    }

    let servings = data.servings;
    if (typeof servings !== 'number' || servings < 1) {
      servings = cleanTags.some(t => /^\d+M\+$/.test(t)) ? 1 : 2;
    }

    let prep_time = data.prep_time;
    if (typeof prep_time !== 'number' || prep_time < 0) {
      prep_time = 15;
    }

    let cook_time = data.cook_time;
    if (typeof cook_time !== 'number' || cook_time < 0) {
      cook_time = 20;
    }

    const total_time_minutes = prep_time + cook_time;

    // Build standardized recipe object
    const standardized = {
      ...data,
      id: recipeId,
      title: title || 'Món ngon',
      slug: data.slug || stripAccents(title).replace(/\s+/g, '-'),
      image_url: data.image_url || '',
      images: data.images && data.images.length > 0 ? data.images : (data.image_url ? [data.image_url] : []),
      parent_id: data.parent_id || null,
      prep_time,
      cook_time,
      total_time_minutes,
      difficulty,
      calories: typeof data.calories === 'number' ? data.calories : 0,
      taste_score: typeof data.taste_score === 'number' ? data.taste_score : 0,
      cooking_history: data.cooking_history || [],
      servings,
      tags: cleanTags,
      category: data.category || (cleanTags[0] || 'Món chính'),
      is_favorite: Boolean(data.is_favorite),
      ingredients: cleanIngs,
      steps: cleanSteps,
      author_id: data.author_id || 'user',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save back to JSON file
    fs.writeFileSync(fullPath, JSON.stringify(standardized, null, 2), 'utf8');

    // Add to standardized index
    standardizedIndex.push(standardized);
    recipesProcessed++;
  }

  // STEP 4: Write updated recipes_index.json
  console.log(`Writing updated ${INDEX_PATH}...`);
  fs.writeFileSync(INDEX_PATH, JSON.stringify(standardizedIndex, null, 2), 'utf8');

  console.log('\n=== STANDARDIZATION COMPLETE ===');
  console.log(`Total active recipes standardized: ${recipesProcessed}`);
  console.log(`Index updated with ${standardizedIndex.length} recipes.`);
}

runStandardization();
