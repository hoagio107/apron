"use client";

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, ImagePlus, Wand2, Loader2, X, 
  Check, Lightbulb, AlertCircle, Trash2 
} from 'lucide-react';
import { generateTipFromPrompt } from '@/ai/flows/generate-tip-from-prompt-flow';
import { useToast } from '@/hooks/use-toast';
import { useTips } from '@/hooks/use-tips';
import { cn } from '@/lib/utils';

interface TipAIImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TipAIImportModal({ isOpen, onClose }: TipAIImportModalProps) {
  const { toast } = useToast();
  const { addTip } = useTips();
  
  const [aiText, setAiText] = useState('');
  const [aiImages, setAiImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedTips, setExtractedTips] = useState<any[]>([]);
  
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAiImages(prev => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleProcess = async () => {
    if (!aiText.trim() && aiImages.length === 0) return;
    
    setIsProcessing(true);
    try {
      const result = await generateTipFromPrompt({
        prompt: aiText,
        photoDataUris: aiImages.length > 0 ? aiImages : undefined
      });
      
      if (result && result.tips) {
        setExtractedTips(result.tips);
        toast({ title: "Đã trích xuất xong!", description: `Tìm thấy ${result.tips.length} bí quyết.` });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi AI", description: "Không thể phân tích dữ liệu." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAll = async () => {
    if (extractedTips.length === 0) return;
    setIsSaving(true);
    try {
      for (const tip of extractedTips) {
        const slug = tip.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
        await addTip({ ...tip, slug });
      }
      toast({ title: "Thành công!", description: `Đã lưu ${extractedTips.length} mẹo vào sổ tay.` });
      setExtractedTips([]);
      setAiText('');
      setAiImages([]);
      onClose();
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi lưu trữ" });
    } finally {
      setIsSaving(false);
    }
  };

  const removeExtracted = (idx: number) => {
    setExtractedTips(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[calc(100%-2rem)] rounded-[2.5rem] p-0 overflow-hidden flex flex-col h-[85vh] gap-0 border-none">
        <DialogHeader className="px-6 py-4 border-b bg-gray-50/50">
          <DialogTitle className="text-xl font-bold font-headline flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" /> Trích xuất bí quyết bằng AI
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white dark:bg-gray-900">
          {extractedTips.length === 0 ? (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800 flex gap-4">
                <AlertCircle className="w-6 h-6 text-blue-500 shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                  Tải lên ảnh chụp mẹo vặt hoặc dán văn bản thô, AI của <strong>CookPal</strong> sẽ tự động trình bày lại đẹp mắt và phân loại danh mục cho bạn.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {aiImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group shadow-sm">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button onClick={() => setAiImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div 
                    onClick={() => imageInputRef.current?.click()}
                    className="aspect-square bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100"
                  >
                    <ImagePlus className="w-8 h-8 text-gray-300 mb-2" />
                    <span className="text-[10px] font-bold uppercase text-gray-400">Thêm ảnh</span>
                    <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
                  </div>
                </div>

                <Textarea 
                  placeholder="Dán văn bản mô tả mẹo vặt tại đây..."
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  className="min-h-[150px] rounded-2xl bg-gray-50 dark:bg-gray-800 border-none shadow-none p-4 font-medium resize-y"
                />

                <Button 
                  onClick={handleProcess} 
                  disabled={isProcessing || (!aiText.trim() && aiImages.length === 0)}
                  className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold shadow-none transition-transform active:scale-95"
                >
                  {isProcessing ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Wand2 className="w-5 h-5 mr-2" />}
                  Bắt đầu trích xuất AI
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg font-headline">Kết quả trích xuất</h3>
                <Button variant="ghost" onClick={() => setExtractedTips([])} className="text-gray-400 font-bold">Làm lại</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {extractedTips.map((tip, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 relative group">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-md text-[10px] font-black uppercase">{tip.category_id}</span>
                    </div>
                    <h4 className="font-bold text-gray-800 dark:text-white mb-2 font-headline">{tip.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{tip.content}</p>
                    <button onClick={() => removeExtracted(idx)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t bg-gray-50/50 flex flex-row gap-3">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold h-12 flex-1">Hủy</Button>
          {extractedTips.length > 0 && (
            <Button 
              onClick={handleSaveAll} 
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 rounded-xl font-bold h-12 flex-[2] text-white shadow-none"
            >
              {isSaving ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Check className="w-5 h-5 mr-2" />}
              Lưu {extractedTips.length} bí quyết vào sổ tay
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
