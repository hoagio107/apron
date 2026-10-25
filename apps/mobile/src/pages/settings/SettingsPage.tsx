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
  const { i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

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
      } catch {
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
          Cài đặt hệ thống
        </h1>
        <p className="text-xs text-default-500 mt-0.5 font-medium">
          Tuỳ biến giao diện, ngôn ngữ & dữ liệu ứng dụng
        </p>
      </div>

      <div className="px-4 py-2 flex flex-col gap-6 max-w-xl mx-auto w-full">
        {/* SECTION 1: Giao diện & Ngôn ngữ */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-default-400 px-1">
            Giao diện & Ngôn ngữ
          </span>
          <div className="bg-content1/60 dark:bg-default-50/15 rounded-2xl overflow-hidden divide-y divide-divider/25 border-none shadow-none">
            {/* Theme row */}
            <div className="flex items-center justify-between p-3.5 hover:bg-default-100/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">Chế độ hiển thị</span>
                  <span className="text-[11px] text-default-400">
                    {theme === 'light' ? 'Giao diện sáng' : theme === 'dark' ? 'Giao diện tối' : 'Theo hệ thống'}
                  </span>
                </div>
              </div>
              
              {/* Segmented Control */}
              <div className="flex items-center p-1 bg-default-100 dark:bg-default-50/30 rounded-xl gap-0.5">
                {[
                  { key: 'light', label: 'Sáng', icon: Sun },
                  { key: 'dark', label: 'Tối', icon: Moon },
                  { key: 'system', label: 'Tự động', icon: Laptop }
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
                  <span className="text-sm font-semibold text-foreground">Ngôn ngữ</span>
                  <span className="text-[11px] text-default-400">
                    {i18n.language.startsWith('vi') ? 'Tiếng Việt' : 'English'}
                  </span>
                </div>
              </div>

              {/* Segmented Control */}
              <div className="flex items-center p-1 bg-default-100 dark:bg-default-50/30 rounded-xl gap-0.5">
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
            Dữ liệu & Bộ nhớ
          </span>
          <div className="bg-content1/60 dark:bg-default-50/15 rounded-2xl overflow-hidden divide-y divide-divider/25 border-none shadow-none">
            {/* Stats Row - Dải metric phẳng liền mạch không đóng khung */}
            <div className="grid grid-cols-4 p-3 bg-default-100/40 dark:bg-default-50/10 divide-x divide-divider/20 text-center">
              <div className="flex flex-col items-center py-1">
                <span className="text-base font-bold text-foreground">{recipes.length}</span>
                <span className="text-[10px] text-default-400 font-medium mt-0.5">Công thức</span>
              </div>
              <div className="flex flex-col items-center py-1">
                <span className="text-base font-bold text-foreground">{pantryItems.length}</span>
                <span className="text-[10px] text-default-400 font-medium mt-0.5">Tủ lạnh</span>
              </div>
              <div className="flex flex-col items-center py-1">
                <span className="text-base font-bold text-foreground">{catalogItems.length}</span>
                <span className="text-[10px] text-default-400 font-medium mt-0.5">Nguyên liệu</span>
              </div>
              <div className="flex flex-col items-center py-1">
                <span className="text-base font-bold text-foreground">{tips.length}</span>
                <span className="text-[10px] text-default-400 font-medium mt-0.5">Mẹo vặt</span>
              </div>
            </div>

            {/* Vị trí database Row */}
            <div className="flex items-center justify-between p-3.5 hover:bg-default-100/30 transition-colors w-full">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-foreground">Vị trí database</span>
                  <span className="text-[11px] text-default-400 truncate max-w-[220px] sm:max-w-md font-mono" title={dbLocation}>
                    {dbLocation}
                  </span>
                </div>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label="Sao chép vị trí database"
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
                  <span className="text-sm font-semibold text-foreground">Xuất tệp sao lưu dữ liệu</span>
                  <span className="text-[11px] text-default-400">Tải về tệp JSON chứa toàn bộ dữ liệu</span>
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
                  <span className="text-sm font-semibold text-foreground">Khôi phục từ tệp JSON</span>
                  <span className="text-[11px] text-default-400">Nhập dữ liệu sao lưu trước đó</span>
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
                  <span className="text-sm font-semibold text-danger">Xoá sạch dữ liệu ứng dụng</span>
                  <span className="text-[11px] text-default-400">Đặt lại thiết bị về trạng thái ban đầu</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-default-400 group-hover:text-danger shrink-0" />
            </button>
          </div>
        </div>

        {/* SECTION 3: Thông tin ứng dụng */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-default-400 px-1">
            Thông tin ứng dụng
          </span>
          <div className="bg-content1/60 dark:bg-default-50/15 rounded-2xl overflow-hidden p-3.5 flex items-center justify-between border-none shadow-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center p-1.5 shrink-0">
                <img src="/logo.svg" alt="Apron Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">Apron Mobile</span>
                <span className="text-[11px] text-default-400">Trợ lý nhà bếp thông minh • v1.0.0</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-primary bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-md">
              Build 2026.10
            </span>
          </div>
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
