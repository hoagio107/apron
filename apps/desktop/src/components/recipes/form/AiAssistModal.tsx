import { useState, useEffect, useMemo } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Button, 
  Textarea,
  Chip,
  Tooltip,
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
  ArrowLeft,
  ClipboardPaste, 
  FileText,
  X,
  HelpCircle,
  Utensils,
  Flame,
  Lightbulb,
  Trash2,
  Carrot,
  Timer
} from 'lucide-react';
import { type ParseRecipeResult, buildRecipePrompt, parseGeminiResponse } from '../../../lib/gemini';
import { sanitizeHtml } from '@apron/core';
import { extractAndNormalizeUnits } from '@apron/core';
import { useUnitStore } from '../../../store/useUnitStore';
import { useTipStore } from '../../../store/useTipStore';

interface AiAssistModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (data: ParseRecipeResult) => void;
  onApplyBulk?: (data: ParseRecipeResult[]) => void;
}

const STEPS = [
  { step: 1 as const, label: 'Tạo Prompt', tip: 'Soạn hoặc dán nội dung để tạo câu lệnh cho Gemini' },
  { step: 2 as const, label: 'Dán kết quả', tip: 'Dán phản hồi JSON từ Gemini Web và trích xuất dữ liệu' },
  { step: 3 as const, label: 'Xem trước & Áp dụng', tip: 'Xem chi tiết các công thức đã trích xuất và đưa vào form' }
];

export function AiAssistModal({ isOpen, onOpenChange, onApply, onApplyBulk }: AiAssistModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [inputText, setInputText] = useState('');
  const [resultText, setResultText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParseRecipeResult[] | null>(null);
  const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);
  
  const units = useUnitStore(state => state.units);
  const { tips, fetchTips } = useTipStore();

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setError(null);
      setCurrentStep(1);
    }
  }, [isOpen]);

  const existingUnits = useMemo(() => {
    return units.map(u => u.name);
  }, [units]);

  const existingTips = useMemo(() => {
    return tips.map(t => ({ id: t.id, title: t.title }));
  }, [tips]);

  const generatedPrompt = useMemo(() => {
    return buildRecipePrompt(inputText, [], existingTips, existingUnits);
  }, [inputText, existingTips, existingUnits]);

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
        setParsedData(null);
        setError(null);
        toast.success('Đã dán từ bộ nhớ tạm');
      } else {
        toast.info('Bộ nhớ tạm trống');
      }
    } catch {
      toast.error('Không thể đọc bộ nhớ tạm. Vui lòng dán thủ công.');
    }
  };

  const handleParse = (textToParse?: string, autoAdvance = true) => {
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
      if (autoAdvance) {
        setCurrentStep(3);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi phân tích dữ liệu JSON.');
      setParsedData(null);
    }
  };

  const handleApply = (onClose: () => void) => {
    if (parsedData && parsedData.length > 0) {
      const selected = parsedData[activeRecipeIndex];
      const unitsInRecipe = extractAndNormalizeUnits(selected);
      if (unitsInRecipe.length > 0) {
        useUnitStore.getState().ensureUnits(unitsInRecipe);
      }
      onApply(selected);
      toast.success(
        parsedData.length > 1
          ? `Đã điền món "${selected.title || `Món ${activeRecipeIndex + 1}`}" vào form!`
          : 'Đã điền công thức vào form!'
      );
      onClose();
      setInputText('');
      setResultText('');
      setParsedData(null);
      setError(null);
      setCurrentStep(1);
    }
  };

  const handleApplyAll = (onClose: () => void) => {
    if (parsedData && parsedData.length > 0) {
      const allUnits = extractAndNormalizeUnits(parsedData);
      if (allUnits.length > 0) {
        useUnitStore.getState().ensureUnits(allUnits);
      }
      if (onApplyBulk) {
        onApplyBulk(parsedData);
        toast.success(`Đã nạp ${parsedData.length} công thức vào form!`);
      } else {
        onApply(parsedData[0]);
        toast.success('Đã điền công thức vào form!');
      }
      onClose();
      setInputText('');
      setResultText('');
      setParsedData(null);
      setError(null);
      setCurrentStep(1);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange} 
      size="4xl" 
      scrollBehavior="inside"
      classNames={{
        wrapper: "z-[200]",
        base: "bg-content1 rounded-3xl max-h-[90vh] shadow-2xl border border-divider/40 overflow-hidden",
        header: "border-b border-divider/40 px-6 py-4 shrink-0",
        body: "p-6 overflow-y-auto space-y-4",
        footer: "border-t border-divider/40 px-6 py-3.5 shrink-0 flex items-center bg-content1"
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center justify-between px-6 py-4 border-b border-divider/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-foreground">Trợ lý AI Công thức</h3>
                    <Tooltip content="Hỗ trợ trích xuất tự động công thức nấu ăn từ Gemini Web vào Apron" placement="right">
                      <span className="cursor-help text-default-400 hover:text-default-600 transition-colors">
                        <HelpCircle className="w-3.5 h-3.5" />
                      </span>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-default-400 font-normal">Quy trình 3 bước thông minh với Gemini</p>
                </div>
              </div>

              {parsedData && parsedData.length > 0 && (
                <Chip size="sm" color="success" variant="flat" className="font-semibold text-xs">
                  {parsedData.length} món ăn
                </Chip>
              )}
            </ModalHeader>

            {/* Stepper Header */}
            <div className="px-6 py-3 border-b border-divider/40 bg-default-50/50 dark:bg-default-100/10 shrink-0">
              <div className="flex items-center justify-between max-w-xl mx-auto w-full">
                {STEPS.map((s, idx) => {
                  const isCompleted = s.step < currentStep || (s.step === 2 && Boolean(parsedData && parsedData.length > 0 && currentStep === 3));
                  const isActive = s.step === currentStep;
                  const isClickable = s.step <= currentStep || (s.step === 3 ? Boolean(parsedData && parsedData.length > 0) : true);

                  return (
                    <div key={s.step} className="flex items-center flex-1 last:flex-none">
                      <Tooltip content={s.tip} placement="bottom">
                        <button
                          type="button"
                          disabled={!isClickable}
                          onClick={() => setCurrentStep(s.step)}
                          className={`flex items-center gap-2.5 group transition-all text-left outline-none ${
                            !isClickable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-200 shrink-0 ${
                              isActive
                                ? 'bg-primary text-white shadow-xs ring-2 ring-primary/30 ring-offset-1 ring-offset-background'
                                : isCompleted
                                ? 'bg-success text-white'
                                : 'bg-default-100 dark:bg-default-200/40 text-default-500 border border-divider/60'
                            }`}
                          >
                            {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.step}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-xs font-semibold leading-tight ${
                              isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-default-400'
                            }`}>
                              {s.label}
                            </span>
                            <span className="text-[10px] text-default-400 font-normal">
                              Bước {s.step}
                            </span>
                          </div>
                        </button>
                      </Tooltip>

                      {idx < STEPS.length - 1 && (
                        <div className="flex-1 mx-3 sm:mx-4 h-[2px] bg-default-200 dark:bg-default-100/30 relative overflow-hidden rounded-full min-w-[24px]">
                          <div
                            className={`absolute inset-y-0 left-0 bg-primary transition-all duration-300 ${
                              currentStep > s.step ? 'w-full' : 'w-0'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <ModalBody className="p-6">
              {/* STEP 1: TẠO PROMPT */}
              {currentStep === 1 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>Nội dung công thức hoặc link</span>
                        <Tooltip content="Dán văn bản công thức thô, danh sách nguyên liệu hoặc link để tạo prompt chuẩn" placement="top">
                          <span className="cursor-help text-default-400 hover:text-default-600 transition-colors">
                            <HelpCircle className="w-3.5 h-3.5" />
                          </span>
                        </Tooltip>
                      </label>
                      <div className="flex items-center gap-1">
                        <Tooltip content="Dán từ bộ nhớ tạm" placement="top">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="text-default-400 hover:text-default-600 dark:hover:text-default-200 min-w-8 w-8 h-8 rounded-lg"
                            onPress={async () => {
                              try {
                                const text = await navigator.clipboard.readText();
                                if (text) {
                                  setInputText(text);
                                  toast.success('Đã dán từ bộ nhớ tạm');
                                } else {
                                  toast.info('Bộ nhớ tạm trống');
                                }
                              } catch {
                                toast.error('Không thể đọc bộ nhớ tạm.');
                              }
                            }}
                          >
                            <ClipboardPaste className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        {inputText.trim() && (
                          <Tooltip content="Xóa nội dung" placement="top">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="text-default-400 hover:text-default-600 dark:hover:text-default-200 min-w-8 w-8 h-8 rounded-lg"
                              onPress={() => setInputText('')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    <Textarea
                      placeholder="Dán bài viết, ghi chú, nguyên liệu hoặc link món ăn vào đây..."
                      value={inputText}
                      onValueChange={setInputText}
                      minRows={7}
                      maxRows={10}
                      variant="flat"
                      classNames={{
                        inputWrapper: "bg-default-100/70 hover:bg-default-100 dark:bg-default-100/20 border border-divider/50 rounded-2xl shadow-none p-3.5",
                        input: "text-sm text-foreground leading-relaxed"
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Tooltip content="Sao chép prompt đã chuẩn hóa kèm danh mục gia vị và mẹo sẵn có" placement="top">
                      <Button
                        color="primary"
                        className="h-12 rounded-xl font-bold shadow-none text-white"
                        startContent={copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                        onPress={handleCopyPrompt}
                      >
                        {copied ? 'Đã chép Prompt' : 'Sao chép Prompt'}
                      </Button>
                    </Tooltip>

                    <Tooltip content="Mở Gemini Web trong tab mới để gửi prompt và nhận phản hồi JSON" placement="top">
                      <Button
                        variant="flat"
                        color="secondary"
                        className="h-12 rounded-xl font-semibold shadow-none"
                        startContent={<ExternalLink className="w-4 h-4" />}
                        onPress={handleOpenGemini}
                      >
                        Mở Gemini Web
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              )}

              {/* STEP 2: DÁN KẾT QUẢ */}
              {currentStep === 2 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <ClipboardPaste className="w-4 h-4 text-primary" />
                        <span>Dán phản hồi từ Gemini Web</span>
                        <Tooltip content="Dán toàn bộ khối mã JSON trả về từ Gemini Web vào đây" placement="top">
                          <span className="cursor-help text-default-400 hover:text-default-600 transition-colors">
                            <HelpCircle className="w-3.5 h-3.5" />
                          </span>
                        </Tooltip>
                      </label>
                      <div className="flex items-center gap-1">
                        <Tooltip content="Dán từ bộ nhớ tạm" placement="top">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="text-default-400 hover:text-default-600 dark:hover:text-default-200 min-w-8 w-8 h-8 rounded-lg"
                            onPress={handlePasteClipboard}
                          >
                            <ClipboardPaste className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        {resultText && (
                          <Tooltip content="Xóa nội dung" placement="top">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="text-default-400 hover:text-default-600 dark:hover:text-default-200 min-w-8 w-8 h-8 rounded-lg"
                              onPress={() => {
                                setResultText('');
                                setParsedData(null);
                                setError(null);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    <Textarea
                      placeholder="Dán toàn bộ kết quả phản hồi từ Gemini vào đây..."
                      value={resultText}
                      onValueChange={(val) => {
                        setResultText(val);
                        setParsedData(null);
                        if (error) setError(null);
                      }}
                      minRows={8}
                      maxRows={14}
                      variant="flat"
                      classNames={{
                        inputWrapper: "bg-default-100/70 hover:bg-default-100 dark:bg-default-100/20 border border-divider/50 rounded-2xl shadow-none p-3.5 font-mono",
                        input: "text-xs font-mono leading-relaxed"
                      }}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-danger/10 dark:bg-danger/20 dark:bg-danger/20 border border-danger-200 dark:border-danger-900/50 text-danger-700 dark:text-danger-300 rounded-xl flex items-start gap-2.5 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1 font-medium">{error}</div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: XEM TRƯỚC & ÁP DỤNG */}
              {currentStep === 3 && (
                <div className="flex flex-col gap-5">
                  {(!parsedData || parsedData.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-default-100 flex items-center justify-center text-default-400 mb-3">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Chưa có công thức nào được trích xuất</p>
                      <p className="text-xs text-default-400 mt-1 mb-4">Vui lòng quay lại bước 2 để dán phản hồi JSON từ Gemini</p>
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        startContent={<ArrowLeft className="w-4 h-4" />}
                        onPress={() => setCurrentStep(2)}
                        className="rounded-xl font-semibold"
                      >
                        Quay lại bước 2
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Bộ chọn món ăn nếu trích xuất nhiều món */}
                      {parsedData.length > 1 && (
                        <div className="flex flex-col gap-2 pb-3 border-b border-divider/40">
                          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-default-500 px-0.5">
                            <span>Công thức ({activeRecipeIndex + 1}/{parsedData.length})</span>
                            <span className="text-xs text-default-400 font-normal">Chọn món để xem trước</span>
                          </div>
                          <div className="flex overflow-x-auto gap-2 py-0.5 no-scrollbar items-center">
                            {parsedData.map((recipe, idx) => {
                              const isActive = activeRecipeIndex === idx;
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm transition-all cursor-pointer select-none ${
                                    isActive 
                                      ? 'bg-primary text-white font-semibold shadow-xs' 
                                      : 'bg-default-100/70 hover:bg-default-200/70 text-default-600 font-medium'
                                  }`}
                                  onClick={() => setActiveRecipeIndex(idx)}
                                >
                                  <span className="max-w-[180px] truncate">
                                    {idx + 1}. {recipe.title || `Món ${idx + 1}`}
                                  </span>
                                  {parsedData.length > 1 && (
                                    <Tooltip content="Loại bỏ món này" placement="top">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const nextList = parsedData.filter((_, i) => i !== idx);
                                          setParsedData(nextList);
                                          if (activeRecipeIndex >= nextList.length) {
                                            setActiveRecipeIndex(Math.max(0, nextList.length - 1));
                                          }
                                          toast.info(`Đã loại bỏ "${recipe.title || `Món ${idx + 1}`}"`);
                                        }}
                                        className={`p-0.5 rounded-full hover:bg-black/20 transition-colors ${
                                          isActive ? 'text-white' : 'text-default-400 hover:text-danger'
                                        }`}
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </Tooltip>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Chi tiết công thức đang chọn */}
                      {parsedData[activeRecipeIndex] && (() => {
                        const cur = parsedData[activeRecipeIndex];
                        const totalIngs = cur.ingredientSections?.reduce((acc, s) => acc + (s.ingredients?.length || 0), 0) || 0;
                        const steps = cur.stepSections?.flatMap(s => s.steps) || [];

                        return (
                          <div className="flex flex-col gap-5">
                            {/* Tiêu đề & Thông tin tổng quan */}
                            <div className="flex flex-col gap-2.5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                                    {cur.title || 'Chưa đặt tên món'}
                                  </h3>
                                  {cur.description && (
                                    <p className="text-sm sm:text-base text-default-600 dark:text-default-400 mt-1.5 leading-relaxed">
                                      {cur.description}
                                    </p>
                                  )}
                                </div>
                                {parsedData.length === 1 && (
                                  <Chip size="sm" color="success" variant="flat" className="font-semibold text-xs shrink-0 mt-1">
                                    Sẵn sàng áp dụng
                                  </Chip>
                                )}
                              </div>

                              {/* Badges metadata phẳng đồng bộ toàn app */}
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                {cur.difficulty && (
                                  <Chip size="md" variant="flat" color="primary" startContent={<ChefHat className="w-4 h-4" />} className="text-sm font-medium">
                                    {cur.difficulty}
                                  </Chip>
                                )}
                                {cur.prep_time_minutes !== undefined && (
                                  <Chip size="md" variant="flat" color="warning" startContent={<Clock className="w-4 h-4" />} className="text-sm font-medium">
                                    Sơ chế {cur.prep_time_minutes}p
                                  </Chip>
                                )}
                                {cur.cook_time_minutes !== undefined && (
                                  <Chip size="md" variant="flat" color="success" startContent={<Timer className="w-4 h-4" />} className="text-sm font-medium">
                                    Nấu {cur.cook_time_minutes}p
                                  </Chip>
                                )}
                                {cur.servings !== undefined && (
                                  <Chip size="md" variant="flat" color="secondary" startContent={<Utensils className="w-4 h-4" />} className="text-sm font-medium">
                                    {cur.servings} khẩu phần
                                  </Chip>
                                )}
                                {cur.calories !== undefined && (
                                  <Chip size="md" variant="flat" color="danger" startContent={<Flame className="w-4 h-4" />} className="text-sm font-medium">
                                    {cur.calories} kcal
                                  </Chip>
                                )}
                                {cur.tags && cur.tags.length > 0 && cur.tags.map((t, idx) => (
                                  <Chip key={idx} size="md" variant="flat" color="default" className="text-sm font-normal text-default-600">
                                    #{t.name}
                                  </Chip>
                                ))}
                              </div>
                            </div>

                            {/* Bố cục 2 cột: Nguyên liệu & Các bước */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-divider/40">
                              {/* Cột trái: Nguyên liệu */}
                              <div className="md:col-span-5 flex flex-col gap-3">
                                <div className="flex items-center justify-between pb-2 border-b border-divider/60">
                                  <h4 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                                    <Carrot className="w-4.5 h-4.5 text-success" />
                                    <span>Nguyên liệu</span>
                                  </h4>
                                  {totalIngs > 0 && (
                                    <span className="text-xs sm:text-sm text-default-400 font-medium">{totalIngs} mục</span>
                                  )}
                                </div>

                                {cur.ingredientSections && cur.ingredientSections.length > 0 ? (
                                  <div className="space-y-4">
                                    {cur.ingredientSections.map((sec, sIdx) => (
                                      <div key={sIdx} className="space-y-1.5">
                                        {cur.ingredientSections!.length > 1 && (
                                          <h5 className="text-xs sm:text-sm font-bold text-default-400 uppercase tracking-wider">
                                            {sec.name}
                                          </h5>
                                        )}
                                        <div className="divide-y divide-divider/30">
                                          {sec.ingredients.map((ing, iIdx) => (
                                            <div key={iIdx} className="flex items-baseline justify-between py-2 text-sm hover:bg-default-100/40 px-1.5 rounded-lg transition-colors">
                                              <span className="text-foreground font-normal text-sm sm:text-base">{ing.name}</span>
                                              <span className="text-default-500 font-normal shrink-0 ml-3 text-right text-sm">
                                                {[ing.amount, ing.unit].filter(Boolean).join(' ') || 'Vừa đủ'}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-default-400 italic">Không có danh sách nguyên liệu</p>
                                )}
                              </div>

                              {/* Cột phải: Cách làm & Mẹo */}
                              <div className="md:col-span-7 flex flex-col gap-3">
                                <div className="flex items-center justify-between pb-2 border-b border-divider/60">
                                  <h4 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                                    <ChefHat className="w-4.5 h-4.5 text-primary" />
                                    <span>Cách làm</span>
                                  </h4>
                                  {steps.length > 0 && (
                                    <span className="text-xs sm:text-sm text-default-400 font-medium">{steps.length} bước</span>
                                  )}
                                </div>

                                {steps.length > 0 ? (
                                  <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                                    {steps.map((step, idx) => (
                                      <div key={idx} className="flex items-start gap-3 text-sm">
                                        <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs sm:text-sm">
                                          {idx + 1}
                                        </span>
                                        <div
                                          className="flex-1 leading-relaxed text-sm sm:text-[15px] text-foreground pt-0.5 [&>p]:mb-1.5 [&>p:last-child]:mb-0 [&_strong]:font-semibold [&_b]:font-semibold"
                                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(step.content) }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-default-400 italic">Không có các bước thực hiện</p>
                                )}

                                {cur.suggested_tip && (
                                  <div className="mt-3 p-3.5 bg-secondary/10 border-l-4 border-secondary rounded-r-xl flex items-start gap-3">
                                    <Lightbulb className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <span className="font-bold text-sm sm:text-base text-secondary-700 dark:text-secondary-300 block">
                                        Mẹo gợi ý: {cur.suggested_tip.title}
                                      </span>
                                      <div
                                        className="text-foreground/90 text-xs sm:text-sm mt-1 leading-relaxed [&>p]:mb-1 [&>p:last-child]:mb-0"
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(cur.suggested_tip.content) }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}
            </ModalBody>

            <ModalFooter className="px-6 py-3.5 border-t border-divider/40 flex items-center justify-between gap-3 bg-content1 shrink-0">
              {currentStep === 1 && (
                <>
                  <Button 
                    variant="flat" 
                    className="rounded-xl font-semibold h-11 text-foreground bg-default-100 hover:bg-default-200 shadow-none"
                    onPress={onClose}
                  >
                    Đóng
                  </Button>

                  <Button 
                    color="primary" 
                    className="rounded-xl font-bold h-11 shadow-none text-white px-5"
                    endContent={<ArrowRight className="w-4 h-4" />}
                    onPress={() => setCurrentStep(2)}
                  >
                    Tiếp tục: Dán kết quả
                  </Button>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <Button 
                    variant="flat" 
                    className="rounded-xl font-semibold h-11 text-foreground bg-default-100 hover:bg-default-200 shadow-none"
                    startContent={<ArrowLeft className="w-4 h-4" />}
                    onPress={() => setCurrentStep(1)}
                  >
                    Quay lại
                  </Button>

                  <Button 
                    color="primary" 
                    isDisabled={!resultText.trim()}
                    className="rounded-xl font-bold h-11 shadow-none text-white px-5"
                    endContent={<ArrowRight className="w-4 h-4" />}
                    onPress={() => {
                      if (parsedData && parsedData.length > 0) {
                        setCurrentStep(3);
                      } else {
                        handleParse(undefined, true);
                      }
                    }}
                  >
                    Trích xuất & Xem trước
                  </Button>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <Button 
                    variant="flat" 
                    className="rounded-xl font-semibold h-11 text-foreground bg-default-100 hover:bg-default-200 shadow-none"
                    startContent={<ArrowLeft className="w-4 h-4" />}
                    onPress={() => setCurrentStep(2)}
                  >
                    Quay lại
                  </Button>

                  {parsedData && parsedData.length > 0 && (
                    <div className="flex items-center gap-2">
                      {parsedData.length > 1 && (
                        <Button 
                          variant="flat"
                          color="default"
                          className="rounded-xl font-semibold h-11 text-xs sm:text-sm"
                          onPress={() => handleApply(onClose)}
                        >
                          Chỉ áp dụng món đang xem
                        </Button>
                      )}
                      <Button 
                        color="primary" 
                        className="rounded-xl font-bold h-11 shadow-none text-white px-6 text-xs sm:text-sm"
                        onPress={() => parsedData.length > 1 ? handleApplyAll(onClose) : handleApply(onClose)}
                        startContent={<Check className="w-4 h-4" />}
                      >
                        {parsedData.length > 1 ? `Áp dụng tất cả (${parsedData.length} món)` : 'Áp dụng vào Form'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
