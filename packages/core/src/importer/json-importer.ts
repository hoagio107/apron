import type { Recipe } from '../types/recipe';
import type { Tip } from '../types/tip';
import type { Unit } from '../types/recipe';
import { RecipeRepository } from '../db/recipe-repository';
import { TipRepository } from '../db/tip-repository';
import { useRecipeStore } from '../store/useRecipeStore';
import { useTipStore } from '../store/useTipStore';
import { useUnitStore } from '../store/useUnitStore';

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
  data: any;
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

  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err: any) {
    throw new Error(`Định dạng tệp JSON không hợp lệ: ${err?.message || 'Lỗi cú pháp'}`);
  }

  const items: ValidatedImportItem[] = [];
  let metadata: { version?: string; exported_at?: string } | undefined;

  let rawRecipes: any[] = [];
  let rawTips: any[] = [];
  let rawUnits: any[] = [];

  if (Array.isArray(parsed)) {
    // Nếu là một mảng, tự động phân loại từng phần tử
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
      if (Array.isArray(item.ingredients) || item.prep_time !== undefined || item.difficulty !== undefined) {
        rawRecipes.push(item);
      } else if (item.content !== undefined && item.title) {
        rawTips.push(item);
      } else if (item.symbol !== undefined || item.type === 'volume' || item.type === 'weight') {
        rawUnits.push(item);
      } else {
        // Mặc định coi là recipe
        rawRecipes.push(item);
      }
    }
  } else if (parsed && typeof parsed === 'object') {
    // Định dạng sao lưu đầy đủ
    if (parsed.version || parsed.exported_at) {
      metadata = {
        version: parsed.version,
        exported_at: parsed.exported_at,
      };
    }

    if (Array.isArray(parsed.recipes)) {
      rawRecipes = parsed.recipes;
    }
    if (Array.isArray(parsed.tips)) {
      rawTips = parsed.tips;
    }
    if (Array.isArray(parsed.units)) {
      rawUnits = parsed.units;
    }

    // Nếu không có các trường mảng trên nhưng có title -> 1 công thức/mẹo đơn lẻ
    if (rawRecipes.length === 0 && rawTips.length === 0 && rawUnits.length === 0) {
      if (parsed.title || parsed.name) {
        if (parsed.content && !parsed.ingredients) {
          rawTips.push(parsed);
        } else {
          rawRecipes.push(parsed);
        }
      }
    }
  }

  // 1. Validate Recipes
  for (const r of rawRecipes) {
    const id = r.id || crypto.randomUUID();
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

    const norm = normalizeTitle(title);
    const existing = existingRecipeIdMap.get(id) || (norm ? existingRecipeTitleMap.get(norm) : undefined);

    if (existing) {
      items.push({
        id,
        type: 'recipe',
        title,
        subtitle: `${r.ingredients?.length || 0} nguyên liệu • ${r.difficulty || 'Dễ'}`,
        status: 'duplicate',
        statusReason: `Đã có công thức trùng: "${existing.title}"`,
        existingId: existing.id,
        existingItem: existing,
        data: r,
      });
    } else {
      existingRecipeIdMap.set(id, r as Recipe);
      if (norm) existingRecipeTitleMap.set(norm, r as Recipe);
      items.push({
        id,
        type: 'recipe',
        title,
        subtitle: `${r.ingredients?.length || 0} nguyên liệu • ${r.difficulty || 'Dễ'}`,
        status: 'valid',
        data: r,
      });
    }
  }

  // 2. Validate Tips
  for (const t of rawTips) {
    const id = t.id || crypto.randomUUID();
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

    const norm = normalizeTitle(title);
    const existing = existingTipIdMap.get(id) || (norm ? existingTipTitleMap.get(norm) : undefined);

    if (existing) {
      items.push({
        id,
        type: 'tip',
        title,
        subtitle: t.category || 'Mẹo nhà bếp',
        status: 'duplicate',
        statusReason: `Đã có mẹo trùng: "${existing.title}"`,
        existingId: existing.id,
        existingItem: existing,
        data: t,
      });
    } else {
      existingTipIdMap.set(id, t as Tip);
      if (norm) existingTipTitleMap.set(norm, t as Tip);
      items.push({
        id,
        type: 'tip',
        title,
        subtitle: t.category || 'Mẹo nhà bếp',
        status: 'valid',
        data: t,
      });
    }
  }

  // 3. Validate Units
  for (const u of rawUnits) {
    const id = u.id || crypto.randomUUID();
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

    if (isDup) {
      items.push({
        id,
        type: 'unit',
        title: name,
        subtitle: u.symbol || u.type || 'Đơn vị đo',
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
        subtitle: u.symbol || u.type || 'Đơn vị đo',
        status: 'valid',
        data: u,
      });
    }
  }

  const validCount = items.filter(i => i.status === 'valid').length;
  const duplicateCount = items.filter(i => i.status === 'duplicate').length;
  const invalidCount = items.filter(i => i.status === 'invalid').length;

  return {
    fileName,
    fileSizeBytes: rawJson.length,
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

  const recipesToSave: Recipe[] = [];
  const tipsToSave: Tip[] = [];
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
      const r = { ...item.data } as Recipe;
      if (item.status === 'duplicate') {
        if (strategy === 'overwrite') {
          // Ghi đè: giữ id của item đã có trong máy để cập nhật
          r.id = item.existingId || item.id;
          updatedCount++;
        } else if (strategy === 'create_copy') {
          // Tạo bản sao: sinh UUID mới và thêm hậu tố (Bản sao)
          r.id = crypto.randomUUID();
          r.title = `${r.title} (Bản sao)`;
          r.slug = '';
          importedCount++;
        }
      } else {
        if (!r.id) r.id = crypto.randomUUID();
        importedCount++;
      }
      recipesToSave.push(r);
    } else if (item.type === 'tip') {
      const t = { ...item.data } as Tip;
      if (item.status === 'duplicate') {
        if (strategy === 'overwrite') {
          t.id = item.existingId || item.id;
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
      tipsToSave.push(t);
    } else if (item.type === 'unit') {
      if (item.status === 'duplicate') {
        if (strategy === 'skip') {
          skippedCount++;
          continue;
        }
      }
      unitsToSave.push(item.data as Unit);
      importedCount++;
    }
  }

  // 1. Lưu hàng loạt Recipes
  if (recipesToSave.length > 0) {
    try {
      await RecipeRepository.saveBulk(recipesToSave);
      await useRecipeStore.getState().fetchRecipes(true);
    } catch (e) {
      console.error('Lỗi khi lưu recipes trong import:', e);
      failedCount += recipesToSave.length;
    }
  }

  // 2. Lưu hàng loạt Tips
  if (tipsToSave.length > 0) {
    try {
      await TipRepository.saveBulk(tipsToSave);
      await useTipStore.getState().fetchTips();
    } catch (e) {
      console.error('Lỗi khi lưu tips trong import:', e);
      failedCount += tipsToSave.length;
    }
  }

  // 3. Lưu Units
  if (unitsToSave.length > 0) {
    try {
      useUnitStore.getState().bulkAddUnits(unitsToSave);
    } catch (e) {
      console.error('Lỗi khi lưu units trong import:', e);
      failedCount += unitsToSave.length;
    }
  }

  return {
    totalProcessed: total,
    importedCount,
    updatedCount,
    skippedCount,
    failedCount,
  };
}
