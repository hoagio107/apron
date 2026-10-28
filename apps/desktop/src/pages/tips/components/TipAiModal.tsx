import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Textarea, 
  Tabs, 
  Tab, 
  Chip,
  toast 
} from '@/ui';
import { 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  ClipboardPaste, 
  RotateCcw,
  FileText,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { buildTipPrompt, parseTipGeminiResponse, type ParseTipResult } from '../../../lib/gemini';
import { TIP_CATEGORIES } from '@apron/core';

interface TipAiModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialTopic?: string;
  onApply: (data: ParseTipResult) => void;
}

export function TipAiModal({ isOpen, onOpenChange, initialTopic = '', onApply }: TipAiModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'prompt' | 'result'>('prompt');
  const [inputText, setInputText] = useState(initialTopic);
  const [resultText, setResultText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParseTipResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTopic) setInputText(initialTopic);
      setCopied(false);
      setError(null);
    }
  }, [isOpen, initialTopic]);

  const generatedPrompt = useMemo(() => {
    return buildTipPrompt(inputText);
  }, [inputText]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      toast.success(t('tips.aiModal.copiedPrompt'));
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = generatedPrompt;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      toast.success('Đã sao chép Prompt!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenGemini = () => {
    window.open('https://gemini.google.com/app', '_blank', 'noopener,noreferrer');
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setResultText(text);
        handleParse(text);
      } else {
        toast.info(t('tips.aiModal.emptyClipboard'));
      }
    } catch {
      toast.error(t('tips.aiModal.cannotReadClipboard'));
    }
  };

  const handleParse = (textToParse?: string) => {
    const text = textToParse !== undefined ? textToParse : resultText;
    if (!text.trim()) {
      setError('Vui lòng dán kết quả từ Gemini Web.');
      setParsedData(null);
      return;
    }

    try {
      setError(null);
      const parsed = parseTipGeminiResponse(text);
      setParsedData(parsed);
      toast.success(t('tips.aiModal.extractSuccess'));
    } catch (err: any) {
      setError(err.message || 'Lỗi khi phân tích dữ liệu JSON.');
      setParsedData(null);
    }
  };

  const handleApplyTip = (onClose: () => void) => {
    if (!parsedData) return;
    onApply(parsedData);
    toast.success(t('tips.aiModal.appliedSuccess'));
    onClose();
    setInputText('');
    setResultText('');
    setParsedData(null);
    setError(null);
    setActiveTab('prompt');
  };

  const matchedCategory = useMemo(() => {
    if (!parsedData?.category_id) return null;
    return TIP_CATEGORIES.find(c => c.id === parsedData.category_id) || null;
  }, [parsedData]);

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange} 
      size="3xl" 
      scrollBehavior="inside"
      classNames={{
        wrapper: "z-[200]",
        base: "bg-content1 rounded-2xl max-h-[90vh] shadow-2xl overflow-hidden",
        header: "border-b border-divider/40 px-6 py-4 shrink-0",
        body: "p-6 overflow-y-auto space-y-5",
        footer: "border-t border-divider/40 px-6 py-3.5 shrink-0 flex items-center justify-between gap-3 bg-content1"
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-3 px-6 py-4 border-b border-divider/40 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="text-base sm:text-lg font-bold text-foreground">{t('tips.aiModal.title')}</h3>
                <p className="text-xs text-default-400 font-normal">Tự động gợi ý & chuẩn hóa mẹo nhà bếp khoa học từ Gemini Web</p>
              </div>
            </ModalHeader>

            {/* Tabs */}
            <div className="px-6 pt-2 border-b border-divider/40 shrink-0 bg-content1">
              <Tabs 
                selectedKey={activeTab} 
                onSelectionChange={(k) => setActiveTab(k as 'prompt' | 'result')}
                color="primary"
                variant="underlined"
                classNames={{
                  tabList: "gap-6 p-0 border-none w-full",
                  tab: "h-11 px-1 font-semibold text-sm",
                  cursor: "w-full bg-primary"
                }}
              >
                <Tab key="prompt" title={t('tips.aiModal.promptTab')} />
                <Tab 
                  key="result" 
                  title={
                    <div className="flex items-center gap-2">
                      <span>{t('tips.aiModal.resultTab')}</span>
                      {parsedData && <span className="w-2 h-2 rounded-full bg-success" />}
                    </div>
                  } 
                />
              </Tabs>
            </div>

            <ModalBody className="p-6">
              {/* TAB 1: TẠO PROMPT */}
              {activeTab === 'prompt' && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        {t('tips.aiModal.topicLabel')}
                      </label>
                      {inputText.trim() && (
                        <button
                          type="button"
                          onClick={() => setInputText('')}
                          className="text-xs text-default-400 hover:text-danger flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Xóa
                        </button>
                      )}
                    </div>

                    <Textarea
                      placeholder={t('tips.aiModal.topicPlaceholder')}
                      value={inputText}
                      onValueChange={setInputText}
                      minRows={4}
                      maxRows={7}
                      variant="flat"
                      classNames={{
                        inputWrapper: "bg-default-100 hover:bg-default-200 border-none rounded-2xl shadow-none p-3.5",
                        input: "text-sm text-foreground leading-relaxed"
                      }}
                    />
                    <p className="text-xs text-default-400">
                      * Nhập chủ đề bạn quan tâm hoặc để trống để AI tự đề xuất mẹo ngẫu nhiên hữu ích nhất.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      color="primary"
                      className="h-11 rounded-xl font-bold shadow-none text-white"
                      startContent={copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                      onPress={handleCopyPrompt}
                    >
                      {copied ? t('tips.aiModal.copiedPrompt') : t('tips.aiModal.copyPrompt')}
                    </Button>

                    <Button
                      variant="flat"
                      color="secondary"
                      className="h-11 rounded-xl font-semibold shadow-none bg-secondary/15 text-secondary hover:bg-secondary/25"
                      startContent={<ExternalLink className="w-4 h-4" />}
                      onPress={handleOpenGemini}
                    >
                      {t('tips.aiModal.openGemini')}
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 2: DÁN KẾT QUẢ & ĐIỀN FORM */}
              {activeTab === 'result' && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <ClipboardPaste className="w-4 h-4 text-primary" />
                        {t('tips.aiModal.pasteResultLabel')}
                      </label>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          startContent={<ClipboardPaste className="w-3.5 h-3.5" />}
                          onPress={handlePasteClipboard}
                          className="h-8 text-xs font-semibold rounded-lg"
                        >
                          Dán từ bộ nhớ tạm
                        </Button>
                        {resultText && (
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => {
                              setResultText('');
                              setParsedData(null);
                              setError(null);
                            }}
                            className="h-8 text-xs font-semibold rounded-lg"
                          >
                            Xóa
                          </Button>
                        )}
                      </div>
                    </div>

                    <Textarea
                      placeholder="Dán toàn bộ câu trả lời từ Gemini vào đây (chứa mã JSON {...})..."
                      value={resultText}
                      onValueChange={(val) => {
                        setResultText(val);
                        if (val.trim()) handleParse(val);
                        else {
                          setParsedData(null);
                          setError(null);
                        }
                      }}
                      minRows={4}
                      maxRows={8}
                      variant="flat"
                      classNames={{
                        inputWrapper: "bg-default-100 hover:bg-default-200 border-none rounded-2xl shadow-none p-3.5 font-mono text-xs",
                        input: "text-foreground leading-relaxed"
                      }}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-danger/10 dark:bg-danger/20 dark:bg-danger-900/20 text-danger border border-danger-200 dark:border-danger-800/40 rounded-xl text-xs flex items-center gap-2">
                      <span>⚠️ {error}</span>
                    </div>
                  )}

                  {/* KẾT QUẢ TRÍCH XUẤT THÀNH CÔNG */}
                  {parsedData && (
                    <div className="flex flex-col gap-3 p-4 bg-default-50 dark:bg-default-100/10 rounded-2xl border border-divider/60 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-success flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> {t('tips.aiModal.validResult')}
                        </span>
                        {matchedCategory && (
                          <Chip size="sm" variant="flat" color="primary" className="font-semibold text-xs">
                            {matchedCategory.name}
                          </Chip>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <h4 className="font-bold text-foreground text-base">
                          {parsedData.title}
                        </h4>
                        <div 
                          className="text-xs text-default-600 line-clamp-4 prose dark:prose-invert max-w-none pt-1 border-t border-divider/40"
                          dangerouslySetInnerHTML={{ __html: parsedData.content }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ModalBody>

            <ModalFooter className="px-6 py-3.5 border-t border-divider/40 flex items-center justify-between bg-content1 shrink-0">
              <Button 
                variant="flat" 
                onPress={onClose}
                className="rounded-xl px-5 font-semibold text-foreground bg-default-100 hover:bg-default-200 shadow-none h-10"
              >
                Hủy
              </Button>

              <div className="flex items-center gap-2">
                {activeTab === 'prompt' ? (
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={() => setActiveTab('result')}
                    className="rounded-xl px-5 font-bold h-10"
                  >
                    {t('tips.aiModal.step2Next')}
                  </Button>
                ) : (
                  <Button
                    color="primary"
                    variant="solid"
                    isDisabled={!parsedData}
                    startContent={<Lightbulb className="w-4 h-4" />}
                    onPress={() => handleApplyTip(onClose)}
                    className="rounded-xl px-5 font-bold shadow-none text-white h-10 disabled:opacity-50"
                  >
                    Điền vào mẹo vặt
                  </Button>
                )}
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
