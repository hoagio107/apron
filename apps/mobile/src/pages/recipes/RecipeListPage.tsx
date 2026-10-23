import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/ui';
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
import { ImagePickerModal } from '../../components/recipes/form/ImagePickerModal';
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

  const { recipes, fetchRecipes, deleteBulkRecipes, updateRecipe, deleteRecipe } = useRecipeStore();
  const { addMealPlanEntry } = useMealPlanStore();

  const [isMealPlannerModalOpen, setIsMealPlannerModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

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
    (filters.minRating ? 1 : 0);

  const filteredAndSortedRecipes = useMemo(() => {
    let result = [...recipes];
    
    // Filter out children (variants)
    result = result.filter(r => !r.parent_id);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => r.title.toLowerCase().includes(q));
    }
    
    // Filters
    if (filters.difficulties.length > 0) {
      result = result.filter(r => filters.difficulties.includes(r.difficulty));
    }
    
    if (filters.maxTime !== null) {
      result = result.filter(r => (r.prep_time + r.cook_time) <= filters.maxTime!);
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
        case 'newest':
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        case 'oldest':
          return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
        case 'highest_rated':
          return b.taste_score - a.taste_score;
        case 'quickest':
          return (a.prep_time + a.cook_time) - (b.prep_time + b.cook_time);
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
      case 'favorite':
        await updateRecipe({ ...recipe, is_favorite: !recipe.is_favorite });
        break;
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
    await deleteBulkRecipes(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  const handleBulkAddToMealPlan = async (date: string, slotId: string) => {
    try {
      for (const id of Array.from(selectedIds)) {
        await addMealPlanEntry(date, { recipe_id: id, meal_type: slotId });
      }
      alert(`Đã thêm ${selectedIds.size} công thức vào thực đơn!`);
      toggleSelectMode();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra.');
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
      alert(`Đã gắn thẻ cho ${selectedIds.size} công thức!`);
      toggleSelectMode();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra.');
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
      alert(`Đã gán cha cho ${selectedIds.size} công thức!`);
      toggleSelectMode();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra.');
    }
  };

  const handleBulkAddImages = async (images: string[], _videos: string[]) => {
    try {
      for (const id of Array.from(selectedIds)) {
        const recipe = recipes.find(r => r.id === id);
        if (recipe) {
          const currentImages = recipe.images || (recipe.image_url ? [recipe.image_url] : []);
          const newImages = [...currentImages, ...images];
          const updates: Partial<Recipe> = { images: newImages };
          if (!recipe.image_url && newImages.length > 0) {
            updates.image_url = newImages[0];
          }
          await updateRecipe({ ...recipe, ...updates });
        }
      }
      alert(`Đã thêm ảnh vào ${selectedIds.size} công thức!`);
      toggleSelectMode();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra.');
    }
  };

  return (
    <div className="flex flex-col min-h-full gap-6 w-full pt-6 pb-16 px-4 md:px-8">
      <PageHeader
        title="Sổ tay Công thức"
        description={`${recipes.length} công thức đã lưu`}
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
            { key: 'meal-plan', label: 'Thực đơn', icon: <CalendarDays className="w-4 h-4" />, color: 'primary', onPress: () => setIsMealPlannerModalOpen(true) },
            { key: 'tags', label: 'Gắn thẻ', icon: <Tags className="w-4 h-4" />, color: 'secondary', onPress: () => setIsTagModalOpen(true) },
            { key: 'images', label: 'Thêm ảnh', icon: <ImageIcon className="w-4 h-4" />, color: 'warning', onPress: () => setIsImagePickerOpen(true) },
            { key: 'parent', label: 'Gán cha', icon: <LinkIcon className="w-4 h-4" />, color: 'default', onPress: () => setIsParentModalOpen(true) },
            { key: 'delete', label: 'Xóa', icon: <Trash2 className="w-4 h-4" />, color: 'danger', onPress: handleBulkDelete },
          ]}
        />
      )}

      {/* Grid / List */}
      {filteredAndSortedRecipes.length === 0 ? (
        <EmptyState
          icon={<Search className="w-10 h-10 text-default-300" />}
          title="Không tìm thấy công thức"
          description="Thử thay đổi từ khóa tìm kiếm hoặc xóa bớt bộ lọc để xem các công thức khác."
        />
      ) : (
        <div className={`
          ${viewType === 'grid-portrait' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6' : ''}
          ${viewType === 'grid-square' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6' : ''}
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
      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onOpenChange={setIsImagePickerOpen}
        onSelectMedia={handleBulkAddImages}
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
