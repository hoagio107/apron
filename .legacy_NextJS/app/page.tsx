
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRecipes } from '@/hooks/use-recipes';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { Button } from '@/components/ui/button';
import { 
  Search, Plus, Loader2, SlidersHorizontal, ChevronDown, 
  CheckCircle2, Trash2, X, ChefHat, Menu as MenuIcon,
  Layers, ImagePlus
} from 'lucide-react';
import { FilterDrawer } from '@/components/home/FilterDrawer';
import { ActionBar } from '@/components/shared/ActionBar';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { AssignParentModal } from '@/components/recipes/AssignParentModal';
import { BulkImageUploadModal } from '@/components/recipes/BulkImageUploadModal';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSearchService, useSelectionService, useMobileMenuService } from '@/lib/services';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 40;

export default function DashboardPage() {
  const isMobile = useIsMobile();
  const { recipes, loading, deleteRecipes, updateRecipe } = useRecipes();
  const { toast } = useToast();
  
  const { isFilterOpen, closeFilter, openFilter } = useSearchService();
  const { isSelectionMode, setSelectionMode } = useSelectionService();
  const { toggleMenu } = useMobileMenuService();
  
  const [sortOption, setSortOption] = useState<'date' | 'name'>('date');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignParentModalOpen] = useState(false);
  const [isBulkImageModalOpen, setIsBulkImageModalOpen] = useState(false);
  
  // State cho Infinite Scroll
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const [filters, setFilters] = useState({
    search: '',
    ingredients: new Set<string>(),
    methods: new Set<string>(),
    dishTypes: new Set<string>()
  });

  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedIds(new Set());
    }
  }, [isSelectionMode]);

  // Tối ưu hóa tìm kiếm với useMemo
  const filteredRecipes = useMemo(() => {
    let list = [...recipes].filter(r => !r.parent_id || r.parent_id === "");

    if (filters.search) {
      const term = filters.search.toLowerCase().trim();
      list = list.filter(r => 
        r.title.toLowerCase().includes(term) || 
        r.tags?.some(t => t.toLowerCase().includes(term))
      );
    }

    if (filters.ingredients.size > 0) {
      list = list.filter(r => r.main_ingredients?.some(id => filters.ingredients.has(id)));
    }

    if (filters.methods.size > 0) {
      list = list.filter(r => r.cooking_method && filters.methods.has(r.cooking_method));
    }

    if (sortOption === 'name') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      list.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    }

    return list;
  }, [recipes, filters, sortOption]);

  const selectedRecipesData = useMemo(() => {
    return recipes.filter(r => selectedIds.has(r.id));
  }, [recipes, selectedIds]);

  // Lấy dữ liệu cho trang hiện tại
  const paginatedRecipes = useMemo(() => {
    return filteredRecipes.slice(0, visibleCount);
  }, [filteredRecipes, visibleCount]);

  // Xử lý sự kiện cuộn để tải thêm
  const handleScroll = useCallback(() => {
    if (loading || visibleCount >= filteredRecipes.length) return;

    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 1000) { // Tải trước khi chạm đáy 1000px
      setVisibleCount(prev => prev + ITEMS_PER_PAGE);
    }
  }, [loading, visibleCount, filteredRecipes.length]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Reset pagination khi lọc hoặc đổi sắp xếp
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filters, sortOption]);

  const hasActiveFilters = filters.search || filters.ingredients.size > 0 || filters.methods.size > 0;

  const resetFilters = () => {
    setFilters({
      search: '',
      ingredients: new Set(),
      methods: new Set(),
      dishTypes: new Set()
    });
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchDelete = async () => {
    try {
      await deleteRecipes(Array.from(selectedIds));
      toast({ title: "Đã xóa thành công", description: `Đã xóa ${selectedIds.size} công thức khỏi sổ tay.` });
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi khi xóa" });
    }
  };

  const handleAssignParent = async (parentId: string) => {
    try {
      const ids = Array.from(selectedIds);
      const validIds = ids.filter(id => id !== parentId);
      
      const updatePromises: Promise<any>[] = [];
      
      validIds.forEach(id => {
        // 1. Cập nhật chính món ăn được chọn để trỏ về cha mới
        updatePromises.push(updateRecipe(id, { parent_id: parentId }));
        
        // 2. Tìm và cập nhật toàn bộ các biến thể cũ của món ăn này
        // để chúng cùng trỏ về cha mới (tránh bị ẩn do app chỉ hỗ trợ 1 cấp nesting)
        const currentVariants = recipes.filter(r => r.parent_id === id);
        currentVariants.forEach(variant => {
          updatePromises.push(updateRecipe(variant.id, { parent_id: parentId }));
        });
      });

      await Promise.all(updatePromises);
      
      toast({ 
        title: "Thành công!", 
        description: `Đã gán ${validIds.length} món và các biến thể liên quan vào mục cha mới.` 
      });
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi khi xử lý" });
    }
  };

  const StandardToolbar = () => (
    <header className={cn(
      "fixed top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shadow-none",
      isMobile ? "left-0 right-0 h-12 px-4" : "left-64 right-0 h-16 px-8"
    )}>
      <div className={cn("flex items-center", isMobile ? "gap-0" : "gap-4")}>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={toggleMenu} className="rounded-full shadow-none text-gray-600">
            <MenuIcon className="w-6 h-6" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          {!isMobile && <ChefHat className="w-6 h-6 text-orange-500" />}
          <h1 className={cn("font-bold font-headline truncate", isMobile ? "text-sm max-w-[150px]" : "text-xl")}>
            Trang chủ
          </h1>
        </div>
      </div>

      <div className={cn("flex items-center", isMobile ? "gap-0" : "gap-2")}>
        <Button 
          onClick={openFilter}
          variant={isMobile ? "ghost" : "outline"}
          size={isMobile ? "icon" : "default"}
          className={cn(
            "rounded-xl font-bold transition-all shadow-none",
            isMobile ? "h-9 w-9" : "h-11 gap-2 px-6 border-gray-200 bg-white",
            hasActiveFilters && (isMobile ? "text-orange-600" : "border-orange-500 text-orange-600 bg-orange-50")
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {!isMobile && (hasActiveFilters ? "Đang lọc..." : "Tìm kiếm & Lọc")}
        </Button>

        {!isMobile && (
          <div className="relative">
            <select 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value as any)}
              className="appearance-none h-11 pl-4 pr-10 bg-white dark:bg-gray-800 border border-gray-200 rounded-xl text-sm font-bold outline-none cursor-pointer"
            >
              <option value="date">Mới nhất</option>
              <option value="name">Tên A-Z</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        )}

        <Button 
          variant={isSelectionMode ? "secondary" : "ghost"} 
          size="icon" 
          onClick={() => setSelectionMode(!isSelectionMode)}
          className={cn(
            "h-9 w-9 md:h-11 md:w-11 rounded-xl shadow-none", 
            !isMobile && "md:bg-white md:border md:border-gray-200",
            isSelectionMode && (isMobile ? "text-orange-600" : "bg-orange-100 text-orange-600 border-orange-200")
          )}
        >
          <CheckCircle2 className="w-5 h-5" />
        </Button>

        <Link href="/recipes/new">
          <Button 
            variant={isMobile ? "ghost" : "default"}
            className={cn(
              "h-9 w-9 md:h-11 md:w-auto md:px-6 rounded-xl font-bold shadow-none",
              isMobile ? "text-orange-600 p-0 hover:bg-transparent" : "bg-orange-600 hover:bg-orange-700 text-white border-none"
            )}
          >
            <Plus className="w-5 h-5 md:mr-2" />
            {!isMobile && "Thêm công thức"}
          </Button>
        </Link>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-12 md:pt-16 pb-32">
      <StandardToolbar />
      <FilterDrawer 
        isOpen={isFilterOpen} 
        onClose={closeFilter} 
        filters={filters}
        onFilterChange={setFilters}
        sortOption={sortOption}
        onSortChange={setSortOption}
      />

      <div className="max-w-[1800px] mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex flex-wrap gap-2">
            {hasActiveFilters && (
              <Button variant="secondary" size="sm" onClick={resetFilters} className="rounded-full h-7 text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700">
                Xóa lọc <X className="ml-1 w-3 h-3" />
              </Button>
            )}
            {filters.search && <Badge variant="outline" className="rounded-full text-[10px] border-gray-200">"{filters.search}"</Badge>}
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {filteredRecipes.length} món ăn
          </p>
        </div>

        {loading && visibleCount === ITEMS_PER_PAGE ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 gap-4 md:gap-6">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
              <div key={i} className="bg-white rounded-3xl p-3 animate-pulse h-72 border border-gray-100">
                <div className="aspect-square bg-gray-100 rounded-2xl mb-4" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredRecipes.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 gap-4 md:gap-6">
              {paginatedRecipes.map((recipe) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.has(recipe.id)}
                  onToggleSelection={toggleSelection}
                />
              ))}
            </div>
            
            {visibleCount < filteredRecipes.length && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
              </div>
            )}
          </>
        ) : <EmptyState resetFilters={resetFilters} hasActiveFilters={!!hasActiveFilters} />}
      </div>

      {isSelectionMode && selectedIds.size > 0 && (
        <ActionBar 
          selectedCount={selectedIds.size} 
          onCancel={() => setSelectionMode(false)}
        >
          <div className="flex gap-2 w-full md:w-auto">
            <Button 
              onClick={() => setIsBulkImageModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-2 md:px-6 font-bold gap-2 shadow-none border-none flex-1 md:flex-none"
            >
              <ImagePlus className="w-4 h-4" /> {isMobile ? "Ảnh" : "Thêm ảnh hàng loạt"}
            </Button>
            <Button 
              onClick={() => setIsAssignParentModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl h-12 px-2 md:px-6 font-bold gap-2 shadow-none border-none flex-1 md:flex-none"
            >
              <Layers className="w-4 h-4" /> {isMobile ? "Gán cha" : "Gán công thức cha"}
            </Button>
            <Button 
              onClick={() => setIsDeleteModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-12 px-2 md:px-6 font-bold gap-2 shadow-none border-none flex-1 md:flex-none"
            >
              <Trash2 className="w-4 h-4" /> {isMobile ? "Xóa" : "Xóa đã chọn"}
            </Button>
          </div>
        </ActionBar>
      )}

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleBatchDelete}
        title="Xóa công thức đã chọn?"
        message={`Bạn đang chọn xóa ${selectedIds.size} món ăn. Hành động này không thể hoàn tác.`}
        confirmText="Xóa ngay"
      />

      <AssignParentModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignParentModalOpen(false)}
        onConfirm={handleAssignParent}
        allRecipes={recipes}
        excludeIds={Array.from(selectedIds)}
      />

      <BulkImageUploadModal 
        isOpen={isBulkImageModalOpen}
        onClose={() => { setIsBulkImageModalOpen(false); setSelectionMode(false); }}
        selectedRecipes={selectedRecipesData}
      />
    </div>
  );
}

function EmptyState({ resetFilters, hasActiveFilters }: { resetFilters: () => void, hasActiveFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center bg-white dark:bg-gray-800 rounded-[2.5rem] md:rounded-[3rem] border border-gray-200 border-dashed shadow-none">
      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6 border border-gray-100">
        <Search className="w-10 h-10 text-gray-300" />
      </div>
      <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Không tìm thấy món nào</h3>
      <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto">Thử thay đổi từ khóa hoặc xóa các bộ lọc hiện tại.</p>
      {hasActiveFilters && (
        <Button variant="ghost" onClick={resetFilters} className="mt-4 text-orange-600 font-bold underline">Xóa tất cả lọc</Button>
      )}
    </div>
  );
}
