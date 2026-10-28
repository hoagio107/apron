const fs = require('fs');
const path = require('path');

const RECIPES_DIR = 'P:\\CookbookData\\recipes';
const INDEX_FILE = 'P:\\CookbookData\\recipes_index.json';
const BACKUP_DIR = `P:\\CookbookData\\recipes_duplicates_backup_${Date.now()}`;
const DOCS_DIR = 'C:\\Users\\Admin\\Documents\\CookbookData';

function deduplicate() {
  if (!fs.existsSync(RECIPES_DIR)) {
    console.error('Directory does not exist:', RECIPES_DIR);
    return;
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const files = fs.readdirSync(RECIPES_DIR).filter(f => f.endsWith('.json'));
  console.log(`Initial recipe files count: ${files.length}`);

  const byTitle = new Map();

  for (const file of files) {
    const filePath = path.join(RECIPES_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const title = (data.title || '').trim();
      if (!byTitle.has(title)) byTitle.set(title, []);
      byTitle.get(title).push({
        file,
        filePath,
        id: data.id,
        data,
        size: fs.statSync(filePath).size,
        mtime: fs.statSync(filePath).mtimeMs
      });
    } catch (e) {
      console.error(`Error reading ${file}:`, e.message);
    }
  }

  const filesToDelete = [];
  const filesToKeep = [];

  for (const [title, list] of byTitle.entries()) {
    if (list.length === 1) {
      filesToKeep.push(list[0]);
      continue;
    }

    // Sort list to find the best candidate to keep
    list.sort((a, b) => {
      // 1. Filename matches ID exactly
      const aMatchesId = a.file === `${a.id}.json` ? 1 : 0;
      const bMatchesId = b.file === `${b.id}.json` ? 1 : 0;
      if (aMatchesId !== bMatchesId) return bMatchesId - aMatchesId;

      // 2. Has image
      const aHasImg = (a.data.image_url || a.data.images?.length) ? 1 : 0;
      const bHasImg = (b.data.image_url || b.data.images?.length) ? 1 : 0;
      if (aHasImg !== bHasImg) return bHasImg - aHasImg;

      // 3. Number of steps + ingredients
      const aScore = (a.data.steps?.length || 0) * 2 + (a.data.ingredients?.length || 0);
      const bScore = (b.data.steps?.length || 0) * 2 + (b.data.ingredients?.length || 0);
      if (aScore !== bScore) return bScore - aScore;

      // 4. File size
      if (a.size !== b.size) return b.size - a.size;

      // 5. Newer mtime
      return b.mtime - a.mtime;
    });

    const winner = list[0];
    filesToKeep.push(winner);

    for (let i = 1; i < list.length; i++) {
      filesToDelete.push({ item: list[i], kept: winner, title });
    }
  }

  console.log(`\nFound ${filesToDelete.length} duplicate files to remove.`);
  console.log(`Unique recipes to keep: ${filesToKeep.length}`);

  // Backup and delete duplicate files
  for (const entry of filesToDelete) {
    const src = entry.item.filePath;
    const dest = path.join(BACKUP_DIR, entry.item.file);
    fs.copyFileSync(src, dest);
    fs.unlinkSync(src);
    console.log(`Deleted duplicate: ${entry.item.file} (Kept: ${entry.kept.file} for "${entry.title}")`);
  }

  // Verify recipes dir
  const remainingFiles = fs.readdirSync(RECIPES_DIR).filter(f => f.endsWith('.json'));
  console.log(`\nRemaining recipe files in ${RECIPES_DIR}: ${remainingFiles.length}`);

  // Re-build recipes_index.json
  const finalRecipes = [];
  for (const f of remainingFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(RECIPES_DIR, f), 'utf-8'));
      finalRecipes.push(data);
    } catch (e) {
      console.error('Error parsing file for index:', f);
    }
  }

  fs.writeFileSync(INDEX_FILE, JSON.stringify(finalRecipes, null, 2), 'utf-8');
  console.log(`Re-generated ${INDEX_FILE} with ${finalRecipes.length} unique recipes.`);

  // Mirror to Documents/CookbookData if it exists
  if (fs.existsSync(DOCS_DIR)) {
    const docsRecipesDir = path.join(DOCS_DIR, 'recipes');
    const docsIndexFile = path.join(DOCS_DIR, 'recipes_index.json');
    if (fs.existsSync(docsRecipesDir)) {
      // Remove deleted files in docsRecipesDir
      for (const entry of filesToDelete) {
        const p = path.join(docsRecipesDir, entry.item.file);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
      // Re-write index in docs
      fs.writeFileSync(docsIndexFile, JSON.stringify(finalRecipes, null, 2), 'utf-8');
      console.log(`Synchronized clean recipes & index to ${DOCS_DIR}`);
    }
  }

  console.log('\n--- DEDUPLICATION COMPLETE AND VERIFIED! ---');
}

deduplicate();
