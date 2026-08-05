
"use client";

import { use, useMemo, useState } from 'react';
import { useMenus } from '@/hooks/use-menus';
import { useRecipes } from '@/hooks/use-recipes';
import { Button } from '@/components/ui/button';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { 
  ArrowLeft, Loader2, Plus, LayoutGrid, Trash2, 
  CheckCircle2, Utensils, MoreVertical, Edit3, X, ZoomIn
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { MenuAddRecipeModal } from '@/components/menus/MenuAddRecipeModal';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useImageViewer } from '@/lib/services';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';

export default function MenuDetailPage(props: { params: Promise<{ groupSlug: string, menuSlug: string }> }) {
  const isMobile = useIsMobile();
  const params = use(props.params);
  const { menuSlug } = params;
  const router = useRouter();
  const { toast } = useToast();
  const { open: openLightbox } = useImageViewer();
  const { menus, updateMenu, loading: menusLoading } = useMenus();
  const { recipes, loading: recipesLoading } = useRecipes();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const menu = useMemo(() => menus.find(m => m.slug === menuSlug), [menus, menuSlug]);
  
  const menuRecipes = useMemo(() => {
    if (!menu || !recipes.length) return [];
    const recipeMap = new Map(recipes.map(r => [r.id, r]));
    return (menu.recipe_ids || [])
      .map(id => recipeMap.get(id))
      .filter(Boolean) as any[];
  }, [menu, recipes]);

  const handleAddRecipes = async (newIds: string[]) => {
    if (!menu) return;
    try {
      const updatedIds = [...(menu.recipe_ids || []), ...newIds];
      await updateMenu(menu.id, { recipe_ids: updatedIds });
      toast({ title: "Thành công!", description: `Đã thêm ${newIds.length} món vào thực đơn.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể cập nhật thực đơn." });
    }
  };

  const toggleRecipeSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const removeSelectedRecipes = async () => {
    if (!menu || selectedIds.size === 0) return;
    try {
      const remainingIds = (menu.recipe_ids || []).filter(id => !selectedIds.has(id));
      await updateMenu(menu.id, { recipe_ids: remainingIds });
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      toast({ title: "Đã cập nhật thực đơn" });
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể xóa món ăn." });
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  if (menusLoading || recipesLoading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>;
  if (!menu) return <div className="p-20 text-center">Không tìm thấy thực đơn.</div>;

  const groupImageUrl = menu.image_url || "https://picsum.photos/seed/menu-detail/1200/600";

  const NavbarContent = () => (
    <>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shadow-none">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className={cn("font-bold truncate font-headline", isMobile ? "text-sm max-w-[150px]" : "text-xl max-w-md")}>
          {menu.title}
        </h1>
      </div>
      
      {isMobile ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100">
            <DropdownMenuItem 
              onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }}
              className={cn("rounded-xl p-3 font-bold flex items-center gap-3 cursor-pointer", isSelectionMode && "text-orange-600 bg-orange-50")}
            >
              {isSelectionMode ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4 text-blue-600" />}
              {isSelectionMode ? 'Hủy chế độ sửa' : 'Chọn để xóa món'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setIsAddModalOpen(true)} 
              className="rounded-xl p-3 font-bold flex items-center gap-3 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-green-600" />
              Thêm món vào thực đơn
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }}
            className={cn(
              "rounded-xl font-bold h-10 px-4 transition-all border-gray-200",
              isSelectionMode && "bg-orange-50 text-orange-600 border-orange-200"
            )}
          >
            {isSelectionMode ? 'Hủy' : 'Sửa'}
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-orange-600 hover:bg-orange-700 rounded-xl font-bold h-10 px-5 text-white border-none shadow-none">
            <Plus className="w-4 h-4 mr-2" /> Thêm món
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className={cn("min-h-screen pb-32 pt-14 md:pt-16", isMobile ? "bg-white" : "bg-gray-50 dark:bg-gray-900")}>
      {/* Fixed Navbar Standard */}
      <header className={cn(
        "fixed top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shadow-none",
        isMobile ? "left-0 right-0 h-14 px-4" : "left-64 right-0 h-16 px-8"
      )}>
        <NavbarContent />
      </header>

      {/* Hero Banner */}
      <div 
        className="relative h-[40vh] md:h-[50vh] w-full group overflow-hidden cursor-zoom-in"
        onClick={() => openLightbox(groupImageUrl)}
      >
        <img 
          src={groupImageUrl} 
          alt={menu.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30">
            <ZoomIn className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="absolute bottom-12 left-6 right-6 md:left-12 md:right-12 z-10">
          <div className="max-w-5xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-headline leading-tight drop-shadow-xl">
              {menu.title}
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl line-clamp-3 leading-relaxed drop-shadow-md">
              {menu.description}
            </p>
          </div>
        </div>
      </div>

      <div className={cn("max-w-[1800px] mx-auto relative z-20", isMobile ? "px-0 mt-0" : "px-4 md:px-8 mt-0")}>
        <div className={cn(
          "bg-white dark:bg-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700",
          isMobile ? "bg-transparent dark:bg-transparent shadow-none border-none rounded-none p-6 pt-4" : "rounded-[2.5rem] p-10 mt-8"
        )}>
          <div className="flex items-center gap-5 mb-6 pb-4 md:mb-10 md:pb-8 border-b">
            <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-[1.25rem] bg-orange-100 text-orange-600 shadow-inner shrink-0">
              <LayoutGrid className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white font-headline">Danh sách món ăn</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Tổng cộng {menuRecipes.length} món</p>
            </div>
          </div>

          {menuRecipes.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
              {menuRecipes.map((recipe) => (
                <div key={recipe.id} className="relative group/card h-full">
                  <div className={cn(
                    "h-full transition-all duration-300",
                    isSelectionMode && "cursor-pointer"
                  )} onClick={() => isSelectionMode && toggleRecipeSelection(recipe.id)}>
                    <RecipeCard recipe={recipe} />
                    
                    {isSelectionMode && (
                      <div className={cn(
                        "absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 rounded-3xl flex items-center justify-center transition-all",
                        selectedIds.has(recipe.id) ? "opacity-100 border-2 border-orange-500" : "opacity-0 group-hover/card:opacity-100"
                      )}>
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform",
                          selectedIds.has(recipe.id) ? "bg-orange-500 scale-110" : "bg-white text-gray-400 scale-100"
                        )}>
                          {selectedIds.has(recipe.id) ? <CheckCircle2 className="text-white w-6 h-6" /> : <Plus className="w-6 h-6" />}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-gray-200 mb-6">
                <Utensils className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-400">Thực đơn đang trống</h3>
              <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto leading-relaxed">Bắt đầu thêm những món ăn yêu thích của bạn vào bộ sưu tập này.</p>
              <Button variant="link" onClick={() => setIsAddModalOpen(true)} className="text-orange-600 font-bold mt-4">Thêm món ngay</Button>
            </div>
          )}
        </div>
      </div>

      {/* Selection Action Bar */}
      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-6 duration-500">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-black text-xs">{selectedIds.size}</span>
            <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Mục đã chọn</span>
          </div>
          <div className="h-6 w-px bg-gray-700" />
          <Button variant="ghost" onClick={() => setIsDeleteModalOpen(true)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 font-bold gap-2">
            <Trash2 className="w-4 h-4" /> Xóa khỏi thực đơn
          </Button>
          <Button variant="ghost" onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="text-gray-400 font-bold hover:text-white">
            Hủy
          </Button>
        </div>
      )}

      <MenuAddRecipeModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddRecipes}
        existingIds={menu.recipe_ids || []}
        allRecipes={recipes}
      />

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={removeSelectedRecipes}
        title="Xóa món khỏi thực đơn?"
        message={`Bạn đang chọn xóa ${selectedIds.size} món ăn khỏi thực đơn "${menu.title}". Hành động này không xóa món ăn khỏi sổ tay của bạn.`}
        confirmText="Xác nhận xóa"
      />
    </div>
  );
}
