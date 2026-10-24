import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  RadioGroup,
  Radio
} from "@/ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Palette } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
                <span className="text-xs text-default-500 font-normal">{t("Appearance")}</span>
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
