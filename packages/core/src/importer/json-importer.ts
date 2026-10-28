import type { Recipe, RecipeIngredient, Step, Unit } from '../types/recipe';
import type { Tip } from '../types/tip';
import { RecipeRepository } from '../db/recipe-repository';
import { TipRepository } from '../db/tip-repository';
import { useRecipeStore } from '../store/useRecipeStore';
import { useTipStore } from '../store/useTipStore';
import { useUnitStore } from '../store/useUnitStore';
import { sanitizeHtml } from '../utils/sanitize';

export type ImportItemStatus = 'valid' | 'duplicate' | 'invalid';
export type ImportItemType = 'recipe' | 'tip' | 'unit';
export type DuplicateConflictStrategy = 'overwrite' | 'skip' | 'create_copy';

export interface ValidatedImportItem {
  id: string;
  type: ImportItemType;
  title: string;
  subtitle?: string;
  status: ImportItemStatus;
  statusReason?: string;
  existingId?: string;
  existingItem?: Recipe | Tip | Unit;
  data: Recipe | Tip | Unit | unknown;
}

export interface ParseResult {
  fileName: string;
  fileSizeBytes: number;
  totalItems: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  items: ValidatedImportItem[];
  metadata?: {
    version?: string;
    exported_at?: string;
  };
}

export interface ImportExecutionSummary {
  totalProcessed: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  recipesCount: number;
  tipsCount: number;
  unitsCount: number;
}

function normalizeTitle(title?: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function normalizeImportedRecipe(raw: Record<string, unknown>, id: string, title: string): Recipe {
  const safeIngredients = Array.isArray(raw.ingredients)
    ? (raw.ingredients as RecipeIngredient[])
    : [];
  const safeSteps: Step[] = Array.isArray(raw.steps)
    ? raw.steps.map((s: unknown) => {
        const stepObj = (s && typeof s === 'object' ? s : {}) as Partial<Step>;
        return {
          ...stepObj,
          instruction: typeof stepObj.instruction === 'string' ? sanitizeHtml(stepObj.instruction) : '',
        };
      })
    : [];

  return {
    ...(raw as Partial<Recipe>),
    id,
    title,
    slug: typeof raw.slug === 'string' ? raw.slug : '',
    image_url: typeof raw.image_url === 'string' ? raw.image_url : '',
    prep_time: typeof raw.prep_time === 'number' ? raw.prep_time : 0,
    cook_time: typeof raw.cook_time === 'number' ? raw.cook_time : 0,
    difficulty: raw.difficulty === 'Dễ' || raw.difficulty === 'Vừa' || raw.difficulty === 'Khó' ? raw.difficulty : 'Dễ',
    calories: typeof raw.calories === 'number' ? raw.calories : 0,
    taste_score: typeof raw.taste_score === 'number' ? raw.taste_score : 0,
    servings: typeof raw.servings === 'number' ? raw.servings : 2,
    ingredients: safeIngredients,
    steps: safeSteps,
    notes: typeof raw.notes === 'string' ? sanitizeHtml(raw.notes) : undefined,
    author_id: typeof raw.author_id === 'string' ? raw.author_id : 'local',
  };
}

/**
 * Phân tích cú pháp JSON và kiểm tra tính hợp lệ, trùng lặp của dữ liệu
 */
export function parseAndValidateJson(
  rawJson: string,
  existingData: {
    recipes?: Recipe[];
    tips?: Tip[];
    units?: Unit[];
  } = {},
  fileName = 'data.json'
): ParseResult {
  const existingRecipes = existingData.recipes || [];
  const existingTips = existingData.tips || [];
  const existingUnits = existingData.units || [];

  const existingRecipeIdMap = new Map<string, Recipe>();
  const existingRecipeTitleMap = new Map<string, Recipe>();
  for (const r of existingRecipes) {
    if (r.id) existingRecipeIdMap.set(r.id, r);
    const norm = normalizeTitle(r.title);
    if (norm) existingRecipeTitleMap.set(norm, r);
  }

  const existingTipIdMap = new Map<string, Tip>();
  const existingTipTitleMap = new Map<string, Tip>();
  for (const t of existingTips) {
    if (t.id) existingTipIdMap.set(t.id, t);
    const norm = normalizeTitle(t.title);
    if (norm) existingTipTitleMap.set(norm, t);
  }

  const existingUnitNameMap = new Set<string>();
  for (const u of existingUnits) {
    if (u.name) existingUnitNameMap.add(u.name.trim().toLowerCase());
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi cú pháp';
    throw new Error(`Định dạng tệp JSON không hợp lệ: ${errMsg}`);
  }

  const items: ValidatedImportItem[] = [];
  let metadata: { version?: string; exported_at?: string } | undefined;

  let rawRecipes: Record<string, unknown>[] = [];
  let rawTips: Record<string, unknown>[] = [];
  let rawUnits: Record<string, unknown>[] = [];

  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (!item || typeof item !== 'object') {
        items.push({
          id: crypto.randomUUID(),
          type: 'recipe',
          title: 'Dữ liệu không xác định',
          status: 'invalid',
          statusReason: 'Phần tử không phải là đối tượng JSON hợp lệ',
          data: item,
        });
        continue;
      }
      const record = item as Record<string, unknown>;
      if (Array.isArray(record.ingredients) || record.prep_time !== undefined || record.difficulty !== undefined) {
        rawRecipes.push(record);
      } else if (record.content !== undefined && record.title) {
        rawTips.push(record);
      } else if (record.symbol !== undefined || record.type === 'volume' || record.type === 'weight') {
        rawUnits.push(record);
      } else {
        rawRecipes.push(record);
      }
    }
  } else if (parsed && typeof parsed === 'object') {
    const parsedObj = parsed as Record<string, unknown>;
    if (typeof parsedObj.version === 'string' || typeof parsedObj.exported_at === 'string') {
      metadata = {
        version: typeof parsedObj.version === 'string' ? parsedObj.version : undefined,
        exported_at: typeof parsedObj.exported_at === 'string' ? parsedObj.exported_at : undefined,
      };
    }

    if (Array.isArray(parsedObj.recipes)) {
      rawRecipes = parsedObj.recipes as Record<string, unknown>[];
    }
    if (Array.isArray(parsedObj.tips)) {
      rawTips = parsedObj.tips as Record<string, unknown>[];
    }
    if (Array.isArray(parsedObj.units)) {
      rawUnits = parsedObj.units as Record<string, unknown>[];
    }

    if (rawRecipes.length === 0 && rawTips.length === 0 && rawUnits.length === 0) {
      if (parsedObj.title || parsedObj.name) {
        if (parsedObj.content && !parsedObj.ingredients) {
          rawTips.push(parsedObj);
        } else {
          rawRecipes.push(parsedObj);
        }
      }
    }
  }

  // 1. Validate Recipes
  for (const r of rawRecipes) {
    if (!r || typeof r !== 'object') continue;
    const id = typeof r.id === 'string' && r.id.trim() ? r.id.trim() : crypto.randomUUID();
    const title = typeof r.title === 'string' ? r.title.trim() : '';

    if (!title) {
      items.push({
        id,
        type: 'recipe',
        title: 'Công thức không tên',
        status: 'invalid',
        statusReason: 'Thiếu trường tiêu đề công thức (title)',
        data: r,
      });
      continue;
    }

    const normalizedRecipe = normalizeImportedRecipe(r, id, title);
    const norm = normalizeTitle(title);
    const existing = existingRecipeIdMap.get(id) || (norm ? existingRecipeTitleMap.get(norm) : undefined);

    if (existing) {
      items.push({
        id,
        type: 'recipe',
        title,
        subtitle: `${normalizedRecipe.ingredients.length} nguyên liệu • ${normalizedRecipe.difficulty}`,
        status: 'duplicate',
        statusReason: `Đã có công thức trùng: "${existing.title}"`,
        existingId: existing.id,
        existingItem: existing,
        data: normalizedRecipe,
      });
    } else {
      existingRecipeIdMap.set(id, normalizedRecipe);
      if (norm) existingRecipeTitleMap.set(norm, normalizedRecipe);
      items.push({
        id,
        type: 'recipe',
        title,
        subtitle: `${normalizedRecipe.ingredients.length} nguyên liệu • ${normalizedRecipe.difficulty}`,
        status: 'valid',
        data: normalizedRecipe,
      });
    }
  }

  // 2. Validate Tips
  for (const t of rawTips) {
    if (!t || typeof t !== 'object') continue;
    const id = typeof t.id === 'string' && t.id.trim() ? t.id.trim() : crypto.randomUUID();
    const title = typeof t.title === 'string' ? t.title.trim() : '';

    if (!title) {
      items.push({
        id,
        type: 'tip',
        title: 'Mẹo không tên',
        status: 'invalid',
        statusReason: 'Thiếu tiêu đề mẹo (title)',
        data: t,
      });
      continue;
    }

    const normalizedTip: Tip = {
      ...(t as Partial<Tip>),
      id,
      title,
      category_id: typeof t.category_id === 'string' ? t.category_id : 'cooking',
      content: typeof t.content === 'string' ? sanitizeHtml(t.content) : '',
      created_at: typeof t.created_at === 'string' ? t.created_at : new Date().toISOString(),
    };

    const tipSubtitle = typeof t.category === 'string' && t.category ? t.category : 'Mẹo nhà bếp';
    const norm = normalizeTitle(title);
    const existing = existingTipIdMap.get(id) || (norm ? existingTipTitleMap.get(norm) : undefined);

    if (existing) {
      items.push({
        id,
        type: 'tip',
        title,
        subtitle: tipSubtitle,
        status: 'duplicate',
        statusReason: `Đã có mẹo trùng: "${existing.title}"`,
        existingId: existing.id,
        existingItem: existing,
        data: normalizedTip,
      });
    } else {
      existingTipIdMap.set(id, normalizedTip);
      if (norm) existingTipTitleMap.set(norm, normalizedTip);
      items.push({
        id,
        type: 'tip',
        title,
        subtitle: tipSubtitle,
        status: 'valid',
        data: normalizedTip,
      });
    }
  }

  // 3. Validate Units
  for (const u of rawUnits) {
    if (!u || typeof u !== 'object') continue;
    const id = typeof u.id === 'string' && u.id.trim() ? u.id.trim() : crypto.randomUUID();
    const name = typeof u.name === 'string' ? u.name.trim() : '';

    if (!name) {
      items.push({
        id,
        type: 'unit',
        title: 'Đơn vị không tên',
        status: 'invalid',
        statusReason: 'Thiếu tên đơn vị (name)',
        data: u,
      });
      continue;
    }

    const lowerName = name.toLowerCase();
    const isDup = existingUnitNameMap.has(lowerName);
    const unitSubtitle =
      typeof u.symbol === 'string' && u.symbol
        ? u.symbol
        : typeof u.type === 'string' && u.type
          ? u.type
          : 'Đơn vị đo';

    if (isDup) {
      items.push({
        id,
        type: 'unit',
        title: name,
        subtitle: unitSubtitle,
        status: 'duplicate',
        statusReason: `Đã có đơn vị "${name}"`,
        data: u,
      });
    } else {
      existingUnitNameMap.add(lowerName);
      items.push({
        id,
        type: 'unit',
        title: name,
        subtitle: unitSubtitle,
        status: 'valid',
        data: u,
      });
    }
  }

  let validCount = 0;
  let duplicateCount = 0;
  let invalidCount = 0;
  for (const i of items) {
    if (i.status === 'valid') validCount++;
    else if (i.status === 'duplicate') duplicateCount++;
    else invalidCount++;
  }

  const fileSizeBytes =
    typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(rawJson).byteLength : rawJson.length;

  return {
    fileName,
    fileSizeBytes,
    totalItems: items.length,
    validCount,
    duplicateCount,
    invalidCount,
    items,
    metadata,
  };
}

/**
 * Thực thi nhập dữ liệu theo chiến lược xử lý trùng lặp đã chọn
 */
export async function executeImport(
  items: ValidatedImportItem[],
  strategy: DuplicateConflictStrategy,
  onProgress?: (completed: number, total: number, currentName: string) => void
): Promise<ImportExecutionSummary> {
  const actionableItems = items.filter(i => i.status !== 'invalid');
  const total = actionableItems.length;

  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let recipesCount = 0;
  let tipsCount = 0;
  let unitsCount = 0;

  const recipesToSave: { item: Recipe; isUpdate: boolean }[] = [];
  const tipsToSave: { item: Tip; isUpdate: boolean }[] = [];
  const unitsToSave: Unit[] = [];

  let completed = 0;

  for (const item of actionableItems) {
    completed++;
    onProgress?.(completed, total, item.title);

    if (item.status === 'duplicate' && strategy === 'skip') {
      skippedCount++;
      continue;
    }

    if (item.type === 'recipe') {
      const r: Recipe = { ...(item.data as Recipe) };
      let isUpdate = false;
      if (item.status === 'duplicate') {
        if (strategy === 'overwrite') {
          r.id = item.existingId || item.id;
          isUpdate = true;
          updatedCount++;
        } else if (strategy === 'create_copy') {
          r.id = crypto.randomUUID();
          r.title = `${r.title} (Bản sao)`;
          r.slug = '';
          importedCount++;
        }
      } else {
        if (!r.id) r.id = crypto.randomUUID();
        importedCount++;
      }
      recipesToSave.push({ item: r, isUpdate });
    } else if (item.type === 'tip') {
      const t: Tip = { ...(item.data as Tip) };
      let isUpdate = false;
      if (item.status === 'duplicate') {
        if (strategy === 'overwrite') {
          t.id = item.existingId || item.id;
          isUpdate = true;
          updatedCount++;
        } else if (strategy === 'create_copy') {
          t.id = crypto.randomUUID();
          t.title = `${t.title} (Bản sao)`;
          importedCount++;
        }
      } else {
        if (!t.id) t.id = crypto.randomUUID();
        importedCount++;
      }
      tipsToSave.push({ item: t, isUpdate });
    } else if (item.type === 'unit') {
      unitsToSave.push(item.data as Unit);
      importedCount++;
    }
  }

  // 1. Lưu hàng loạt Recipes
  if (recipesToSave.length > 0) {
    try {
      await RecipeRepository.saveBulk(recipesToSave.map((x) => x.item));
      await useRecipeStore.getState().fetchRecipes(true);
      recipesCount = recipesToSave.length;
    } catch (e) {
      console.error('Lỗi khi lưu recipes trong import:', e);
      for (const entry of recipesToSave) {
        if (entry.isUpdate) updatedCount--;
        else importedCount--;
      }
      failedCount += recipesToSave.length;
    }
  }

  // 2. Lưu hàng loạt Tips
  if (tipsToSave.length > 0) {
    try {
      await TipRepository.saveBulk(tipsToSave.map((x) => x.item));
      await useTipStore.getState().fetchTips(true);
      tipsCount = tipsToSave.length;
    } catch (e) {
      console.error('Lỗi khi lưu tips trong import:', e);
      for (const entry of tipsToSave) {
        if (entry.isUpdate) updatedCount--;
        else importedCount--;
      }
      failedCount += tipsToSave.length;
    }
  }

  // 3. Lưu Units
  if (unitsToSave.length > 0) {
    try {
      useUnitStore.getState().bulkAddUnits(unitsToSave);
      unitsCount = unitsToSave.length;
    } catch (e) {
      console.error('Lỗi khi lưu units trong import:', e);
      importedCount -= unitsToSave.length;
      failedCount += unitsToSave.length;
    }
  }

  return {
    totalProcessed: total,
    importedCount,
    updatedCount,
    skippedCount,
    failedCount,
    recipesCount,
    tipsCount,
    unitsCount,
  };
}
