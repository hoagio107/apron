import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  RadioGroup,
  Radio,
  toast
} from "@/ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Palette, HardDrive, Trash2, Folder, CheckCircle } from "lucide-react";
import { ImageManager } from "../../lib/image-manager";
import { MediaCleaner, type CleanupResult } from "../../lib/media-cleaner";

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [baseDir, setBaseDir] = useState<string>('');
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<CleanupResult | null>(null);

  useEffect(() => {
    setMounted(true);
    ImageManager.getBaseDir().then(dir => setBaseDir(dir)).catch(() => {});
  }, []);

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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2 border-b border-divider/60 pb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Palette className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold">{t("Settings")}</span>
                <span className="text-xs text-default-500 font-normal">{t("Appearance")} &amp; {t("Storage")}</span>
              </div>
            </ModalHeader>
            <ModalBody className="py-5 px-6 flex flex-col gap-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-default-500 mb-3">{t('Theme')}</h3>
                <RadioGroup
                  value={theme}
                  onValueChange={setTheme}
                  orientation="horizontal"
                  className="gap-4"
                >
                  <Radio value="light">{t("Light")}</Radio>
                  <Radio value="dark">{t("Dark")}</Radio>
                  <Radio value="system">{t("System")}</Radio>
                </RadioGroup>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-default-500 mb-3">{t('Language')}</h3>
                <RadioGroup
                  value={i18n.language.split('-')[0]}
                  onValueChange={(val) => i18n.changeLanguage(val)}
                  orientation="horizontal"
                  className="gap-4"
                >
                  <Radio value="en">English (US)</Radio>
                  <Radio value="vi">Tiếng Việt</Radio>
                </RadioGroup>
              </div>

              {/* Dữ liệu & Bộ nhớ (Storage & GC) */}
              <div className="pt-2 border-t border-divider/60 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-default-700">Dữ liệu &amp; Bộ nhớ</h3>
                </div>

                {baseDir && (
                  <div className="bg-default-100/70 p-2.5 rounded-lg text-xs flex flex-col gap-1">
                    <span className="text-default-500 font-medium flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5" /> Vị trí database:
                    </span>
                    <span className="font-mono text-[11px] text-default-800 break-all select-all">
                      {baseDir}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-default-800">Dọn dẹp ảnh mồ côi</span>
                    <span className="text-[11px] text-default-500">Xoá file ảnh không còn được liên kết với bất kỳ công thức hay mẹo nào</span>
                  </div>
                  <Button
                    size="sm"
                    color="secondary"
                    variant="flat"
                    isLoading={isCleaning}
                    onPress={handlePruneImages}
                    startContent={!isCleaning && <Trash2 className="w-3.5 h-3.5" />}
                    className="shrink-0 text-xs font-medium"
                  >
                    Dọn dẹp
                  </Button>
                </div>

                {cleanResult && (
                  <div className="flex items-center gap-1.5 text-xs text-success bg-success-50/50 p-2 rounded-lg border border-success-200/50">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Đã dọn {cleanResult.deletedCount} ảnh mồ côi, {cleanResult.tempFilesCleaned} file tạm (giải phóng {(cleanResult.freedBytes / (1024 * 1024)).toFixed(2)} MB).
                    </span>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-divider/60 pt-3">
              <Button color="primary" variant="flat" onPress={onClose} className="rounded-xl px-5 h-10 font-semibold text-xs">
                {t('Close')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
