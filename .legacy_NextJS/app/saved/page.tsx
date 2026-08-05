
"use client";

import { useMemo, useState, useEffect } from 'react';
import { useRecipes } from '@/hooks/use-recipes';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { Heart, Loader2, CheckCircle2, Trash2, X, ArrowLeft, Menu as MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useMobileMenuService, useSelectionService } from '@/lib/services';
import { ActionBar } from '@/components/shared/ActionBar';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { useToast } from '@/hooks/use-toast';

export default function SavedRecipesPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { recipes, loading, updateRecipe } = useRecipes();
  const { toggleMenu } = useMobileMenuService();
  const { isSelectionMode, setSelectionMode } = useSelectionService();
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  const savedRecipes = useMemo(() => {
    return recipes.filter(r => r.is_favorite);
  }, [recipes]);

  // Reset selection when leaving selection mode
  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedIds(new Set());
    }
  }, [isSelectionMode]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchRemove = async () => {
    try {
      const ids = Array.from(selectedIds);
      const promises = ids.map(id => updateRecipe(id, { is_favorite: false }));
      await Promise.all(promises);
      
      toast({ 
        title: "Đã cập nhật", 
        description: `Đã bỏ yêu thích ${ids.length} món ăn khỏi danh sách.` 
      });
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi khi xử lý" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  const StandardToolbar = () => (
    <header className={cn(
      "fixed top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shadow-none",
      isMobile ? "left-0 right-0 h-12 px-4" : "left-64 right-0 h-16 px-8"
    )}>
      <div className={cn("flex items-center", isMobile ? "gap-0" : "gap-4")}>
        {isMobile ? (
          <Button variant="ghost" size="icon" onClick={toggleMenu} className="rounded-full shadow-none text-gray-600">
            <MenuIcon className="w-6 h-6" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full shadow-none">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        )}
        <h1 className={cn("font-bold font-headline truncate", isMobile ? "text-sm max-w-[150px]" : "text-xl")}>
          Món ăn đã lưu
        </h1>
      </div>
      <div className={cn("flex items-center", isMobile ? "gap-0" : "gap-2")}>
        <Button 
          variant={isSelectionMode ? "secondary" : "outline"} 
          size="icon" 
          onClick={() => setSelectionMode(!isSelectionMode)}
          className={cn(
            "h-9 w-9 md:h-11 md:w-11 rounded-xl shadow-none bg-white", 
            isMobile ? "border-none" : "border-gray-200",
            isSelectionMode && "bg-orange-100 text-orange-600 border-orange-200"
          )}
        >
          <CheckCircle2 className="w-5 h-5" />
        </Button>
        <div className="hidden md:flex items-center gap-2 ml-2 px-4 h-11 border border-gray-200 rounded-xl bg-white shadow-none">
          <Heart className="w-4 h-4 text-red-500 fill-current" />
          <span className="text-sm font-bold text-gray-500">{savedRecipes.length} món</span>
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-12 md:pt-16 pb-32">
      <StandardToolbar />
      <div className="max-w-[1800px] mx-auto p-4 md:p-8">
        {savedRecipes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {savedRecipes.map(recipe => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(recipe.id)}
                onToggleSelection={toggleSelection}
              />
            ))}
          </div>
        ) : <EmptyState />}
      </div>

      {isSelectionMode && selectedIds.size > 0 && (
        <ActionBar 
          selectedCount={selectedIds.size} 
          onCancel={() => setSelectionMode(false)}
        >
          <Button 
            onClick={() => setIsRemoveModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-12 px-6 font-bold gap-2 shadow-none border-none flex-1 md:flex-none"
          >
            <Trash2 className="w-4 h-4" /> Bỏ yêu thích
          </Button>
        </ActionBar>
      )}

      <ConfirmationModal 
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={handleBatchRemove}
        title="Bỏ yêu thích các món đã chọn?"
        message={`Bạn đang chọn xóa ${selectedIds.size} món ăn khỏi danh sách yêu thích.`}
        confirmText="Xác nhận bỏ"
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center bg-white dark:bg-gray-800 rounded-[2.5rem] md:rounded-[3rem] border border-gray-200 border-dashed shadow-none">
      <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 border border-red-100">
        <Heart className="w-12 h-12 text-red-300" />
      </div>
      <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Chưa có món ăn nào</h3>
      <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto mb-8">
        Nhấn vào biểu tượng trái tim trên các món ăn để lưu chúng vào danh sách này.
      </p>
      <Link href="/">
        <Button className="bg-orange-500 hover:bg-orange-600 rounded-2xl px-8 font-bold border-none h-12 shadow-lg shadow-orange-200/20 text-white">
          Kháp phá ngay
        </Button>
      </Link>
    </div>
  );
}
