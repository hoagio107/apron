
"use client";

import { useState, useRef } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, AlertCircle, 
  ArrowLeft, Loader2, Code, FileJson,
  FileUp, X, Sparkles, ImagePlus, Wand2,
  Download, Trash2, Layers, CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { generateRecipeFromPrompt } from '@/ai/flows/generate-recipe-from-prompt-flow';
import { useRecipes } from '@/hooks/use-recipes';

export default function ImportPage() {
  const isMobile = useIsMobile();
  const [jsonContent, setJsonContent] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiImages, setAiImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiImageInputRef = useRef<HTMLInputElement>(null);
  
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { recipes: existingRecipes } = useRecipes();
  const { toast } = useToast();
  const router = useRouter();

  const handleDownloadSample = () => {
    const sample = {
      "recipes": {
        "sample_id_1": {
          "title": "Tên món ăn mẫu",
          "prep_time": 10,
          "cook_time": 20,
          "ingredients": [
            { "unit": "g", "group": "Chính", "name": "Nguyên liệu A", "quantity": 100 }
          ],
          "steps": [
            { "group": "Thực hiện", "instruction": "Bước 1: Làm gì đó..." }
          ],
          "difficulty": "Dễ",
          "calories": 150,
          "slug": "ten-mon-an-mau",
          "userId": user?.uid || 'user_local'
        }
      }
    };
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cookpal-sample-format.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Đã tải tệp mẫu", description: "Vui lòng xem trong thư mục Download." });
  };

  const handleAIProcess = async () => {
    if (!aiText.trim() && aiImages.length === 0) {
      toast({ variant: "destructive", title: "Thiếu dữ liệu", description: "Vui lòng nhập text hoặc tải ảnh để AI phân tích." });
      return;
    }

    setIsAIProcessing(true);
    try {
      const result = await generateRecipeFromPrompt({
        prompt: aiText,
        photoDataUris: aiImages.length > 0 ? aiImages : undefined
      });

      if (result && result.recipes) {
        const recipeMap: Record<string, any> = {};
        
        result.recipes.forEach(recipe => {
          const id = Math.random().toString(36).substr(2, 9);
          const slug = recipe.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
          
          recipeMap[id] = {
            ...recipe,
            id,
            slug,
            userId: user?.uid || 'user_local',
            author_id: 'user_local',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });

        const structuredData = { "recipes": recipeMap };
        setJsonContent(JSON.stringify(structuredData, null, 2));
        toast({ title: "Đã trích xuất thành công", description: `AI đã tìm thấy ${result.recipes.length} công thức.` });
        
        setAiText('');
        setAiImages([]);
      }
    } catch (e: any) {
      console.error("AI Error:", e);
      toast({ variant: "destructive", title: "Lỗi AI", description: "Không thể phân tích dữ liệu lúc này." });
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleAIImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAiImages(prev => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAiImage = (index: number) => {
    setAiImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonContent(event.target?.result as string);
      toast({ title: "Đã tải tệp", description: `Đã đọc thành công tệp ${file.name}` });
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (isUserLoading) return;
    if (!user) {
      toast({ variant: "destructive", title: "Lỗi xác thực", description: "Vui lòng đăng nhập để thực hiện quyền ghi dữ liệu." });
      return;
    }
    if (!firestore) {
      toast({ variant: "destructive", title: "Lỗi hệ thống", description: "Firestore chưa sẵn sàng." });
      return;
    }

    setIsImporting(true);
    try {
      const data = JSON.parse(jsonContent);
      const recipesToImport = data.recipes;

      if (!recipesToImport) throw new Error("Không tìm thấy thuộc tính 'recipes' trong tệp JSON.");

      const entries = Object.entries(recipesToImport);
      const existingSlugs = new Set(existingRecipes.map(r => r.slug));
      const existingIds = new Set(existingRecipes.map(r => r.id));
      
      let newCount = 0;
      let updateCount = 0;
      let duplicateSlugCount = 0;

      const batchSize = 400; 
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = writeBatch(firestore);
        const chunk = entries.slice(i, i + batchSize);
        
        chunk.forEach(([id, recipe]: [string, any]) => {
          // Check for collision
          if (existingIds.has(id)) {
            updateCount++;
          } else if (existingSlugs.has(recipe.slug)) {
            duplicateSlugCount++;
            newCount++; // It's still added as a new doc because ID is different, but we track it as a potential duplicate
          } else {
            newCount++;
          }

          const recipeRef = doc(firestore, 'users', user.uid, 'recipes', id);
          batch.set(recipeRef, {
            ...recipe,
            id: id,
            userId: user.uid,
            createdAt: recipe.createdAt || recipe.created_at || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        });
        await batch.commit();
      }

      let summary = `Đã nhập ${newCount} món mới`;
      if (updateCount > 0) summary += `, cập nhật ${updateCount} món`;
      if (duplicateSlugCount > 0) summary += `. Lưu ý: Có ${duplicateSlugCount} món có thể bị trùng tên với dữ liệu cũ.`;

      toast({ 
        title: "Nhập dữ liệu thành công!", 
        description: summary,
        variant: duplicateSlugCount > 0 ? "default" : "default" 
      });
      
      setTimeout(() => router.push('/'), 2000);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Lỗi nhập liệu", description: e.message || "Định dạng JSON không hợp lệ." });
    } finally {
      setIsImporting(false);
    }
  };

  const NavbarContent = () => (
    <>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full shadow-none text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className={cn("font-bold truncate font-headline", isMobile ? "text-sm max-w-[150px]" : "text-xl")}>
          Nhập Dữ Liệu
        </h1>
      </div>
      
      <div className="flex items-center gap-0">
        <Button 
          onClick={handleImport} 
          disabled={isImporting || isUserLoading || !jsonContent.trim()}
          variant="ghost"
          className={cn(
            "text-orange-600 hover:bg-orange-50 rounded-xl font-bold shadow-none",
            isMobile ? "h-9 w-9 p-0" : "h-10 px-5"
          )}
        >
          {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <><Upload className={cn("w-4 h-4", !isMobile && "mr-2")} />{!isMobile && "Bắt đầu Import"}</>
          )}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-10 md:pb-32">
      <header className={cn(
        "fixed top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-none",
        isMobile ? "left-0 right-0 h-14 px-4" : "left-64 right-0 h-16 px-8"
      )}>
        <NavbarContent />
      </header>

      <main className={cn("max-w-[1600px] mx-auto px-4 md:px-8", isMobile ? "pt-20" : "pt-24")}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Cột Trái: Trợ lý AI */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white font-headline">Trợ lý AI đa năng</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Phân tích văn bản hoặc hình ảnh</p>
                  </div>
                </div>
                {aiImages.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setAiImages([])} className="text-red-500 font-bold h-8 rounded-lg">
                    Xóa tất cả
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {aiImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm group">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button 
                        onClick={() => removeAiImage(idx)}
                        className="absolute top-1 right-1 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  <div 
                    className="relative aspect-square bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all overflow-hidden group"
                    onClick={() => aiImageInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <ImagePlus className="w-6 h-6" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Thêm ảnh</p>
                    </div>
                    <input type="file" ref={aiImageInputRef} onChange={handleAIImageUpload} className="hidden" accept="image/*" multiple />
                  </div>
                </div>

                <div className="relative">
                  <Textarea 
                    placeholder="Dán nội dung văn bản hoặc mô tả món ăn..."
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    className="rounded-2xl bg-gray-50 dark:bg-gray-900 border-none shadow-none resize-y min-h-[120px] font-medium p-4"
                  />
                </div>

                <Button 
                  onClick={handleAIProcess} 
                  disabled={isAIProcessing || (aiText.trim() === '' && aiImages.length === 0)}
                  className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold shadow-lg shadow-orange-200/20 gap-2 border-none transition-transform active:scale-95"
                >
                  {isAIProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                  {isAIProcessing ? 'Đang phân tích dữ liệu...' : 'Bắt đầu trích xuất AI'}
                </Button>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                  <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                    Hệ thống sẽ tự động đối chiếu dữ liệu mới với kho công thức hiện tại của bạn để phát hiện các món có thể bị trùng tên.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cột Phải: Công cụ & Soạn thảo */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl md:rounded-3xl border border-blue-100 dark:border-blue-800 space-y-3">
                <div className="flex items-center gap-3">
                  <FileUp className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm">Chọn tệp .JSON</h4>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-11 bg-white dark:bg-gray-800 rounded-xl font-bold border-blue-200 text-blue-600 shadow-none text-xs"
                >
                  Chọn từ thiết bị
                </Button>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-2xl md:rounded-3xl border border-green-100 dark:border-green-800 space-y-3">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-green-600" />
                  <h4 className="font-bold text-green-900 dark:text-blue-300 text-sm">Tải JSON mẫu</h4>
                </div>
                <Button 
                  onClick={handleDownloadSample}
                  variant="outline"
                  className="w-full h-11 bg-white dark:bg-gray-800 rounded-xl font-bold border-green-200 text-green-600 shadow-none text-xs"
                >
                  Tải cấu trúc chuẩn
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Code className="w-3 h-3" /> Soạn thảo / Kết quả JSON
                </label>
                {jsonContent && (
                  <Button variant="ghost" size="sm" onClick={() => setJsonContent('')} className="h-6 text-red-500 font-bold hover:bg-red-50 px-2 rounded-lg">
                    <X className="w-3 h-3 mr-1" /> Xóa trắng
                  </Button>
                )}
              </div>
              
              <div className="relative">
                <Textarea 
                  placeholder='Kết quả JSON sẽ xuất hiện ở đây...' 
                  value={jsonContent}
                  onChange={(e) => setJsonContent(e.target.value)}
                  className="min-h-[500px] lg:min-h-[600px] font-mono text-xs md:text-sm p-6 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl md:rounded-3xl focus-visible:ring-orange-500 transition-all shadow-none resize-y no-scrollbar"
                />
                {!jsonContent && !isAIProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-10">
                    <FileJson className="w-20 h-20 text-gray-400" />
                    <p className="font-bold mt-4">Chưa có dữ liệu</p>
                  </div>
                )}
                {isAIProcessing && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl md:rounded-3xl">
                    <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
                    <p className="font-bold text-orange-600 animate-pulse uppercase tracking-widest text-xs">AI đang phân tích dữ liệu...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
