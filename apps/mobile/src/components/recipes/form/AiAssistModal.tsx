import { useState, useEffect, useRef } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Textarea, 
  Spinner
} from '@/ui';
import { Settings, Sparkles, Check, Clock, Users, Flame, ChefHat, AlertTriangle, ImagePlus, X } from 'lucide-react';
import { GEMINI_MODELS, type ParseRecipeResult, parseRecipeWithGemini } from '../../../lib/gemini';
import { convertToWebP, validateMediaFile } from '../../../lib/image-utils';
import { useIngredientCatalogStore } from '../../../store/useIngredientCatalogStore';
import { useTipStore } from '../../../store/useTipStore';

interface AiAssistModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (data: ParseRecipeResult) => void;
  onApplyBulk?: (data: ParseRecipeResult[]) => void;
}

interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
}

export function AiAssistModal({ isOpen, onOpenChange, onApply, onApplyBulk }: AiAssistModalProps) {
  const [inputText, setInputText] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(GEMINI_MODELS[0].name);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParseRecipeResult[] | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const catalog = useIngredientCatalogStore(state => state.catalog);
  const { tips, addTip, fetchTips } = useTipStore();

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('gemini_api_key') || '';
      const savedModel = localStorage.getItem('gemini_model') || GEMINI_MODELS[0].name;
      setApiKey(savedKey);
      setSelectedModel(savedModel);
      setError('');
    } else {
      // Cleanup image previews when modal closes
      selectedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
      setSelectedImages([]);
      setInputText('');
      setParsedData(null);
      setActiveTabIndex(0);
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const isConfigured = !!apiKey;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    const newImages: SelectedImage[] = [];
    
    let overLimit = false;
    for (const file of files) {
      if (selectedImages.length + newImages.length >= 20) {
        overLimit = true;
        break;
      }
      
      const { valid, type } = validateMediaFile(file);
      if (valid && type === 'image') {
        newImages.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file)
        });
      }
    }
    
    if (overLimit) {
      setError('Chỉ được chọn tối đa 20 ảnh.');
    } else {
      setError('');
    }
    
    if (newImages.length > 0) {
      setSelectedImages(prev => [...prev, ...newImages]);
    }
    
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    setSelectedImages(prev => {
      const filtered = prev.filter(img => {
        if (img.id === id) {
          URL.revokeObjectURL(img.previewUrl);
          return false;
        }
        return true;
      });
      return filtered;
    });
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && selectedImages.length === 0) return;
    if (!apiKey.trim()) {
      setError('Vui lòng nhập Gemini API Key.');
      return;
    }
    if (!selectedModel) {
      setError('Vui lòng chọn model AI.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setParsedData(null);
      
      localStorage.setItem('gemini_api_key', apiKey.trim());
      
      // Chuyển đổi tất cả ảnh sang base64 webp
      const base64Images: string[] = [];
      for (const img of selectedImages) {
        try {
          const webpDataUrl = await convertToWebP(img.file);
          base64Images.push(webpDataUrl);
        } catch (e) {
          console.error("Lỗi chuyển đổi ảnh:", e);
        }
      }
      
      const existingIngredients = Object.values(catalog).map(ing => ing.name);
      const existingTips = tips.map(t => ({ id: t.id, title: t.title }));
      
      const result = await parseRecipeWithGemini(selectedModel, inputText, apiKey.trim(), base64Images, existingIngredients, existingTips);
      setParsedData(result);
      setActiveTabIndex(0);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi phân tích dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (parsedData && parsedData.length > 0) {
      onApply(parsedData[activeTabIndex]);
      onOpenChange(false);
      
      // Reset state for next use
      setInputText('');
      setParsedData(null);
      setActiveTabIndex(0);
    }
  };

  const handleExportTip = async (idx: number, suggested: { title: string, content: string }) => {
    try {
      const newTip = {
        id: crypto.randomUUID(),
        title: suggested.title,
        content: suggested.content,
        category_id: 'cooking'
      };
      await addTip(newTip);
      
      setParsedData(prev => {
        if (!prev) return prev;
        const newData = [...prev];
        newData[idx] = { ...newData[idx] };
        newData[idx].linked_tips = [...(newData[idx].linked_tips || []), newTip.id];
        delete newData[idx].suggested_tip;
        return newData;
      });
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xuất mẹo');
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="full" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>AI Hỗ trợ điền công thức</span>
              </div>
              <p className="text-base text-default-500 font-normal">
                Dán nội dung công thức hoặc <strong>đường dẫn (URL)</strong> vào đây để AI tự động trích xuất thông tin điền vào Form.
              </p>
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                {/* Column 1: Input */}
                <div className="flex flex-col gap-4">
                  {error && (
                    <div className="p-3 bg-danger-50 text-danger-600 rounded-lg flex items-start gap-2 text-base">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  
                  {/* Warning nếu chưa cấu hình */}
                  {!isConfigured && (
                    <div className="p-3 bg-warning-50 text-warning-700 rounded-lg flex items-start gap-2 text-base">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">Chưa cấu hình AI</p>
                        <p className="text-sm mt-0.5">Vui lòng nhập Gemini API Key trong phần cài đặt để sử dụng tính năng này.</p>
                      </div>
                      <Button
                        size="md"
                        variant="flat"
                        color="warning"
                        startContent={<Settings className="w-3.5 h-3.5" />}
                        onPress={() => {
                          onOpenChange(false);
                          window.dispatchEvent(new CustomEvent('open-settings'));
                        }}
                      >
                        Cài đặt
                      </Button>
                    </div>
                  )}

                  {/* Model đang dùng */}
                  {isConfigured && (
                    <div className="flex items-center gap-2 text-sm text-default-400 bg-default-50 rounded-lg px-3 py-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Model: <strong className="text-default-600">{GEMINI_MODELS.find(m => m.name === selectedModel)?.label || selectedModel}</strong></span>
                    </div>
                  )}

                  <Textarea
                    label="Nội dung công thức hoặc URL"
                    placeholder="Dán đường link web, toàn bộ bài viết, hoặc để trống nếu dùng ảnh..."
                    value={inputText}
                    onValueChange={setInputText}
                    minRows={8}
                    maxRows={12}
                    variant="flat"
                    isDisabled={isLoading}
                    className="flex-1"
                    classNames={{
                      inputWrapper: "h-full",
                      base: "flex-1"
                    }}
                  />

                  {/* Image Selector */}
                  <div className="flex flex-col gap-2">
                    <span className="text-base font-medium">Hình ảnh ({selectedImages.length}/20)</span>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      multiple 
                      accept="image/*" 
                      onChange={handleFileChange} 
                    />
                    
                    <div className="flex gap-2 flex-wrap">
                      {selectedImages.map((img) => (
                        <div key={img.id} className="relative w-16 h-16 shrink-0 group rounded-md overflow-hidden border border-default-200">
                          <img src={img.previewUrl} className="w-full h-full object-cover" alt="preview" />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-black/50 hover:bg-danger text-white rounded-full p-0.5 md:opacity-0 md:group-hover:opacity-100 transition-all"
                            onClick={() => handleRemoveImage(img.id)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      
                      {selectedImages.length < 20 && (
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isLoading}
                          className="w-16 h-16 rounded-md border-2 border-dashed border-default-300 hover:border-primary hover:bg-primary/5 flex items-center justify-center text-default-400 hover:text-primary transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ImagePlus className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Preview */}
                <div className="flex flex-col h-full min-h-[350px]">
                  {parsedData && parsedData.length > 0 ? (
                    <div className="flex flex-col h-full border border-success-200 rounded-xl overflow-hidden bg-success-50/30">
                      <div className="bg-success-100/50 px-4 py-3 border-b border-success-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-success-600" /> 
                          <h4 className="font-semibold text-base text-success-700">Xem trước kết quả trích xuất</h4>
                        </div>
                        {parsedData.length > 1 && (
                          <span className="text-sm bg-success-200 text-success-800 px-2 py-0.5 rounded-full font-medium">
                            {parsedData.length} công thức
                          </span>
                        )}
                      </div>
                      
                      {/* Tabs */}
                      {parsedData.length > 1 && (
                        <div className="flex overflow-x-auto border-b border-success-200 bg-success-50/50">
                          {parsedData.map((recipe, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveTabIndex(idx)}
                              className={`px-4 py-2 text-base font-medium whitespace-nowrap border-b-2 transition-colors ${
                                activeTabIndex === idx 
                                  ? 'border-success-500 text-success-700 bg-success-100/50' 
                                  : 'border-transparent text-success-600 hover:text-success-800 hover:bg-success-100/30'
                              }`}
                            >
                              {recipe.title || `Công thức ${idx + 1}`}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-4 text-base flex-1">
                        <div className="space-y-4">
                          {/* Thông tin cơ bản */}
                          <div>
                            <h5 className="font-bold text-lg mb-1">{parsedData[activeTabIndex].title || <span className="italic text-default-400">Không có tên</span>}</h5>
                            {parsedData[activeTabIndex].description && <p className="text-default-600 mb-2">{parsedData[activeTabIndex].description}</p>}
                            {parsedData[activeTabIndex].notes && (
                              <div className="mt-2 text-default-600 prose prose-sm max-w-none prose-p:my-1" dangerouslySetInnerHTML={{ __html: parsedData[activeTabIndex].notes }} />
                            )}
                            
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-default-600">
                              {parsedData[activeTabIndex].difficulty && <span className="flex items-center gap-1"><ChefHat className="w-3.5 h-3.5" /> {parsedData[activeTabIndex].difficulty}</span>}
                              {parsedData[activeTabIndex].prep_time_minutes && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> CB: {parsedData[activeTabIndex].prep_time_minutes}p</span>}
                              {parsedData[activeTabIndex].cook_time_minutes && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Nấu: {parsedData[activeTabIndex].cook_time_minutes}p</span>}
                              {parsedData[activeTabIndex].servings && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {parsedData[activeTabIndex].servings} người</span>}
                              {parsedData[activeTabIndex].calories && <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {parsedData[activeTabIndex].calories} kcal</span>}
                            </div>
                          </div>

                          {/* Tags */}
                          {parsedData[activeTabIndex].tags && parsedData[activeTabIndex].tags.length > 0 && (
                            <div>
                              <span className="font-semibold text-sm uppercase tracking-wider text-default-500 block mb-1">Tags</span>
                              <div className="flex flex-wrap gap-1">
                                {parsedData[activeTabIndex].tags.map(t => (
                                  <span key={t.name} className="px-2 py-0.5 bg-default-100 rounded-md text-sm">
                                    {t.name} {t.is_new && <span className="text-xs text-primary ml-1">(Mới)</span>}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Linked & Suggested Tips */}
                          {((parsedData[activeTabIndex].linked_tips && parsedData[activeTabIndex].linked_tips.length > 0) || parsedData[activeTabIndex].suggested_tip) && (
                            <div className="bg-primary-50 p-3 rounded-lg border border-primary-100">
                              <span className="font-semibold text-sm uppercase tracking-wider text-primary-700 block mb-2 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" /> Mẹo Nhà Bếp
                              </span>
                              
                              {parsedData[activeTabIndex].linked_tips && parsedData[activeTabIndex].linked_tips.length > 0 && (
                                <div className="mb-2">
                                  <span className="text-sm text-primary-600 block mb-1">Mẹo đã liên kết:</span>
                                  <ul className="list-disc list-inside text-sm text-primary-800 ml-1">
                                    {parsedData[activeTabIndex].linked_tips.map(id => {
                                      const t = tips.find(tip => tip.id === id);
                                      return t ? <li key={id}>{t.title}</li> : null;
                                    })}
                                  </ul>
                                </div>
                              )}

                              {parsedData[activeTabIndex].suggested_tip && (
                                <div className="mt-2 bg-white/60 p-2 rounded border border-primary-100">
                                  <span className="text-sm font-semibold text-primary-600 block mb-1">Gợi ý mẹo mới: {parsedData[activeTabIndex].suggested_tip.title}</span>
                                  <div className="text-sm text-default-600 mb-2 prose prose-sm prose-p:my-0 max-w-none" dangerouslySetInnerHTML={{ __html: parsedData[activeTabIndex].suggested_tip.content }} />
                                  <Button 
                                    size="md" 
                                    color="primary" 
                                    variant="flat" 
                                    onPress={() => handleExportTip(activeTabIndex, parsedData[activeTabIndex].suggested_tip!)}
                                  >
                                    Xuất sang Mẹo nhà bếp
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Ingredients */}
                          {parsedData[activeTabIndex].ingredientSections && parsedData[activeTabIndex].ingredientSections.length > 0 && (
                            <div>
                              <span className="font-semibold text-sm uppercase tracking-wider text-default-500 block mb-1">
                                Nguyên liệu ({parsedData[activeTabIndex].ingredientSections.reduce((acc, sec) => acc + sec.ingredients.length, 0)})
                              </span>
                              <div className="space-y-3">
                                {parsedData[activeTabIndex].ingredientSections.map((section, idx) => (
                                  <div key={idx}>
                                    {section.name && <h6 className="font-semibold text-base mb-1">{section.name}</h6>}
                                    <ul className="list-disc list-inside space-y-0.5 ml-1">
                                      {section.ingredients.map((ing, i) => (
                                        <li key={i}>
                                          <span className="font-medium">{ing.name}</span>
                                          {(ing.amount || ing.unit) && (
                                            <span className="text-default-500"> - {ing.amount} {ing.unit}</span>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Steps */}
                          {parsedData[activeTabIndex].stepSections && parsedData[activeTabIndex].stepSections.length > 0 && (
                            <div>
                              <span className="font-semibold text-sm uppercase tracking-wider text-default-500 block mb-1">
                                Các bước làm ({parsedData[activeTabIndex].stepSections.reduce((acc, sec) => acc + sec.steps.length, 0)})
                              </span>
                              <div className="space-y-3">
                                {parsedData[activeTabIndex].stepSections.map((section, idx) => (
                                  <div key={idx}>
                                    {section.name && <h6 className="font-semibold text-base mb-1">{section.name}</h6>}
                                    <ol className="list-decimal list-inside space-y-1 ml-1">
                                      {section.steps.map((step, i) => (
                                        <li key={i} className="pl-1">
                                          <div 
                                            className="inline-block prose prose-sm max-w-none prose-p:my-0 prose-p:inline" 
                                            dangerouslySetInnerHTML={{ __html: step.content }} 
                                          />
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-default-400 border border-dashed border-default-200 rounded-xl bg-default-50/50 p-8 text-center h-full">
                       <Sparkles className="w-10 h-10 mb-3 opacity-20" />
                       <p className="text-base">Kết quả trích xuất sẽ hiển thị tại đây</p>
                    </div>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" className="text-base font-medium" variant="light" onPress={onClose} isDisabled={isLoading}>
                Hủy
              </Button>
              {parsedData && parsedData.length > 0 ? (
                <div className="flex gap-2">
                  <Button className="bg-green-600 text-white font-medium" onPress={handleApply} startContent={<Check className="w-4 h-4" />}>
                    {parsedData.length > 1 ? `Áp dụng ${parsedData[activeTabIndex]?.title || `Công thức ${activeTabIndex + 1}`}` : 'Áp dụng vào Form'}
                  </Button>
                  {parsedData.length > 1 && onApplyBulk && (
                    <Button 
                      color="primary" 
                      className="font-medium"
                      onPress={() => {
                        onApplyBulk(parsedData);
                        onOpenChange(false);
                        setInputText('');
                        setParsedData(null);
                        setActiveTabIndex(0);
                      }} 
                      startContent={<Sparkles className="w-4 h-4" />}
                    >
                      Áp dụng tất cả ({parsedData.length})
                    </Button>
                  )}
                </div>
              ) : (
                <Button 
                  color="primary" 
                  onPress={handleAnalyze} 
                  isDisabled={(!inputText.trim() && selectedImages.length === 0) || !isConfigured || isLoading}
                  startContent={isLoading ? <Spinner size="md" color="white" /> : <Sparkles className="w-4 h-4" />}
                >
                  {isLoading ? 'Đang phân tích...' : 'Phân tích'}
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
