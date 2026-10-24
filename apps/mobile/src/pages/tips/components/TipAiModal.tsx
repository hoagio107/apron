import { useState, useMemo, useEffect } from 'react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerBody, 
  DrawerFooter, 
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
  AlertTriangle, 
  RotateCcw,
  FileText,
  ArrowRight
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
      toast.success('Đã sao chép Prompt!');
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
        toast.info('Bộ nhớ tạm trống');
      }
    } catch {
      toast.error('Không thể đọc bộ nhớ tạm. Vui lòng dán thủ công.');
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
      toast.success('Đã trích xuất mẹo thành công!');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi phân tích dữ liệu JSON.');
      setParsedData(null);
    }
  };

  const handleApplyTip = (onClose: () => void) => {
    if (!parsedData) return;
    onApply(parsedData);
    toast.success('Đã điền thông tin mẹo vào form!');
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
    <Drawer 
      isOpen={isOpen} 
      onOpenChange={onOpenChange} 
      placement="bottom"
      size="2xl" 
      classNames={{
        wrapper: "z-[200]",
        base: "rounded-t-3xl rounded-b-none m-0 sm:m-auto sm:rounded-3xl max-h-[90vh] sm:max-h-[85vh] bg-content1 border-t sm:border border-divider/40 sm:max-w-xl mx-auto shadow-2xl",
        header: "border-b border-divider/40 px-5 py-4 shrink-0",
        body: "p-5 overflow-y-auto space-y-4",
        footer: "border-t border-divider/40 px-5 py-3.5 shrink-0 flex items-center gap-3 bg-content1"
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex items-center gap-3 px-5 py-4 border-b border-divider/40 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="text-base sm:text-lg font-bold text-foreground">Trợ lý AI Mẹo vặt</h3>
                <p className="text-xs text-default-400 font-normal">Tự động trích xuất mẹo nhà bếp từ Gemini Web</p>
              </div>
            </DrawerHeader>

            {/* Tabs */}
            <div className="px-5 pt-2 border-b border-divider/40 shrink-0">
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
                <Tab key="prompt" title="1. Lấy Prompt gửi Gemini" />
                <Tab 
                  key="result" 
                  title={
                    <div className="flex items-center gap-2">
                      <span>2. Nhập kết quả</span>
                      {parsedData && <span className="w-2 h-2 rounded-full bg-success" />}
                    </div>
                  } 
                />
              </Tabs>
            </div>

            <DrawerBody className="p-5">
              {/* TAB 1: TẠO PROMPT */}
              {activeTab === 'prompt' && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Chủ đề hoặc nội dung mẹo vặt:
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
                      placeholder="Ví dụ: Cách giữ bơ tươi lâu không thâm, Mẹo ướp thịt mềm mọng... (hoặc để trống để AI tự gợi ý)"
                      value={inputText}
                      onValueChange={setInputText}
                      minRows={5}
                      maxRows={9}
                      variant="flat"
                      classNames={{
                        inputWrapper: "bg-default-100 hover:bg-default-200/70 dark:bg-default-100/20 border border-divider/50 rounded-2xl shadow-none p-3.5",
                        input: "text-sm text-foreground leading-relaxed"
                      }}
                    />
                  </div>

                  {/* 2 buttons with exact same width (50% each), height h-12, radius rounded-xl */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Button
                      color="primary"
                      className="h-12 rounded-xl font-bold shadow-none text-white"
                      startContent={copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                      onPress={handleCopyPrompt}
                    >
                      {copied ? 'Đã chép Prompt' : 'Sao chép Prompt'}
                    </Button>

                    <Button
                      variant="flat"
                      color="secondary"
                      className="h-12 rounded-xl font-semibold shadow-none"
                      startContent={<ExternalLink className="w-4 h-4" />}
                      onPress={handleOpenGemini}
                    >
                      Mở Gemini Web
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
                        Dán kết quả từ Gemini Web:
                      </label>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          color="secondary"
                          className="h-8 text-xs font-semibold rounded-lg shadow-none"
                          startContent={<ClipboardPaste className="w-3.5 h-3.5" />}
                          onPress={handlePasteClipboard}
                        >
                          Dán Clipboard
                        </Button>
                        {resultText && (
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            className="h-8 text-xs font-semibold rounded-lg"
                            onPress={() => {
                              setResultText('');
                              setParsedData(null);
                            }}
                          >
                            Xóa
                          </Button>
                        )}
                      </div>
                    </div>

                    <Textarea
                      placeholder="Dán toàn bộ kết quả phản hồi từ Gemini vào đây..."
                      value={resultText}
                      onValueChange={(val) => {
                        setResultText(val);
                        if (val.trim().startsWith('{') || val.includes('"title"') || val.includes('```json')) {
                          handleParse(val);
                        }
                      }}
                      minRows={6}
                      maxRows={10}
                      variant="flat"
                      classNames={{
                        inputWrapper: "bg-default-100 hover:bg-default-200/70 dark:bg-default-100/20 border border-divider/50 rounded-2xl shadow-none p-3.5 font-mono",
                        input: "text-xs font-mono leading-relaxed"
                      }}
                    />

                    {!parsedData && (
                      <Button
                        color="primary"
                        variant="flat"
                        className="w-full h-12 rounded-xl font-semibold shadow-none mt-1"
                        startContent={<Sparkles className="w-4 h-4" />}
                        onPress={() => handleParse()}
                      >
                        Trích xuất dữ liệu
                      </Button>
                    )}
                  </div>

                  {error && (
                    <div className="p-3 bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-900/50 text-danger-700 dark:text-danger-300 rounded-xl flex items-start gap-2.5 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1">{error}</div>
                    </div>
                  )}

                  {/* PREVIEW KẾT QUẢ */}
                  {parsedData && (
                    <div className="flex flex-col border border-success-200 dark:border-success-900/50 rounded-2xl overflow-hidden bg-success-50/20 dark:bg-success-950/10">
                      <div className="bg-success-100/60 dark:bg-success-900/30 px-4 py-2.5 border-b border-success-200 dark:border-success-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-success-600 dark:text-success-400" />
                          <h4 className="font-bold text-sm text-success-800 dark:text-success-200">
                            Đã trích xuất thành công
                          </h4>
                        </div>
                        {matchedCategory && (
                          <Chip size="sm" color="success" variant="flat" className="font-semibold text-xs">
                            {matchedCategory.name}
                          </Chip>
                        )}
                      </div>

                      <div className="p-4 space-y-3 max-h-[260px] overflow-y-auto">
                        <div>
                          <span className="font-semibold text-default-400 uppercase tracking-wider text-[10px] block">
                            Tiêu đề:
                          </span>
                          <h5 className="font-bold text-base text-foreground mt-0.5">
                            {parsedData.title}
                          </h5>
                        </div>

                        <div>
                          <span className="font-semibold text-default-400 uppercase tracking-wider text-[10px] block mb-1">
                            Nội dung hướng dẫn:
                          </span>
                          <div 
                            className="p-3 bg-content1 rounded-xl border border-divider text-xs text-foreground/90 leading-relaxed max-h-36 overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: parsedData.content }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DrawerBody>

            <DrawerFooter className="px-5 py-3.5 border-t border-divider/40 flex items-center gap-3 bg-content1 shrink-0">
              <Button 
                variant="flat" 
                className="flex-1 rounded-xl font-semibold h-12 border border-divider/60 text-foreground bg-default-100 hover:bg-default-200 shadow-none"
                onPress={onClose}
              >
                Đóng
              </Button>

              {activeTab === 'prompt' ? (
                <Button 
                  color="primary" 
                  className="flex-1 rounded-xl font-bold h-12 shadow-none text-white"
                  endContent={<ArrowRight className="w-4 h-4" />}
                  onPress={() => setActiveTab('result')}
                >
                  Nhập kết quả →
                </Button>
              ) : (
                <Button 
                  color="primary" 
                  className="flex-1 rounded-xl font-bold h-12 shadow-none text-white"
                  isDisabled={!parsedData}
                  onPress={() => handleApplyTip(onClose)}
                  startContent={<Check className="w-4 h-4" />}
                >
                  Áp dụng vào Form
                </Button>
              )}
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
