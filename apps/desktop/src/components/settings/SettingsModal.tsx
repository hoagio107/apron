import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  RadioGroup,
  Radio,
  Tabs,
  Tab,
  Select,
  SelectItem,
  Input
} from "@apron/ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Palette, Sparkles, Check } from "lucide-react";
import { GEMINI_MODELS } from "../../lib/gemini";

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // AI Settings state
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [selectedGeminiModel, setSelectedGeminiModel] = useState(GEMINI_MODELS[0].name);
  const [aiSaved, setAiSaved] = useState(false);
  
  // Tabs state
  const [selectedTab, setSelectedTab] = useState("appearance");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('gemini_api_key') || '';
      const savedModel = localStorage.getItem('gemini_model') || GEMINI_MODELS[0].name;
      setGeminiApiKey(savedKey);
      setSelectedGeminiModel(savedModel);
      setAiSaved(false);
    }
  }, [isOpen]);

  const handleSaveAiSettings = () => {
    localStorage.setItem('gemini_api_key', geminiApiKey.trim());
    localStorage.setItem('gemini_model', selectedGeminiModel);
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2000);
  };

  if (!mounted) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {t("Settings")}
            </ModalHeader>
            <ModalBody className="py-2 px-0">
              <Tabs
                aria-label="Settings tabs"
                variant="underlined"
                selectedKey={selectedTab}
                onSelectionChange={(key) => setSelectedTab(key as string)}
                classNames={{
                  tabList: "px-4 border-b border-divider w-full gap-0",
                  tab: "h-10",
                  panel: "px-6 py-4"
                }}
              >
                {/* Tab: Giao diện */}
                <Tab
                  key="appearance"
                  title={
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      <span>{t('Appearance')}</span>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-default-700 mb-3">{t('Theme')}</h3>
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
                    <div>
                      <h3 className="text-sm font-semibold text-default-700 mb-3">{t('Language')}</h3>
                      <RadioGroup
                        value={i18n.language.split('-')[0]}
                        onValueChange={(val) => i18n.changeLanguage(val)}
                        orientation="horizontal"
                      >
                        <Radio value="en">English</Radio>
                        <Radio value="vi">Tiếng Việt</Radio>
                      </RadioGroup>
                    </div>
                  </div>
                </Tab>

                {/* Tab: AI */}
                <Tab
                  key="ai"
                  title={
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>AI</span>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-5">
                    <div>
                      <h3 className="text-sm font-semibold text-default-700 mb-1">Google Gemini</h3>
                      <p className="text-xs text-default-400 mb-4">
                        Lấy API Key miễn phí tại{' '}
                        <a
                          href="https://aistudio.google.com/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          Google AI Studio
                        </a>
                      </p>
                      <div className="flex flex-col gap-3">
                        <Select
                          label="Mô hình mặc định"
                          selectedKeys={[selectedGeminiModel]}
                          onChange={(e) => setSelectedGeminiModel(e.target.value)}
                          variant="flat"
                        >
                          {GEMINI_MODELS.map((m) => (
                            <SelectItem key={m.name}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </Select>
                        <Input
                          type="password"
                          label="Gemini API Key"
                          placeholder="AIza..."
                          value={geminiApiKey}
                          onValueChange={setGeminiApiKey}
                          variant="flat"
                          description="Key được lưu cục bộ trên thiết bị của bạn, không gửi lên server."
                        />
                      </div>
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>
            <ModalFooter className="flex justify-between items-center">
              <div>
                {selectedTab === "ai" && (
                  <Button
                    color="primary"
                    onPress={handleSaveAiSettings}
                    startContent={aiSaved ? <Check className="w-4 h-4" /> : undefined}
                  >
                    {aiSaved ? 'Đã lưu!' : 'Lưu cài đặt AI'}
                  </Button>
                )}
              </div>
              <Button color="primary" variant="light" onPress={onClose}>
                {t('Close')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
