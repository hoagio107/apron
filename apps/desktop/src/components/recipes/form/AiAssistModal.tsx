import { useState, useEffect, useMemo } from 'react';
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
  Check, 
  Clock, 
  ChefHat, 
  AlertTriangle, 
  Copy, 
  ExternalLink, 
  ArrowRight, 
  ClipboardPaste, 
  RotateCcw,
  FileText
} from 'lucide-react';
import { type ParseRecipeResult, buildRecipePrompt, parseGeminiResponse } from '../../../lib/gemini';
import { useIngredientCatalogStore } from '../../../store/useIngredientCatalogStore';
import { useUnitStore } from '../../../store/useUnitStore';
import { useTipStore } from '../../../store/useTipStore';

interface AiAssistModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (data: ParseRecipeResult) => void;
  onApplyBulk?: (data: ParseRecipeResult[]) => void;
}

export function AiAssistModal({ isOpen, onOpenChange, onApply, onApplyBulk }: AiAssistModalProps) {
  const [activeTab, setActiveTab] = useState<'prompt' | 'result'>('prompt');
  const [inputText, setInputText] = useState('');
  const [resultText, setResultText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParseRecipeResult[] | null>(null);
  const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);
  
  const catalog = useIngredientCatalogStore(state => state.catalog);
  const units = useUnitStore(state => state.units);
  const { tips, fetchTips } = useTipStore();

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setError(null);
    }
  }, [isOpen]);

  const existingIngredients = useMemo(() => {
    return Object.values(catalog).map(ing => ing.name);
  }, [catalog]);

  const existingUnits = useMemo(() => {
    return units.map(u => u.name);
  }, [units]);

  const existingTips = useMemo(() => {
    return tips.map(t => ({ id: t.id, title: t.title }));
  }, [tips]);

  const generatedPrompt = useMemo(() => {
    return buildRecipePrompt(inputText, existingIngredients, existingTips, existingUnits);
  }, [inputText, existingIngredients, existingTips, existingUnits]);

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
    const raw = textToParse !== undefined ? textToParse : resultText;
    if (!raw.trim()) {
      setError('Vui lòng dán kết quả từ Gemini Web.');
      setParsedData(null);
      return;
    }

    try {
      setError(null);
      const results = parseGeminiResponse(raw);
      setParsedData(results);
      setActiveRecipeIndex(0);
      toast.success(`Đã trích xuất ${results.length} công thức!`);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi phân tích dữ liệu JSON.');
      setParsedData(null);
    }
  };

  const handleApply = (onClose: () => void) => {
    if (parsedData && parsedData.length > 0) {
      onApply(parsedData[activeRecipeIndex]);
      toast.success('Đã điền công thức vào form!');
      onClose();
      setInputText('');
      setResultText('');
      setParsedData(null);
      setError(null);
      setActiveTab('prompt');
    }
  };

  const _handleApplyAll = (onClose: () => void) => {
    if (parsedData && parsedData.length > 0 && onApplyBulk) {
      onApplyBulk(parsedData);
      toast.success(`Đã lưu ${parsedData.length} công thức!`);
      onClose();
      setInputText('');
      setResultText('');
      setParsedData(null);
      setError(null);
      setActiveTab('prompt');
    }
  };

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
                <h3 className="text-base sm:text-lg font-bold text-foreground">Trợ lý AI Công thức</h3>
                <p className="text-xs text-default-400 font-normal">Tự động trích xuất công thức từ Gemini Web</p>
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
                      {parsedData && parsedData.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-success" />
                      )}
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
                        Nội dung công thức thô hoặc link:
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
                      placeholder="Dán bài viết, danh sách nguyên liệu, ghi chú hoặc link món ăn vào đây..."
                      value={inputText}
                      onValueChange={setInputText}
                      minRows={6}
                      maxRows={10}
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
                        if (val.trim().startsWith('{') || val.includes('"recipes"') || val.includes('```json')) {
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
                  {parsedData && parsedData.length > 0 && (
                    <div className="flex flex-col border border-success-200 dark:border-success-900/50 rounded-2xl overflow-hidden bg-success-50/20 dark:bg-success-950/10">
                      <div className="bg-success-100/60 dark:bg-success-900/30 px-4 py-2.5 border-b border-success-200 dark:border-success-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-success-600 dark:text-success-400" />
                          <h4 className="font-bold text-sm text-success-800 dark:text-success-200">
                            Đã trích xuất thành công
                          </h4>
                        </div>
                        {parsedData.length > 1 && (
                          <Chip size="sm" color="success" variant="flat" className="font-semibold text-xs">
                            {parsedData.length} món ăn
                          </Chip>
                        )}
                      </div>

                      {/* Selector nếu có nhiều công thức */}
                      {parsedData.length > 1 && (
                        <div className="flex overflow-x-auto border-b border-success-200/60 bg-success-50/40 dark:bg-success-950/30 p-1.5 gap-1.5">
                          {parsedData.map((recipe, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveRecipeIndex(idx)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                                activeRecipeIndex === idx 
                                  ? 'bg-success text-white' 
                                  : 'text-success-700 dark:text-success-300 hover:bg-success-100 dark:hover:bg-success-900/40'
                              }`}
                            >
                              {recipe.title || `Món ${idx + 1}`}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="p-4 space-y-3 max-h-[260px] overflow-y-auto">
                        <div>
                          <h5 className="font-bold text-base text-foreground">
                            {parsedData[activeRecipeIndex].title || 'Chưa đặt tên'}
                          </h5>
                          {parsedData[activeRecipeIndex].description && (
                            <p className="text-xs text-default-500 mt-0.5 line-clamp-2">
                              {parsedData[activeRecipeIndex].description}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-default-600">
                          {parsedData[activeRecipeIndex].difficulty && (
                            <span className="inline-flex items-center gap-1 bg-content1 px-2.5 py-1 rounded-lg border border-divider text-xs">
                              <ChefHat className="w-3.5 h-3.5 text-primary" /> {parsedData[activeRecipeIndex].difficulty}
                            </span>
                          )}
                          {parsedData[activeRecipeIndex].prep_time_minutes !== undefined && (
                            <span className="inline-flex items-center gap-1 bg-content1 px-2.5 py-1 rounded-lg border border-divider text-xs">
                              <Clock className="w-3.5 h-3.5 text-warning-500" /> Sơ chế: {parsedData[activeRecipeIndex].prep_time_minutes}p
                            </span>
                          )}
                          {parsedData[activeRecipeIndex].cook_time_minutes !== undefined && (
                            <span className="inline-flex items-center gap-1 bg-content1 px-2.5 py-1 rounded-lg border border-divider text-xs">
                              <Clock className="w-3.5 h-3.5 text-success-500" /> Nấu: {parsedData[activeRecipeIndex].cook_time_minutes}p
                            </span>
                          )}
                        </div>

                        {/* Tóm tắt nguyên liệu */}
                        {parsedData[activeRecipeIndex].ingredientSections && (
                          <div className="text-xs text-default-600">
                            <span className="font-semibold text-default-500">Nguyên liệu: </span>
                            {parsedData[activeRecipeIndex].ingredientSections
                              ?.flatMap(s => s.ingredients.map(i => i.name))
                              .slice(0, 6)
                              .join(', ')}
                            {parsedData[activeRecipeIndex].ingredientSections?.reduce((acc, s) => acc + s.ingredients.length, 0) > 6 && '...'}
                          </div>
                        )}
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
                  isDisabled={!parsedData || parsedData.length === 0}
                  onPress={() => handleApply(onClose)}
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
