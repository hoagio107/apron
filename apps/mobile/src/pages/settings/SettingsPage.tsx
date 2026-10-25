import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Button,
  toast
} from '@/ui';
import {
  Palette,
  Database,
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  Trash2,
  ChevronRight,
  Languages,
  Copy,
  Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { Capacitor } from '@capacitor/core';
import { useRecipeStore } from '../../store/useRecipeStore';
import { usePantryStore } from '../../store/usePantryStore';
import { useIngredientCatalogStore } from '../../store/useIngredientCatalogStore';
import { useTipStore } from '../../store/useTipStore';
import { useUnitStore } from '../../store/useUnitStore';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { FEEDBACK_RESET_DELAY_MS, RESET_APP_RELOAD_DELAY_MS } from '../../constants';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Store statistics
  const { recipes, addBulkRecipes, fetchRecipes } = useRecipeStore();
  const { items: pantryItems } = usePantryStore();
  const { getAllIngredients } = useIngredientCatalogStore();
  const { tips } = useTipStore();
  const { units } = useUnitStore();
  const catalogItems = getAllIngredients();

  // Reset modal state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const fileImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dbLocation = useMemo(() => {
    const customPath = localStorage.getItem('byos_base_dir');
    if (customPath) {
      return customPath;
    }
    const isTauri = typeof window !== 'undefined' && (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ !== undefined;
    if (isTauri) {
      return 'Tauri Local File System';
    }
    if (Capacitor.isNativePlatform()) {
      return 'Documents/CookbookData (Bộ nhớ máy)';
    }
    return 'IndexedDB: apron_browser_storage (Trình duyệt)';
  }, []);

  const handleCopyDbLocation = async () => {
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(dbLocation);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = dbLocation;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      toast.success('Đã sao chép vị trí database vào clipboard!');
      setTimeout(() => {
        setCopied(false);
      }, FEEDBACK_RESET_DELAY_MS);
    } catch {
      toast.error('Không thể sao chép vị trí database');
    }
  };

  const handleExportData = () => {
    try {
      const backupData = {
        exported_at: new Date().toISOString(),
        version: '1.0.0',
        recipes,
        pantry: pantryItems,
        catalog: catalogItems,
        units,
        tips
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apron-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Đã xuất tệp sao lưu dữ liệu JSON thành công!');
    } catch {
      toast.error('Có lỗi xảy ra khi xuất dữ liệu');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        let recipesToImport: any[] = [];
        let unitsToImport: any[] = [];
        let catalogToImport: any[] = [];

        if (Array.isArray(parsed)) {
          recipesToImport = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.recipes)) {
            recipesToImport = parsed.recipes;
          } else if (parsed.title || parsed.name) {
            recipesToImport = [parsed];
          }

          if (Array.isArray(parsed.units)) {
            unitsToImport = parsed.units;
          }
          if (Array.isArray(parsed.catalog)) {
            catalogToImport = parsed.catalog;
          } else if (parsed.catalog && typeof parsed.catalog === 'object') {
            catalogToImport = Object.values(parsed.catalog);
          }
        } else {
          throw new Error('Định dạng tệp sao lưu không hợp lệ.');
        }

        // Auto-extract any units and ingredients from recipes
        recipesToImport.forEach((r: any) => {
          if (Array.isArray(r.ingredients)) {
            r.ingredients.forEach((ing: any) => {
              if (ing && ing.name) {
                const name = String(ing.name).trim();
                const unit = ing.unit ? String(ing.unit).trim() : '';
                if (name) {
                  catalogToImport.push({
                    name,
                    default_unit: unit || undefined,
                  });
                }
                if (unit && !['g', 'kg', 'ml', 'lít', 'muỗng canh', 'muỗng cà phê'].includes(unit.toLowerCase())) {
                  unitsToImport.push({
                    name: unit,
                    symbol: unit,
                    type: 'other',
                    is_custom: true
                  });
                }
              }
            });
          }
        });

        // 1. Bulk import units
        let addedUnitsCount = 0;
        if (unitsToImport.length > 0) {
          addedUnitsCount = useUnitStore.getState().bulkAddUnits(unitsToImport);
        }

        // 2. Bulk import ingredient catalog
        let addedCatalogCount = 0;
        if (catalogToImport.length > 0) {
          addedCatalogCount = useIngredientCatalogStore.getState().bulkAddIngredients(catalogToImport);
        }

        // 3. Import recipes
        if (recipesToImport.length > 0) {
          const normalized = recipesToImport.map(r => ({
            ...r,
            title: r.title || r.name || 'Không có tiêu đề',
            slug: r.slug || (r.title || r.name || 'recipe').toLowerCase().replace(/\s+/g, '-'),
            id: r.id || `recipe-${crypto.randomUUID()}`,
            image_url: r.image_url || r.image || '',
            taste_score: 0,
            cooking_history: [],
            difficulty: r.difficulty || 'Vừa',
            servings: Number(r.servings) || 2,
            prep_time: Number(r.prep_time) || 0,
            cook_time: Number(r.cook_time) || 0,
            calories: Number(r.calories) || (r.nutrition?.calories ? Number(r.nutrition.calories) : 0),
            ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
            steps: Array.isArray(r.steps) ? r.steps : [],
            author_id: r.author_id || 'user',
            created_at: r.created_at || new Date().toISOString(),
            updated_at: r.updated_at || new Date().toISOString()
          }));

          await addBulkRecipes(normalized);
          await fetchRecipes();

          const details: string[] = [`${normalized.length} công thức`];
          if (addedUnitsCount > 0) details.push(`${addedUnitsCount} đơn vị`);
          if (addedCatalogCount > 0) details.push(`${addedCatalogCount} nguyên liệu`);

          toast.success(`Đã nạp thành công: ${details.join(', ')}!`);
        } else if (addedUnitsCount > 0 || addedCatalogCount > 0) {
          toast.success(`Đã nạp thành công: ${addedUnitsCount} đơn vị, ${addedCatalogCount} nguyên liệu!`);
        } else {
          toast.warning('Tệp không chứa công thức nào.');
        }
      } catch (err: any) {
        console.error('Import error:', err);
        toast.error('Tệp không đúng định dạng sao lưu Apron JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    localStorage.clear();
    toast.success('Đã đặt lại dữ liệu ứng dụng.');
    setTimeout(() => {
      window.location.reload();
    }, RESET_APP_RELOAD_DELAY_MS);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-full w-full bg-background text-foreground pb-32">
      {/* 1. Header chuẩn đồng nhất */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          {t('settings.title')}
        </h1>
        <p className="text-xs text-default-500 mt-0.5 font-medium">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="px-4 py-2 flex flex-col gap-6 max-w-xl mx-auto w-full">
        {/* SECTION 1: Giao diện & Ngôn ngữ */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-default-400 px-1">
            {t('settings.appearance.sectionTitle')} & {t('settings.language.sectionTitle')}
          </span>
          <div className="bg-content1/60 dark:bg-default-50/15 rounded-2xl overflow-hidden divide-y divide-divider/25 border-none shadow-none">
            {/* Theme row */}
            <div className="flex items-center justify-between p-3.5 hover:bg-default-100/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{t('settings.appearance.theme')}</span>
                  <span className="text-[11px] text-default-400">
                    {theme === 'light' ? t('settings.appearance.light') : theme === 'dark' ? t('settings.appearance.dark') : t('settings.appearance.system')}
                  </span>
                </div>
              </div>
              
              {/* Segmented Control */}
              <div className="flex items-center p-1 bg-default-100 dark:bg-default-50/30 rounded-xl gap-0.5">
                {[
                  { key: 'light', label: t('settings.appearance.light'), icon: Sun },
                  { key: 'dark', label: t('settings.appearance.dark'), icon: Moon },
                  { key: 'system', label: t('settings.appearance.system'), icon: Laptop }
                ].map((item) => {
                  const isSelected = theme === item.key;
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setTheme(item.key)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-background text-primary font-bold shadow-xs'
                          : 'text-default-500 hover:text-foreground'
                      }`}
                    >
                      <ItemIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language row */}
            <div className="flex items-center justify-between p-3.5 hover:bg-default-100/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Languages className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{t('settings.language.current')}</span>
                  <span className="text-[11px] text-default-400">
                    {i18n.language.startsWith('vi') ? t('settings.language.vi') : t('settings.language.en')}
                  </span>
                </div>
              </div>

              {/* Segmented Control */}
              <div className="flex items-center p-1 bg-default-100 dark:bg-default-50/30 rounded-xl gap-0.5">
                {[
                  { code: 'vi', label: t('settings.language.vi'), flag: '🇻🇳' },
                  { code: 'en', label: t('settings.language.en'), flag: '🇺🇸' }
                ].map((item) => {
                  const isSelected = i18n.language.startsWith(item.code);
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => i18n.changeLanguage(item.code)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-background text-primary font-bold shadow-xs'
                          : 'text-default-500 hover:text-foreground'
                      }`}
                    >
                      <span className="text-sm leading-none">{item.flag}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Quản lý Dữ liệu & Sao lưu */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-default-400 px-1">
            {t('settings.data.sectionTitle')}
          </span>
          <div className="bg-content1/60 dark:bg-default-50/15 rounded-2xl overflow-hidden divide-y divide-divider/25 border-none shadow-none">
            {/* Stats Row */}
            <div className="grid grid-cols-4 p-3 bg-default-100/40 dark:bg-default-50/10 divide-x divide-divider/20 text-center">
              <div className="flex flex-col items-center py-1">
                <span className="text-base font-bold text-foreground">{recipes.length}</span>
                <span className="text-[10px] text-default-400 font-medium mt-0.5">{t('nav.recipes')}</span>
              </div>
              <div className="flex flex-col items-center py-1">
                <span className="text-base font-bold text-foreground">{pantryItems.length}</span>
                <span className="text-[10px] text-default-400 font-medium mt-0.5">{t('fridge.title')}</span>
              </div>
              <div className="flex flex-col items-center py-1">
                <span className="text-base font-bold text-foreground">{catalogItems.length}</span>
                <span className="text-[10px] text-default-400 font-medium mt-0.5">{t('recipes.detail.ingredients')}</span>
              </div>
              <div className="flex flex-col items-center py-1">
                <span className="text-base font-bold text-foreground">{tips.length}</span>
                <span className="text-[10px] text-default-400 font-medium mt-0.5">{t('nav.kitchenTips')}</span>
              </div>
            </div>

            {/* Vị trí database Row */}
            <div className="flex items-center justify-between p-3.5 hover:bg-default-100/30 transition-colors w-full">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-foreground">{t('settings.data.dbLocation')}</span>
                  <span className="text-[11px] text-default-400 truncate max-w-[220px] sm:max-w-md font-mono" title={dbLocation}>
                    {dbLocation}
                  </span>
                </div>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label={t('settings.data.copyLocation')}
                onPress={handleCopyDbLocation}
                onClick={handleCopyDbLocation}
                className="shrink-0 text-default-500 hover:text-foreground"
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            {/* Flat List Action Rows */}
            <button
              type="button"
              onClick={handleExportData}
              className="flex items-center justify-between p-3.5 hover:bg-default-100/30 transition-colors w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{t('settings.data.exportBackup')}</span>
                  <span className="text-[11px] text-default-400">JSON Backup</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-default-400 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => fileImportRef.current?.click()}
              className="flex items-center justify-between p-3.5 hover:bg-default-100/30 transition-colors w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{t('settings.data.importBackup')}</span>
                  <span className="text-[11px] text-default-400">JSON Restore</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-default-400 shrink-0" />
            </button>
            <input
              type="file"
              accept=".json"
              ref={fileImportRef}
              onChange={handleImportFile}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="flex items-center justify-between p-3.5 hover:bg-danger/10 transition-colors w-full text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-danger/10 dark:bg-danger/20 text-danger flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-danger">{t('settings.data.resetApp')}</span>
                  <span className="text-[11px] text-default-400">{t('settings.data.dangerZone')}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-default-400 group-hover:text-danger shrink-0" />
            </button>
          </div>
        </div>

        {/* SECTION 3: Thông tin ứng dụng */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-default-400 px-1">
            {t('settings.about.sectionTitle')}
          </span>
          <div className="bg-content1/60 dark:bg-default-50/15 rounded-2xl overflow-hidden p-3.5 flex items-center justify-between border-none shadow-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center p-1.5 shrink-0">
                <img src="/logo.svg" alt="Apron Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">apron</span>
                <span className="text-[11px] text-default-400">{t('settings.about.description')}</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-primary bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-md">
              v1.0.0
            </span>
          </div>
        </div>
      </div>

      {/* Confirm Reset Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onOpenChange={setIsResetConfirmOpen}
        title={t('settings.data.resetConfirmTitle')}
        description={t('settings.data.resetConfirmMsg')}
        confirmLabel={t('common.actions.delete')}
        confirmColor="danger"
        onConfirm={handleResetData}
      />
    </div>
  );
}
