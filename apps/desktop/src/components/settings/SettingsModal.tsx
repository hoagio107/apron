import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Tabs,
  Tab,
  toast,
} from "@/ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { 
  Palette, 
  Database, 
  Trash2, 
  Folder, 
  FolderOpen, 
  CheckCircle, 
  Copy, 
  Check, 
  Sun, 
  Moon, 
  Monitor, 
  AlertTriangle, 
  RefreshCw, 
  Info, 
  Sparkles,
  HardDrive,
  ExternalLink
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { getStorageProvider } from "@apron/core";
import { ImageManager } from "../../lib/image-manager";
import { MediaCleaner, type CleanupResult } from "../../lib/media-cleaner";

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

interface SavedAccount {
  id: string;
  name: string;
  path: string;
}

export function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [baseDir, setBaseDir] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('Apron');
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<CleanupResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingDir, setPendingDir] = useState<string | null>(null);
  const [isChangingDir, setIsChangingDir] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Tải cấu hình lưu trữ & tài khoản
    ImageManager.getBaseDir().then(dir => setBaseDir(dir)).catch(() => {});
    
    const currentName = localStorage.getItem('account_name') || 'Apron';
    setAccountName(currentName);

    try {
      const savedAccounts = localStorage.getItem('apron_accounts');
      if (savedAccounts) {
        setAccounts(JSON.parse(savedAccounts));
      }
    } catch (e) {
      console.error('Failed to parse saved accounts:', e);
    }
  }, [isOpen]);

  const handleCopyPath = () => {
    if (!baseDir) return;
    navigator.clipboard.writeText(baseDir);
    setCopied(true);
    toast.success('Đã sao chép đường dẫn database!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenFolder = async () => {
    if (!baseDir) {
      toast.error('Chưa có đường dẫn thư mục database');
      return;
    }
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.__TAURI_INTERNALS__) {
        await invoke('open_in_folder', { path: baseDir });
      } else {
        toast.info(`Thư mục lưu trữ: ${baseDir}`);
      }
    } catch (err: any) {
      console.error('Lỗi mở thư mục:', err);
      toast.error('Không thể mở thư mục: ' + (err?.message || err));
    }
  };

  const handleSelectNewDirectory = async () => {
    try {
      setIsChangingDir(true);
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Chọn thư mục lưu trữ cơ sở dữ liệu (Database)',
        defaultPath: baseDir || undefined,
      });

      if (selected && typeof selected === 'string') {
        if (selected === baseDir) {
          toast.info('Thư mục được chọn trùng với thư mục database hiện tại.');
          return;
        }
        setPendingDir(selected);
      }
    } catch (err: any) {
      console.error('Failed to select folder:', err);
      toast.error('Không thể mở hộp thoại chọn thư mục: ' + (err?.message || ''));
    } finally {
      setIsChangingDir(false);
    }
  };

  const handleConfirmSwitch = async (newPath: string) => {
    try {
      const provider = getStorageProvider() as any;
      if (provider.setBaseDir) {
        await provider.setBaseDir(newPath);
      } else {
        localStorage.setItem('byos_base_dir', newPath);
      }
      localStorage.setItem('byos_base_dir', newPath);
      setBaseDir(newPath);

      // Cập nhật hoặc lưu vào danh sách accounts
      try {
        const savedAccountsStr = localStorage.getItem('apron_accounts');
        const accs: SavedAccount[] = savedAccountsStr ? JSON.parse(savedAccountsStr) : [];
        const existingIdx = accs.findIndex(a => a.name === accountName);
        if (existingIdx >= 0) {
          accs[existingIdx].path = newPath;
        } else {
          accs.push({ id: crypto.randomUUID(), name: accountName, path: newPath });
        }
        localStorage.setItem('apron_accounts', JSON.stringify(accs));
        setAccounts(accs);
      } catch (e) {
        console.error('Failed updating account list:', e);
      }

      setPendingDir(null);
      toast.success('Đã chuyển đổi vị trí database! Đang làm mới dữ liệu...');
      
      // Reload ứng dụng sau 600ms để nạp dữ liệu từ vị trí database mới
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err: any) {
      console.error('Failed to switch base dir:', err);
      toast.error('Lỗi khi thiết lập vị trí lưu trữ mới: ' + (err?.message || ''));
    }
  };

  const handlePruneImages = async () => {
    setIsCleaning(true);
    setCleanResult(null);
    try {
      const result = await MediaCleaner.pruneOrphanedImages();
      setCleanResult(result);
      const freedMb = (result.freedBytes / (1024 * 1024)).toFixed(2);
      if (result.deletedCount > 0 || result.tempFilesCleaned > 0) {
        toast.success(`Đã dọn dẹp ${result.deletedCount} ảnh mồ côi & ${result.tempFilesCleaned} file tạm (${freedMb} MB)`);
      } else {
        toast.success('Bộ nhớ dữ liệu đã tối ưu, không có ảnh thừa.');
      }
    } catch (e: any) {
      toast.error('Lỗi khi dọn dẹp ảnh: ' + (e?.message || 'Không rõ nguyên nhân'));
    } finally {
      setIsCleaning(false);
    }
  };

  if (!mounted) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange} 
      size="2xl"
      backdrop="blur"
      classNames={{
        base: "bg-content1 border border-divider shadow-2xl rounded-2xl max-h-[90vh]",
        header: "border-b border-divider/70 px-6 py-4",
        body: "px-6 py-5 overflow-y-auto custom-scrollbar",
        footer: "border-t border-divider/70 px-6 py-3"
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-bold text-foreground">{t("Settings")}</span>
                <span className="text-xs text-default-500 font-normal">
                  Quản lý vị trí cơ sở dữ liệu (BYOS), bộ nhớ và tuỳ biến ứng dụng
                </span>
              </div>
            </ModalHeader>

            <ModalBody className="gap-5">
              <Tabs 
                aria-label="Settings categories" 
                color="primary" 
                variant="underlined"
                classNames={{
                  tabList: "gap-6 w-full border-b border-divider pb-0 px-1",
                  cursor: "w-full bg-primary",
                  tab: "max-w-fit px-1 h-10 text-sm font-medium",
                  tabContent: "group-data-[selected=true]:text-primary text-default-500 group-data-[selected=true]:font-semibold"
                }}
              >
                {/* TAB 1: DATABASE & STORAGE */}
                <Tab
                  key="database"
                  title={
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      <span>Cơ sở dữ liệu & Lưu trữ</span>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-5 pt-3">
                    {/* Thẻ Vị trí Database Hiện Tại */}
                    <div className="app-card p-5 bg-content2/40 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                            <Folder className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-foreground">Vị trí lưu trữ Database (BYOS)</h4>
                            <p className="text-xs text-default-500">Tài khoản: <span className="font-semibold text-foreground">{accountName}</span></p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
                          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                          Đang hoạt động
                        </span>
                      </div>

                      {/* Path & Actions Bar */}
                      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                        {/* Path Display Box */}
                        <div className="flex-1 flex items-center gap-2 bg-content1 px-3 py-1.5 rounded-xl border border-divider min-h-9 h-9 min-w-0">
                          <span className="font-mono text-xs text-foreground truncate select-all flex-1" title={baseDir}>
                            {baseDir || 'Chưa thiết lập vị trí lưu trữ'}
                          </span>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={handleCopyPath}
                            title="Sao chép đường dẫn"
                            className="shrink-0 text-default-400 hover:text-foreground bg-transparent min-w-0 w-6 h-6 p-0"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                          </Button>
                        </div>

                        <Button
                          variant="flat"
                          size="sm"
                          onPress={handleOpenFolder}
                          startContent={<ExternalLink className="w-3.5 h-3.5" />}
                          className="font-medium text-xs rounded-xl h-9 px-3 shrink-0 bg-default-100 hover:bg-default-200 text-foreground"
                        >
                          Mở thư mục
                        </Button>

                        <Button
                          color="primary"
                          variant="solid"
                          size="sm"
                          isLoading={isChangingDir}
                          onPress={handleSelectNewDirectory}
                          startContent={!isChangingDir && <FolderOpen className="w-3.5 h-3.5" />}
                          className="font-medium text-xs rounded-xl h-9 px-3.5 shrink-0"
                        >
                          Chọn thư mục khác
                        </Button>
                      </div>
                    </div>

                    {/* Pending Confirmation Box khi người dùng vừa chọn folder mới */}
                    {pendingDir && (
                      <div className="p-4 rounded-xl border-2 border-warning/40 bg-warning/10 flex flex-col gap-3 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 text-warning font-semibold text-sm">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Xác nhận chuyển vị trí Database sang thư mục mới:</span>
                        </div>
                        
                        <div className="font-mono text-xs bg-content1/80 p-2.5 rounded-lg border border-warning/30 break-all text-foreground select-all">
                          {pendingDir}
                        </div>

                        <p className="text-xs text-default-500">
                          Ứng dụng sẽ lưu cài đặt và tự động khởi động lại để đọc toàn bộ dữ liệu từ thư mục mới này.
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            color="warning"
                            size="sm"
                            variant="solid"
                            onPress={() => handleConfirmSwitch(pendingDir)}
                            startContent={<RefreshCw className="w-3.5 h-3.5" />}
                            className="font-semibold text-xs rounded-lg"
                          >
                            Xác nhận & Khởi động lại
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => setPendingDir(null)}
                            className="text-xs rounded-lg"
                          >
                            Huỷ bỏ
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Danh sách Vaults/Tài khoản đã lưu (nếu có > 1) */}
                    {accounts.length > 1 && (
                      <div className="flex flex-col gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-default-500">
                          Danh sách Vaults đã đăng ký ({accounts.length})
                        </h4>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                          {accounts.map(acc => {
                            const isCurrent = acc.path === baseDir;
                            return (
                              <div 
                                key={acc.id}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                                  isCurrent ? 'bg-primary/5 border-primary/40' : 'bg-content2/30 border-divider hover:bg-content2/60'
                                }`}
                              >
                                <div className="flex flex-col min-w-0 pr-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs text-foreground">{acc.name}</span>
                                    {isCurrent && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">Hiện tại</span>
                                    )}
                                  </div>
                                  <span className="font-mono text-[11px] text-default-500 truncate">{acc.path}</span>
                                </div>

                                {!isCurrent && (
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    onPress={() => {
                                      localStorage.setItem('account_name', acc.name);
                                      handleConfirmSwitch(acc.path);
                                    }}
                                    className="shrink-0 text-xs h-7 px-3 rounded-lg"
                                  >
                                    Chuyển
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Dọn dẹp bộ nhớ ảnh mồ côi (Media Cleaner) */}
                    <div className="app-card p-5 bg-content2/30 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-foreground">Dọn dẹp tệp tin & Ảnh thừa</h4>
                            <p className="text-xs text-default-500">Tự động xoá ảnh không còn liên kết với công thức hay mẹo nào</p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          color="secondary"
                          variant="flat"
                          isLoading={isCleaning}
                          onPress={handlePruneImages}
                          startContent={!isCleaning && <Trash2 className="w-3.5 h-3.5" />}
                          className="font-medium text-xs rounded-xl h-8 px-4 shrink-0"
                        >
                          Dọn dẹp ngay
                        </Button>
                      </div>

                      {cleanResult && (
                        <div className="flex items-center gap-2 text-xs text-success bg-success/10 p-3 rounded-xl border border-success/30">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          <span>
                            Đã dọn {cleanResult.deletedCount} ảnh mồ côi, {cleanResult.tempFilesCleaned} file tạm (giải phóng {(cleanResult.freedBytes / (1024 * 1024)).toFixed(2)} MB).
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Tab>

                {/* TAB 2: APPEARANCE & LANGUAGE */}
                <Tab
                  key="appearance"
                  title={
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      <span>Giao diện & Ngôn ngữ</span>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-6 pt-3">
                    {/* Theme Selector */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-default-500 mb-3">
                        {t('Theme')}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setTheme('light')}
                          className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border text-center transition-all ${
                            theme === 'light'
                              ? 'border-2 border-primary bg-primary/10 text-primary shadow-sm'
                              : 'border-divider bg-content2/40 text-default-600 hover:border-default-400'
                          }`}
                        >
                          <Sun className="w-6 h-6" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{t('Light')}</span>
                            <span className="text-[11px] text-default-400">Sáng & Tương phản</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTheme('dark')}
                          className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border text-center transition-all ${
                            theme === 'dark'
                              ? 'border-2 border-primary bg-primary/10 text-primary shadow-sm'
                              : 'border-divider bg-content2/40 text-default-600 hover:border-default-400'
                          }`}
                        >
                          <Moon className="w-6 h-6" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{t('Dark')}</span>
                            <span className="text-[11px] text-default-400">Bảo vệ mắt ban đêm</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTheme('system')}
                          className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border text-center transition-all ${
                            theme === 'system'
                              ? 'border-2 border-primary bg-primary/10 text-primary shadow-sm'
                              : 'border-divider bg-content2/40 text-default-600 hover:border-default-400'
                          }`}
                        >
                          <Monitor className="w-6 h-6" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{t('System')}</span>
                            <span className="text-[11px] text-default-400">Theo hệ điều hành</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Language Selector */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-default-500 mb-3">
                        {t('Language')}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => i18n.changeLanguage('vi')}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                            i18n.language.startsWith('vi')
                              ? 'border-2 border-primary bg-primary/10 text-primary'
                              : 'border-divider bg-content2/40 text-default-600 hover:border-default-400'
                          }`}
                        >
                          <span className="text-2xl">🇻🇳</span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold">Tiếng Việt</span>
                            <span className="text-[11px] text-default-400">Mặc định</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => i18n.changeLanguage('en')}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                            i18n.language.startsWith('en')
                              ? 'border-2 border-primary bg-primary/10 text-primary'
                              : 'border-divider bg-content2/40 text-default-600 hover:border-default-400'
                          }`}
                        >
                          <span className="text-2xl">🇺🇸</span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold">English (US)</span>
                            <span className="text-[11px] text-default-400">International</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </Tab>

                {/* TAB 3: ABOUT */}
                <Tab
                  key="info"
                  title={
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      <span>Thông tin</span>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-4 pt-3">
                    <div className="app-card p-5 bg-content2/40 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                        <img src="/logo.svg" alt="Apron Logo" className="w-8 h-8" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-bold text-base text-foreground">Apron Cookbook Desktop</h3>
                        <p className="text-xs text-default-500">Phiên bản v1.0.0 Desktop • Bản quyền 2026</p>
                      </div>
                    </div>

                    <div className="text-xs text-default-600 leading-relaxed space-y-2 p-4 rounded-xl bg-content2/20 border border-divider">
                      <p>
                        <strong>Kiến trúc Local-First:</strong> Dữ liệu công thức nấu ăn, mẹo vặt và kế hoạch được lưu trữ 100% trên thiết bị của bạn. Bạn sở hữu hoàn toàn dữ liệu và có thể đồng bộ dễ dàng qua thư mục được chia sẻ (Google Drive, Dropbox, Syncthing, OneDrive, v.v.).
                      </p>
                      <p>
                        <strong>Phím tắt nhanh:</strong> Nhấn <kbd className="px-1.5 py-0.5 bg-content1 border border-divider rounded text-[11px] font-mono">Ctrl + B</kbd> để bật/tắt thu gọn thanh điều hướng bên trái.
                      </p>
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>

            <ModalFooter className="flex items-center justify-between">
              <span className="text-[11px] text-default-400">
                Apron Local-First Storage
              </span>
              <Button 
                color="primary" 
                variant="flat" 
                onPress={onClose} 
                className="rounded-xl px-5 h-9 font-semibold text-xs"
              >
                {t('Close')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
