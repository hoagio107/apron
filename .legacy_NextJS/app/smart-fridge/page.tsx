
"use client";

import { useState, useMemo } from 'react';
import { useRecipes } from '@/hooks/use-recipes';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sparkles, Soup, Search, Loader2, ArrowLeft, 
  ChefHat, Refrigerator, Info, Lightbulb, X, Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { findRecipesFromIngredients } from '@/ai/flows/smart-fridge-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export default function SmartFridgePage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { toast } = useToast();
  const { recipes, loading: recipesLoading } = useRecipes();
  
  const [ingredients, setIngredients] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ ids: string[], advice: string } | null>(null);

  const suggestedRecipes = useMemo(() => {
    if (!result || !recipes.length) return [];
    return recipes.filter(r => result.ids.includes(r.id));
  }, [result, recipes]);

  const handleSearch = async () => {
    if (!ingredients.trim()) {
      toast({ variant: "destructive", title: "Thiếu nguyên liệu", description: "Vui lòng nhập những gì bạn đang có." });
      return;
    }

    setIsProcessing(true);
    try {
      const recipeMetadata = recipes.map(r => ({
        id: r.id,
        title: r.title,
        tags: r.tags || []
      }));

      const response = await findRecipesFromIngredients({
        ingredients: ingredients.trim(),
        existingRecipes: recipeMetadata
      });

      setResult({
        ids: response.recommendedRecipeIds,
        advice: response.advice
      });
      
      if (response.recommendedRecipeIds.length === 0) {
        toast({ title: "Không tìm thấy món khớp", description: "Hãy thử nhập thêm các nguyên liệu cơ bản khác." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi hệ thống", description: "AI hiện không thể phản hồi. Vui lòng thử lại sau." });
    } finally {
      setIsProcessing(false);
    }
  };

  const navbarContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full shadow-none text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-2">
          <Refrigerator className="w-5 h-5 text-blue-600" />
          <h1 className={cn("font-bold truncate font-headline", isMobile ? "text-sm" : "text-xl")}>
            Dọn sạch tủ lạnh
          </h1>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {isMobile ? (
        <div className="min-h-screen bg-white pt-14">
          <header className="fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-gray-100 z-50 flex items-center px-4">
            {navbarContent}
          </header>

          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Soup className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold font-headline">Hôm nay còn gì?</h2>
              </div>
              
              <div className="space-y-4">
                <textarea 
                  placeholder="VD: Trứng, hành tây, khoai tây..." 
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  className="w-full min-h-[100px] p-4 rounded-2xl bg-gray-50 border-none outline-none font-bold text-lg resize-none shadow-none"
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={isProcessing || !ingredients.trim()}
                  className="w-full h-14 bg-blue-600 rounded-2xl font-bold text-white shadow-none border-none"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                  Tìm món ăn ngay
                </Button>
              </div>
            </div>

            <div className="h-px bg-gray-50 w-full" />

            <div className="pb-32">
              {isProcessing ? (
                <div className="flex flex-col items-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đang phân tích...</p>
                </div>
              ) : result ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="bg-orange-50 p-5 rounded-xl border-none shadow-none">
                    <p className="text-orange-800 text-sm font-medium leading-relaxed italic">"{result.advice}"</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg font-headline">Gợi ý cho bạn</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {suggestedRecipes.map(recipe => (
                        <RecipeCard key={recipe.id} recipe={recipe} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center opacity-30">
                  <Refrigerator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-xs font-bold uppercase tracking-widest">Đang chờ nguyên liệu...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-full mx-auto px-4 md:px-8">
          <header className={cn(
            "fixed top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shadow-none",
            "left-64 right-0 h-16 px-8"
          )}>
            {navbarContent}
          </header>

          <div className="grid grid-cols-12 gap-8 items-start pt-24">
            <div className="col-span-12 xl:col-span-3 space-y-6 xl:sticky xl:top-24">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl md:rounded-3xl shadow-none border-none">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Soup className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-headline">Bạn còn gì?</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Trợ lý AI sẽ gợi ý món</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Nguyên liệu đang có</label>
                    <textarea 
                      placeholder="VD: thịt bò, cà chua, hành tây..." 
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      className="w-full min-h-[120px] p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg resize-none shadow-none"
                    />
                  </div>

                  <Button 
                    onClick={handleSearch} 
                    disabled={isProcessing || !ingredients.trim()}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-none border-none transition-transform active:scale-95"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {isProcessing ? 'AI đang phân tích...' : 'Tìm món ăn ngay'}
                  </Button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-gray-300 shrink-0" />
                    <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                      AI sẽ quét trong danh sách công thức của bạn để tìm ra những món khớp nhất với nguyên liệu bạn vừa nhập.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-12 xl:col-span-9">
              <div className="min-h-[600px] space-y-8">
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center py-32 space-y-4 opacity-50">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                    <p className="font-bold text-gray-400 uppercase tracking-[0.2em] text-xs">Đang lục tìm trong sổ tay...</p>
                  </div>
                ) : result ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl md:rounded-3xl mb-10 border-none shadow-none flex gap-4">
                      <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-orange-500 shrink-0 shadow-none">
                        <Lightbulb className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-orange-900 dark:text-orange-300">Gợi ý từ đầu bếp AI</h4>
                        <p className="text-orange-800/70 dark:text-orange-400/70 text-sm leading-relaxed mt-1 font-medium italic">"{result.advice}"</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold font-headline">Món ăn phù hợp nhất</h2>
                        <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">{suggestedRecipes.length} kết quả</span>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6">
                        {suggestedRecipes.map(recipe => (
                          <RecipeCard key={recipe.id} recipe={recipe} />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 text-center bg-white dark:bg-gray-800 rounded-xl md:rounded-3xl border-none shadow-none">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                      <Refrigerator className="w-10 h-10 text-gray-200" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-400">Kết quả sẽ xuất hiện ở đây</h3>
                    <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">Nhập nguyên liệu bạn đang có để AI giúp bạn tìm món ngon.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
