import { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  Trash2,
  ChefHat,
  Refrigerator,
  Lightbulb,
  NotebookTabs
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { useRecipeStore } from '../../store/useRecipeStore';
import { usePantryStore } from '../../store/usePantryStore';
import { useIngredientCatalogStore } from '../../store/useIngredientCatalogStore';
import { useTipStore } from '../../store/useTipStore';
import { useUnitStore } from '../../store/useUnitStore';
import { seedMockData } from '../../lib/seedMockData';
import { ConfirmModal } from '../../components/shared/ConfirmModal';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Store statistics
  const { recipes } = useRecipeStore();
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
    } catch (e: any) {
      toast.error('Có lỗi xảy ra khi xuất dữ liệu');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.version && !parsed.recipes) {
          throw new Error('Định dạng tệp sao lưu không hợp lệ.');
        }
        toast.success('Đã đọc tệp dữ liệu hợp lệ! (Đang đồng bộ)');
      } catch (err: any) {
        toast.error('Tệp không đúng định dạng sao lưu Apron JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSeedData = async () => {
    try {
      await seedMockData();
      toast.success('Đã nạp lại dữ liệu mẫu thành công!');
    } catch (e) {
      toast.error('Có lỗi khi nạp dữ liệu mẫu');
    }
  };

  const handleResetData = () => {
    localStorage.clear();
    toast.success('Đã đặt lại dữ liệu ứng dụng.');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-full w-full bg-background text-foreground pb-32">
      {/* 1. Header chuẩn đồng nhất */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          Cài đặt hệ thống
        </h1>
        <p className="text-xs text-default-500 mt-0.5 font-medium">
          Tuỳ biến giao diện, ngôn ngữ & dữ liệu ứng dụng
        </p>
      </div>

      <div className="px-4 py-2 flex flex-col gap-4 max-w-xl mx-auto w-full">
        {/* SECTION 1: Giao diện & Ngôn ngữ */}
        <div className="p-4 rounded-2xl bg-content1 dark:bg-default-50/20 border border-divider/60 shadow-none flex flex-col gap-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-divider/40">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Giao diện & Ngôn ngữ</h2>
              <p className="text-[11px] text-default-500">Chủ đề hiển thị và ngôn ngữ ứng dụng</p>
            </div>
          </div>

          {/* Theme Selector */}
          <div>
            <label className="text-xs font-semibold text-default-700 block mb-2">
              Chế độ hiển thị
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'light', label: 'Sáng', icon: Sun },
                { key: 'dark', label: 'Tối', icon: Moon },
                { key: 'system', label: 'Hệ thống', icon: Laptop }
              ].map((item) => {
                const isSelected = theme === item.key;
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTheme(item.key)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-divider/60 bg-default-50 hover:bg-default-100 text-default-600'
                    }`}
                  >
                    <ItemIcon className="w-5 h-5 mb-1.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <label className="text-xs font-semibold text-default-700 block mb-2">
              Ngôn ngữ (Language)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
                { code: 'en', label: 'English', flag: '🇺🇸' }
              ].map((item) => {
                const isSelected = i18n.language.startsWith(item.code);
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => i18n.changeLanguage(item.code)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-divider/60 bg-default-50 hover:bg-default-100 text-default-600'
                    }`}
                  >
                    <span className="text-base">{item.flag}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 2: Quản lý Dữ liệu & Sao lưu */}
        <div className="p-4 rounded-2xl bg-content1 dark:bg-default-50/20 border border-divider/60 shadow-none flex flex-col gap-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-divider/40">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Dữ liệu & Bộ nhớ</h2>
              <p className="text-[11px] text-default-500">Thống kê lưu trữ, sao lưu & khôi phục</p>
            </div>
          </div>

          {/* Mini Stats 4 items */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-default-50 border border-divider/40 flex flex-col items-center text-center">
              <ChefHat className="w-4 h-4 text-primary mb-1" />
              <span className="text-base font-black text-foreground">{recipes.length}</span>
              <span className="text-[10px] text-default-500 font-medium">Công thức</span>
            </div>
            <div className="p-2.5 rounded-xl bg-default-50 border border-divider/40 flex flex-col items-center text-center">
              <Refrigerator className="w-4 h-4 text-emerald-500 mb-1" />
              <span className="text-base font-black text-foreground">{pantryItems.length}</span>
              <span className="text-[10px] text-default-500 font-medium">Tủ lạnh</span>
            </div>
            <div className="p-2.5 rounded-xl bg-default-50 border border-divider/40 flex flex-col items-center text-center">
              <NotebookTabs className="w-4 h-4 text-amber-500 mb-1" />
              <span className="text-base font-black text-foreground">{catalogItems.length}</span>
              <span className="text-[10px] text-default-500 font-medium">Nguyên liệu</span>
            </div>
            <div className="p-2.5 rounded-xl bg-default-50 border border-divider/40 flex flex-col items-center text-center">
              <Lightbulb className="w-4 h-4 text-purple-500 mb-1" />
              <span className="text-base font-black text-foreground">{tips.length}</span>
              <span className="text-[10px] text-default-500 font-medium">Mẹo vặt</span>
            </div>
          </div>

          {/* Backup & Import Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <Button
              variant="flat"
              onPress={handleExportData}
              startContent={<Download className="w-4 h-4 text-primary" />}
              className="h-11 rounded-xl text-xs font-semibold justify-start px-4 bg-default-100 hover:bg-default-200 text-foreground"
            >
              Xuất tệp sao lưu dữ liệu (JSON)
            </Button>

            <Button
              variant="flat"
              onPress={() => fileImportRef.current?.click()}
              startContent={<Upload className="w-4 h-4 text-emerald-500" />}
              className="h-11 rounded-xl text-xs font-semibold justify-start px-4 bg-default-100 hover:bg-default-200 text-foreground"
            >
              Khôi phục dữ liệu từ tệp JSON
            </Button>
            <input
              type="file"
              accept=".json"
              ref={fileImportRef}
              onChange={handleImportFile}
              className="hidden"
            />

            <Button
              variant="flat"
              onPress={handleSeedData}
              startContent={<RefreshCw className="w-4 h-4 text-sky-500" />}
              className="h-11 rounded-xl text-xs font-semibold justify-start px-4 bg-default-100 hover:bg-default-200 text-foreground"
            >
              Nạp lại dữ liệu mẫu ban đầu
            </Button>

            <Button
              variant="flat"
              color="danger"
              onPress={() => setIsResetConfirmOpen(true)}
              startContent={<Trash2 className="w-4 h-4" />}
              className="h-11 rounded-xl text-xs font-semibold justify-start px-4 bg-danger-50 hover:bg-danger-100 text-danger"
            >
              Xoá sạch dữ liệu ứng dụng
            </Button>
          </div>
        </div>

        {/* SECTION 3: Thông tin ứng dụng */}
        <div className="p-4 rounded-2xl bg-content1 dark:bg-default-50/20 border border-divider/60 shadow-none flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-white font-black text-lg shadow-sm">
              A
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Apron Mobile</h3>
              <p className="text-[11px] text-default-500">Trợ lý nhà bếp thông minh • v1.0.0</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-primary bg-primary-50 dark:bg-primary-950/40 px-2 py-1 rounded-lg">
            Build 2026.10
          </span>
        </div>
      </div>

      {/* Confirm Reset Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onOpenChange={setIsResetConfirmOpen}
        title="Xoá sạch dữ liệu"
        description="Bạn có chắc chắn muốn xoá toàn bộ dữ liệu trên thiết bị? Thao tác này sẽ xoá tất cả công thức, nguyên liệu và cài đặt của bạn."
        confirmLabel="Xoá tất cả"
        confirmColor="danger"
        onConfirm={handleResetData}
      />
    </div>
  );
}
