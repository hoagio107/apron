import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spinner, toast } from '@/ui';
import { BulkActionBar } from '../../components/shared/BulkActionBar';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { PageHeader } from '../../components/layout/PageHeader';
import { Plus, Search, Trash2, CalendarDays, Tags } from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState';
import type { RecipeViewType } from '../../components/recipes/list/RecipeCard';
import { RecipeCard } from '../../components/recipes/list/RecipeCard';
import { RecipeListToolbar } from '../../components/recipes/list/RecipeListToolbar';
import { RecipeFilterDrawer, defaultFilterState } from '../../components/recipes/list/RecipeFilterDrawer';
import type { RecipeFilterState } from '../../components/recipes/list/RecipeFilterDrawer';
import { useRecipeStore } from '../../store/useRecipeStore';
import type { Recipe } from '@apron/core';
import { useEffect } from 'react';
import { MealPlannerSelectModal } from './components/MealPlannerSelectModal';
import { TagSelectModal } from './components/TagSelectModal';
import { ParentRecipeSelectModal } from './components/ParentRecipeSelectModal';
import { BatchImageDrawer } from './components/BatchImageDrawer';
import { useMealPlanStore } from '../../store/useMealPlanStore';
import { Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export function RecipeListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState<RecipeViewType>('grid-portrait');
  const [sortOption, setSortOption] = useState('newest');
  
  // Selection
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filter
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<RecipeFilterState>(defaultFilterState);

  // Confirm modal
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const { recipes, fetchRecipes, deleteBulkRecipes, updateRecipe, deleteRecipe, isLoading } = useRecipeStore();
  const { addMealPlanEntry } = useMealPlanStore();

  const [isMealPlannerModalOpen, setIsMealPlannerModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [isBatchImageDrawerOpen, setIsBatchImageDrawerOpen] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  useEffect(() => {
    if (isSelectMode) {
      document.body.classList.add('multi-select-open');
    } else {
      document.body.classList.remove('multi-select-open');
    }
    return () => document.body.classList.remove('multi-select-open');
  }, [isSelectMode]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    recipes.forEach(r => {
      if (!r.parent_id && r.tags) {
        r.tags.forEach(t => tags.add(t));
      }
    });
    return Array.from(tags).sort();
  }, [recipes]);

  const activeFilterCount = (filters.difficulties.length > 0 ? 1 : 0) + 
    (filters.maxTime !== null ? 1 : 0) + 
    ((filters.tags?.length || 0) > 0 ? 1 : 0) + 
    (filters.cookedStatus && filters.cookedStatus !== 'all' ? 1 : 0) + 
    (filters.minRating ? 1 : 0) +
    (filters.hideVariants ? 1 : 0);

  const filteredAndSortedRecipes = useMemo(() => {
    let result = [...recipes];
    
    // Chỉ ẩn món biến thể khi người dùng chủ động chọn ẩn trong bộ lọc
    if (filters.hideVariants && !searchQuery.trim()) {
      result = result.filter(r => !r.parent_id || !recipes.some(parent => parent.id === r.parent_id));
    }

    // Tìm kiếm theo từ khóa an toàn
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => (r.title || '').toLowerCase().includes(q));
    }
    
    // Lọc độ khó (tương thích cả 'Trung bình' và 'Vừa')
    if (filters.difficulties.length > 0) {
      result = result.filter(r => 
        filters.difficulties.includes(r.difficulty) ||
        (filters.difficulties.includes('Trung bình') && r.difficulty === 'Vừa') ||
        (filters.difficulties.includes('Vừa') && r.difficulty === 'Trung bình')
      );
    }
    
    if (filters.maxTime !== null) {
      result = result.filter(r => ((r.prep_time || 0) + (r.cook_time || 0)) <= filters.maxTime!);
    }

    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(r => r.tags && filters.tags.some(t => r.tags!.includes(t)));
    }

    if (filters.cookedStatus && filters.cookedStatus !== 'all') {
      result = result.filter(r => {
        const isCooked = r.cooking_history && r.cooking_history.length > 0;
        return filters.cookedStatus === 'cooked' ? isCooked : !isCooked;
      });
    }

    if (filters.minRating && filters.minRating > 0) {
      result = result.filter(r => {
        if (!r.cooking_history || r.cooking_history.length === 0) return false;
        const sum = r.cooking_history.reduce((acc: number, curr: any) => acc + curr.rating, 0);
        const avg = sum / r.cooking_history.length;
        return avg >= filters.minRating!;
      });
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest': {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          const validA = isNaN(timeA) ? 0 : timeA;
          const validB = isNaN(timeB) ? 0 : timeB;
          return validB - validA;
        }
        case 'oldest': {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          const validA = isNaN(timeA) ? 0 : timeA;
          const validB = isNaN(timeB) ? 0 : timeB;
          return validA - validB;
        }
        case 'highest_rated':
          return (b.taste_score || 0) - (a.taste_score || 0);
        case 'quickest': {
          const totalA = (a.prep_time || 0) + (a.cook_time || 0);
          const totalB = (b.prep_time || 0) + (b.cook_time || 0);
          return totalA - totalB;
        }
        default:
          return 0;
      }
    });
    
    return result;
  }, [recipes, searchQuery, sortOption, filters]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredAndSortedRecipes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedRecipes.map(r => r.id!)));
    }
  };

  const toggleSelectMode = () => {
    if (isSelectMode) {
      setSelectedIds(new Set());
    }
    setIsSelectMode(!isSelectMode);
  };

  const handleCardClick = (id: string) => {
    if (isSelectMode) {
      toggleSelect(id);
    } else {
      navigate(`/recipes/${id}`);
    }
  };

  const handleRecipeAction = async (action: string, recipe: Recipe) => {
    switch (action) {
      case 'favorite': {
        const nextFav = !recipe.is_favorite;
        await updateRecipe({ ...recipe, is_favorite: nextFav });
        if (nextFav) {
          toast.success(`Đã thêm "${recipe.title}" vào yêu thích!`);
        } else {
          toast.info(`Đã bỏ yêu thích "${recipe.title}".`);
        }
        break;
      }
      case 'edit':
        navigate(`/recipes/${recipe.id}/edit`);
        break;
      case 'delete':
        setDeleteTarget(recipe);
        break;
      case 'meal_plan':
        navigate('/meal-planner');
        break;
    }
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    const count = selectedIds.size;
    await deleteBulkRecipes(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsSelectMode(false);
    toast.success(`Đã xoá ${count} công thức thành công!`);
  };

  const handleBulkAddToMealPlan = async (date: string, slotId: string) => {
    try {
      for (const id of Array.from(selectedIds)) {
        await addMealPlanEntry(date, { recipe_id: id, meal_type: slotId });
      }
      toast.success(`Đã thêm ${selectedIds.size} công thức vào thực đơn!`);
      toggleSelectMode();
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi thêm vào thực đơn.');
    }
  };

  const handleBulkAddTags = async (tags: string[]) => {
    try {
      for (const id of Array.from(selectedIds)) {
        const recipe = recipes.find(r => r.id === id);
        if (recipe) {
          const currentTags = recipe.tags || [];
          const newTags = Array.from(new Set([...currentTags, ...tags]));
          await updateRecipe({ ...recipe, tags: newTags });
        }
      }
      toast.success(`Đã gắn thẻ cho ${selectedIds.size} công thức!`);
      toggleSelectMode();
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi gắn thẻ.');
    }
  };

  const handleBulkSetParent = async (parentId: string) => {
    try {
      for (const id of Array.from(selectedIds)) {
        if (id !== parentId) {
          const recipe = recipes.find(r => r.id === id);
          if (recipe) {
            await updateRecipe({ ...recipe, parent_id: parentId });
          }
        }
      }
      toast.success(`Đã gán món cha cho ${selectedIds.size} công thức!`);
      toggleSelectMode();
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi gán món cha.');
    }
  };

  const handleBulkSaveImages = async (updates: { recipeId: string; imageUrl: string }[]) => {
    try {
      for (const update of updates) {
        const recipe = recipes.find(r => r.id === update.recipeId);
        if (recipe) {
          const currentImages = recipe.images || [];
          let updatedImages = [...currentImages];
          if (update.imageUrl) {
            updatedImages = [update.imageUrl, ...updatedImages.filter(img => img !== update.imageUrl && img !== recipe.image_url)];
          } else {
            updatedImages = updatedImages.filter(img => img !== recipe.image_url);
          }
          await updateRecipe({
            ...recipe,
            image_url: update.imageUrl || '',
            images: updatedImages,
          });
        }
      }
      toast.success(`Đã cập nhật ảnh thành công cho ${updates.length} công thức!`);
      toggleSelectMode();
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi lưu ảnh.');
    }
  };

  return (
    <div className="flex flex-col min-h-full gap-6 w-full pt-6 pb-28 px-4 md:px-8">
      <PageHeader
        title="Sổ tay Công thức"
        description={
          filteredAndSortedRecipes.length === recipes.length
            ? `${recipes.length} công thức đã lưu`
            : `Hiển thị ${filteredAndSortedRecipes.length} / ${recipes.length} công thức`
        }
        prefix={
          <Button 
            isIconOnly
            color="primary" 
            className="hidden md:flex w-14 h-14 rounded-2xl shadow-sm shrink-0"
            onPress={() => navigate('/recipes/new')}
          >
            <Plus className="w-6 h-6" />
          </Button>
        }
        actions={
          <RecipeListToolbar 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewType={viewType}
            onViewTypeChange={setViewType}
            sortOption={sortOption}
            onSortOptionChange={setSortOption}
            filterCount={activeFilterCount}
            onOpenFilter={() => setIsFilterOpen(true)}
            onToggleSelectMode={toggleSelectMode}
          />
        }
      />

      <RecipeFilterDrawer 
        isOpen={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        filters={filters}
        onFilterChange={setFilters}
        availableTags={availableTags}
      />

      {/* Floating Selection Action Bar */}
      {isSelectMode && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalCount={filteredAndSortedRecipes.length}
          onSelectAll={selectAll}
          onCancel={toggleSelectMode}
          actions={[
            { 
              key: 'meal-plan', 
              label: 'Thực đơn', 
              description: 'Lên kế hoạch nấu cho các món đã chọn',
              icon: <CalendarDays className="w-4 h-4" />, 
              color: 'primary', 
              onPress: () => setIsMealPlannerModalOpen(true) 
            },
            { 
              key: 'tags', 
              label: 'Gắn thẻ', 
              description: 'Gắn nhãn phân loại hàng loạt',
              icon: <Tags className="w-4 h-4" />, 
              color: 'secondary', 
              onPress: () => setIsTagModalOpen(true) 
            },
            { 
              key: 'images', 
              label: 'Chèn ảnh cho từng món', 
              description: 'Chọn hoặc tải ảnh riêng cho từng món',
              icon: <ImageIcon className="w-4 h-4" />, 
              color: 'warning', 
              onPress: () => setIsBatchImageDrawerOpen(true) 
            },
            { 
              key: 'parent', 
              label: 'Gán công thức cha', 
              description: 'Liên kết thành nhóm biến thể',
              icon: <LinkIcon className="w-4 h-4" />, 
              color: 'default', 
              onPress: () => setIsParentModalOpen(true) 
            },
            { 
              key: 'delete', 
              label: 'Xoá công thức', 
              description: 'Xoá vĩnh viễn các món đã chọn',
              icon: <Trash2 className="w-4 h-4" />, 
              color: 'danger', 
              onPress: handleBulkDelete 
            },
          ]}
        />
      )}

      {/* Grid / List */}
      {isLoading && recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner size="lg" color="primary" />
          <p className="text-sm text-default-400">Đang tải danh sách công thức...</p>
        </div>
      ) : filteredAndSortedRecipes.length === 0 ? (
        <EmptyState
          icon={<Search className="w-10 h-10 text-default-300" />}
          title="Không tìm thấy công thức"
          description="Thử thay đổi từ khóa tìm kiếm hoặc xóa bớt bộ lọc để xem các công thức khác."
        />
      ) : (
        <div className={`
          ${viewType === 'grid-portrait' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6' : ''}
          ${viewType === 'grid-square' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6' : ''}
          ${viewType === 'grid-landscape' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6' : ''}
          ${viewType === 'grid-portrait-out' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6' : ''}
        `}>
          {filteredAndSortedRecipes.map(r => {
            const variantCount = recipes.filter(child => child.parent_id === r.id).length;
            return (
              <RecipeCard 
                key={r.id!} 
                recipe={r} 
                viewType={viewType}
                selectable={isSelectMode}
                isSelected={selectedIds.has(r.id!)}
                onSelectChange={() => toggleSelect(r.id!)}
                onClick={() => handleCardClick(r.id!)}
                onAction={handleRecipeAction}
                variantCount={variantCount}
              />
            );
          })}
        </div>
      )}

      {/* Modals */}
      <MealPlannerSelectModal 
        isOpen={isMealPlannerModalOpen} 
        onOpenChange={setIsMealPlannerModalOpen} 
        onConfirm={handleBulkAddToMealPlan}
        recipeCount={selectedIds.size}
      />
      <TagSelectModal
        isOpen={isTagModalOpen}
        onOpenChange={setIsTagModalOpen}
        availableTags={availableTags}
        onConfirm={handleBulkAddTags}
        recipeCount={selectedIds.size}
      />
      <ParentRecipeSelectModal
        isOpen={isParentModalOpen}
        onOpenChange={setIsParentModalOpen}
        recipes={recipes}
        onConfirm={handleBulkSetParent}
        recipeCount={selectedIds.size}
      />
      <BatchImageDrawer
        isOpen={isBatchImageDrawerOpen}
        onOpenChange={setIsBatchImageDrawerOpen}
        selectedRecipes={recipes.filter(r => selectedIds.has(r.id!))}
        onSave={handleBulkSaveImages}
      />

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Xoá công thức"
        description={`Bạn có chắc muốn xoá công thức "${deleteTarget?.title}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá"
        confirmColor="danger"
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteRecipe(deleteTarget.id!);
            setDeleteTarget(null);
            toast.success('Đã xoá công thức thành công!');
          }
        }}
      />
      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        title="Xoá nhiều công thức"
        description={`Bạn có chắc chắn muốn xóa ${selectedIds.size} công thức đã chọn? Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá tất cả"
        confirmColor="danger"
        onConfirm={handleBulkDeleteConfirm}
      />
    </div>
  );
}
