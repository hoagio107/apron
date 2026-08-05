import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  RadioGroup,
  Radio
} from "@apron/ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

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
            <ModalHeader className="flex flex-col gap-1">
              {t("Settings")}
            </ModalHeader>
            <ModalBody className="gap-6 py-4">
              
              {/* Theme Settings */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                  {t("Appearance")}
                </h3>
                <RadioGroup
                  value={theme}
                  onValueChange={setTheme}
                  orientation="horizontal"
                >
                  <Radio value="light">{t("Light")}</Radio>
                  <Radio value="dark">{t("Dark")}</Radio>
                  <Radio value="system">{t("System")}</Radio>
                </RadioGroup>
              </div>

              {/* Language Settings */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                  {t("Language")}
                </h3>
                <RadioGroup
                  value={i18n.language.split('-')[0]} // e.g. en-US -> en
                  onValueChange={(val) => i18n.changeLanguage(val)}
                  orientation="horizontal"
                >
                  <Radio value="en">English</Radio>
                  <Radio value="vi">Tiếng Việt</Radio>
                </RadioGroup>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" variant="solid" onPress={onClose}>
                {t('Close')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
