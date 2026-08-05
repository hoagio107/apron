
"use client";

import { useState, useMemo } from 'react';
import { useRecipes } from '@/hooks/use-recipes';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { useUnits } from '@/hooks/use-units';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { 
  ShoppingBasket, Trash2, Printer, Plus, 
  AlertCircle, ShoppingCart, ArrowLeft,
  X, CheckCircle2, ListChecks, Store, Loader2, Check,
  CircleHelp, ChevronDown, ChevronUp, ShoppingBag
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function ShoppingListPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { toast } = useToast();
  const { recipes, loading: recipesLoading } = useRecipes();
  const { units } = useUnits();
  const { 
    list, loading: listLoading, addExtraItem, toggleExtraItem, 
    removeExtraItem, toggleRecipeInList, toggleIngredientChecked, clearList 
  } = useShoppingList();
  
  const [newItem, setNewItem] = useState('');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isRecipesExpanded, setIsRecipesExpanded] = useState(false);

  const selectedRecipes = useMemo(() => {
    const ids = list.recipe_ids || [];
    return recipes.filter(r => ids.includes(r.id));
  }, [recipes, list.recipe_ids]);

  const consolidatedIngredients = useMemo(() => {
    const ingredientMap = new Map<string, { totals: Record<string, number>, descriptions: string[], recipes: string[] }>();
    
    selectedRecipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        const nameKey = ing.name.toLowerCase().trim();
        const current = ingredientMap.get(nameKey) || { totals: {}, descriptions: [], recipes: [] };
        
        if (!current.recipes.includes(recipe.title)) current.recipes.push(recipe.title);

        const parsedQty = typeof ing.quantity === 'string' ? parseFloat(ing.quantity) : ing.quantity;
        
        if (!isNaN(parsedQty)) {
          let unit = (ing.unit || 'g').toLowerCase().trim();
          let quantity = parsedQty;

          const unitDef = units.find(u => u.name.toLowerCase().trim() === unit);
          if (unitDef && unitDef.conversion_rate && unitDef.base_unit) {
            quantity = quantity * unitDef.conversion_rate;
            unit = unitDef.base_unit.toLowerCase().trim();
          }

          current.totals[unit] = (current.totals[unit] || 0) + quantity;
        } else {
          const desc = `${ing.quantity} ${ing.unit}`.trim();
          if (!current.descriptions.includes(desc)) current.descriptions.push(desc);
        }
        
        ingredientMap.set(nameKey, current);
      });
    });
      
    return Array.from(ingredientMap.entries())
      .map(([name, data]) => {
        const numericQuantities = Object.entries(data.totals).map(([unit, amount]) => {
          const formattedAmount = Number.isInteger(amount) ? amount : parseFloat(amount.toFixed(2));
          return `${formattedAmount}${unit}`;
        });
        return { 
          name, 
          quantities: [...numericQuantities, ...data.descriptions], 
          recipes: data.recipes 
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedRecipes, units]);

  const handleAddExtra = async () => {
    if (!newItem.trim()) return;
    try {
      await addExtraItem(newItem.trim());
      setNewItem('');
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm đồ dùng." });
    }
  };

  const handleConfirmClear = async () => {
    try {
      await clearList();
      toast({ title: "Đã xóa sạch danh sách" });
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể xóa danh sách." });
    }
  };

  if (recipesLoading || listLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
      </div>
    );
  }

  const extraItems = list.extra_items || [];
  const checkedIngredients = list.checked_ingredients || [];
  const isListEmpty = consolidatedIngredients.length === 0 && extraItems.length === 0;

  const NavbarContent = () => (
    <>
      <div className="flex items-center gap-4 print:hidden">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full shadow-none">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className={cn("font-bold font-headline flex items-center gap-2", isMobile ? "text-sm" : "text-xl")}>
          <ShoppingBasket className="w-5 h-5 text-orange-600" />
          <span>Đi chợ</span>
        </h1>
      </div>
      
      <div className={cn("flex print:hidden", isMobile ? "gap-0" : "gap-2")}>
        <Button variant="ghost" size="icon" onClick={() => window.print()} className="text-gray-500 hover:text-orange-600 transition-colors border-none shadow-none">
          <Printer className="w-5 h-5" />
        </Button>
        {!isListEmpty && (
          <Button variant="ghost" size="icon" onClick={() => setIsClearModalOpen(true)} className="text-red-500 border-none shadow-none">
            <Trash2 className="w-5 h-5" />
          </Button>
        )}
      </div>
    </>
  );

  const DesktopView = () => (
    <div className="max-w-7xl mx-auto px-8">
      <div className="fixed top-0 left-64 right-0 h-16 z-40 px-8 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-none print:hidden">
        <NavbarContent />
      </div>

      <div className="grid grid-cols-12 gap-8 items-start pt-16 mt-6">
        <div className="col-span-4 space-y-6 lg:sticky lg:top-24 print:hidden">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-white font-headline">
              <Store className="w-5 h-5 text-orange-500" /> Thực đơn đã chọn
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
              {selectedRecipes.map(recipe => (
                <div key={recipe.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 group border border-transparent hover:border-orange-100">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                    <img src={recipe.image_url || 'https://picsum.photos/50'} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-gray-800 dark:text-white">{recipe.title}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{recipe.ingredients.length} mục</p>
                  </div>
                  <button onClick={() => toggleRecipeInList(recipe.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {selectedRecipes.length === 0 && (
                <div className="py-10 text-center text-gray-400">
                  <p className="text-xs font-bold uppercase tracking-widest">Chưa chọn món nào</p>
                  <Link href="/"><Button variant="link" className="text-orange-600 mt-2 font-bold p-0">Chọn ngay</Button></Link>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white font-headline">
              <Plus className="w-5 h-5 text-blue-500" /> Thêm đồ dùng khác
            </h3>
            <div className="flex gap-2">
              <Input 
                placeholder="Gia vị, đồ dùng..." 
                className="h-11 rounded-xl bg-gray-50 dark:bg-gray-900 border-none shadow-none font-bold flex-1"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExtra()}
              />
              <Button onClick={handleAddExtra} disabled={!newItem.trim()} className="bg-orange-600 rounded-xl h-11 px-4 text-white shadow-none border-none"><Plus className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 print:col-span-12">
          <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm min-h-[700px] flex flex-col print:border-none print:shadow-none print:p-0">
            {isListEmpty ? <EmptyStatePlaceholder /> : <DetailedListContent />}
          </div>
        </div>
      </div>
    </div>
  );

  function EmptyStatePlaceholder() {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 py-20 print:hidden">
        <ShoppingCart className="w-20 h-20 mb-6 text-gray-300" />
        <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white font-headline">Danh sách trống</h3>
        <p className="max-w-xs mx-auto text-sm leading-relaxed text-gray-500 px-4">Hãy chọn công thức hoặc thêm món cần mua để bắt đầu lên danh sách đi chợ.</p>
      </div>
    );
  }

  function DetailedListContent() {
    return (
      <div className="space-y-12">
        {consolidatedIngredients.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8 print:mb-4">
              <h2 className="text-xl font-bold flex items-center gap-3 text-gray-800 dark:text-white font-headline print:text-black">
                <CheckCircle2 className="w-6 h-6 text-green-600 print:hidden" /> 
                <span>Nguyên liệu</span>
              </h2>
              <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-3 py-1 rounded-full uppercase tracking-widest print:hidden">{consolidatedIngredients.length} mục</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1 print:grid-cols-1">
              {consolidatedIngredients.map((data) => {
                const isChecked = checkedIngredients.includes(data.name);
                return (
                  <div 
                    key={data.name} 
                    className="flex items-center gap-3 py-3 md:py-4 transition-all cursor-pointer group border-b border-gray-50 last:border-0 md:border-0 print:border-b print:border-gray-100"
                    onClick={() => toggleIngredientChecked(data.name)}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all print:hidden",
                      isChecked ? "bg-green-500 border-green-500" : "border-gray-200 bg-white"
                    )}>
                      {isChecked && <Check className="w-4 h-4 text-white stroke-[4px]" />}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <p className={cn(
                        "font-bold text-sm capitalize transition-all truncate",
                        isChecked ? "text-gray-300 line-through print:text-gray-400" : "text-gray-800 dark:text-white print:text-black"
                      )}>{data.name}</p>
                      <div className="flex flex-wrap gap-1 justify-end shrink-0">
                        {data.quantities.map((q, idx) => (
                          <span key={idx} className={cn(
                            "text-sm font-black transition-all",
                            isChecked ? "text-gray-200 print:text-gray-300" : "text-orange-600 print:text-black"
                          )}>{q}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {extraItems.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 pt-8 border-t border-dashed border-gray-100 print:pt-4">
            <div className="flex items-center gap-3 mb-8 print:mb-4">
              <ListChecks className="w-6 h-6 text-blue-600 print:hidden" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white font-headline print:text-black">Đồ dùng khác</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1 print:grid-cols-1">
              {extraItems.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center gap-3 py-3 md:py-4 transition-all cursor-pointer group border-b border-gray-50 last:border-0 md:border-0 print:border-b print:border-gray-100"
                  onClick={() => toggleExtraItem(item.id)}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all print:hidden",
                    item.is_checked ? "bg-green-500 border-green-500" : "border-gray-200 bg-white"
                  )}>
                    {item.is_checked && <Check className="w-4 h-4 text-white stroke-[4px]" />}
                  </div>
                  <span className={cn(
                    "text-sm font-bold flex-1 truncate",
                    item.is_checked ? "text-gray-300 line-through print:text-gray-400" : "text-gray-800 dark:text-white print:text-black"
                  )}>{item.name}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeExtraItem(item.id); }}
                    className="p-2 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 print:hidden"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="!mt-0 pt-8 border-t border-gray-50 print:hidden">
          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-3xl flex gap-4 border border-blue-100 dark:border-blue-800/50">
            <AlertCircle className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed mb-0 font-body">
              Hệ thống đã tự động cộng dồn và quy đổi nguyên liệu về đơn vị gốc giúp bạn để việc mua sắm chính xác nhất.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const MobileView = () => (
    <div className="max-w-7xl mx-auto px-4">
      <div className="fixed top-0 left-0 right-0 z-40 px-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 h-12 flex items-center justify-between shadow-none print:hidden">
        <NavbarContent />
      </div>

      <div className="pt-12 mt-4 print:pt-0 print:mt-0">
        <div className="space-y-8 print:hidden">
          {/* Extra Items Input - MOVED TO TOP */}
          <div className="flex flex-col gap-4">
            <div className="px-1">
              <h3 className="text-xl font-bold flex items-center gap-3 text-gray-800 dark:text-white font-headline">
                <ShoppingBag className="w-6 h-6 text-blue-500" /> 
                <span>Mua thêm gì khác?</span>
              </h3>
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="VD: Nước mắm, khăn giấy..." 
                className="h-11 rounded-xl bg-gray-100 border-none shadow-none font-bold"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExtra()}
              />
              <Button onClick={handleAddExtra} disabled={!newItem.trim()} className="bg-orange-600 rounded-xl h-11 w-11 p-0 shrink-0 text-white border-none shadow-none"><Plus className="w-6 h-6" /></Button>
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full" /> {/* Divider 1 */}

          {/* Selected Recipes Section (Collapsible) */}
          <Collapsible
            open={isRecipesExpanded}
            onOpenChange={setIsRecipesExpanded}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xl font-bold flex items-center gap-3 text-gray-800 dark:text-white font-headline">
                <Store className="w-6 h-6 text-orange-500" /> 
                <span>Thực đơn ({selectedRecipes.length})</span>
              </h3>
              {selectedRecipes.length > 0 && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider text-blue-600 gap-1">
                    {isRecipesExpanded ? "Thu gọn" : "Xem tất cả"}
                    {isRecipesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </Button>
                </CollapsibleTrigger>
              )}
            </div>

            {selectedRecipes.length > 0 ? (
              <CollapsibleContent className="space-y-2 animate-in fade-in duration-300">
                {selectedRecipes.map(recipe => (
                  <div key={recipe.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                      <img src={recipe.image_url || 'https://picsum.photos/50'} className="w-full h-full object-cover" alt="" />
                    </div>
                    <span className="flex-1 text-sm font-bold truncate">{recipe.title}</span>
                    <button onClick={() => toggleRecipeInList(recipe.id)} className="p-1 text-gray-300 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </CollapsibleContent>
            ) : (
              <div className="px-1">
                <Link href="/">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-dashed border-gray-300 text-gray-400 font-bold gap-2">
                    <Plus className="w-4 h-4" /> Chọn món từ sổ tay
                  </Button>
                </Link>
              </div>
            )}
          </Collapsible>

          <div className="h-px bg-gray-100 w-full" /> {/* Divider 2 */}
        </div>

        {/* Content Section (Flat on Mobile) */}
        <div className="min-h-[400px] py-4 print:p-0">
          {isListEmpty ? <EmptyStatePlaceholder /> : <DetailedListContent />}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 dark:bg-gray-900 pb-32 print:bg-white print:pb-0 transition-colors duration-300">
      {isMobile ? <MobileView /> : <DesktopView />}

      <ConfirmationModal 
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="Xóa danh sách đi chợ?"
        message="Hành động này sẽ xóa toàn bộ món ăn và đồ dùng trong danh sách hiện tại. Bạn có chắc chắn không?"
        confirmText="Xóa sạch"
      />
    </div>
  );
}
