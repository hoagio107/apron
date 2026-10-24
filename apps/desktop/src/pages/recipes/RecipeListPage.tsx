import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spinner } from '@/ui';
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

  const { recipes, fetchRecipes, deleteBulkRecipes, updateRecipe, deleteRecipe, isLoading } = useRecipeStore();
  const { addMealPlanEntry } = useMealPlanStore();

  const [isMealPlannerModalOpen, setIsMealPlannerModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

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
        case 'highest_rated': {
          const scoreA = typeof a.taste_score === 'number' && !isNaN(a.taste_score) ? a.taste_score : 0;
          const scoreB = typeof b.taste_score === 'number' && !isNaN(b.taste_score) ? b.taste_score : 0;
          return scoreB - scoreA;
        }
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
      setSelectedIds(new Set(filteredAndSortedRecipes.map(r => r.id)));
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
        navigate(`/recipes/${recipe.id}/edit`); // Hoặc trang sửa nếu có
        break;
      case 'delete':
        if (window.confirm(`Bạn có chắc muốn xoá công thức "${recipe.title}"?`)) {
          await deleteRecipe(recipe.id!);
        }
        break;
      case 'meal_plan':
        navigate('/meal-planner');
        break;
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.size} công thức này không?`)) {
      await deleteBulkRecipes(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectMode(false);
    }
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
    <div className="flex flex-col h-full gap-6 w-full pt-6 pb-8">
      {/* Header & Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left side: Add New + Title */}
        <div className="flex items-center gap-4 shrink-0">
          <Button 
            isIconOnly
            color="primary" 
            className="w-14 h-14 rounded-2xl shadow-sm shrink-0"
            onPress={() => navigate('/recipes/new')}
          >
            <Plus className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground leading-tight">Sổ tay Công thức</h1>
            <p className="text-default-500">
              {filteredAndSortedRecipes.length === recipes.length
                ? `${recipes.length} công thức đã lưu`
                : `Hiển thị ${filteredAndSortedRecipes.length} / ${recipes.length} công thức`}
            </p>
          </div>
        </div>

        {/* Right side: Toolbar */}
        <div className="flex-1 w-full xl:w-auto flex justify-end">
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
        </div>
      </div>

      <RecipeFilterDrawer 
        isOpen={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        filters={filters}
        onFilterChange={setFilters}
        availableTags={availableTags}
      />

      {/* Floating Selection Action Bar */}
      {isSelectMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-content1 shadow-2xl border border-default-200 rounded-full animate-in slide-in-from-bottom-8 fade-in duration-300">
          <div className="flex items-center gap-3">
            <Button variant="flat" onPress={selectAll}>
              {selectedIds.size === filteredAndSortedRecipes.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>
            <span className="font-medium text-primary-700 min-w-[100px] text-center">
              Đã chọn {selectedIds.size}
            </span>
          </div>
          
          <div className="w-px h-8 bg-default-200 mx-1 shrink-0" />
          
          <div className="flex items-center gap-2">
            <Button color="primary" variant="flat" startContent={<CalendarDays className="w-4 h-4" />} onPress={() => setIsMealPlannerModalOpen(true)}>
              Thêm vào thực đơn
            </Button>
            <Button color="secondary" variant="flat" startContent={<Tags className="w-4 h-4" />} onPress={() => setIsTagModalOpen(true)}>
              Gắn thẻ
            </Button>
            <Button color="warning" variant="flat" startContent={<ImageIcon className="w-4 h-4" />} onPress={() => setIsImagePickerOpen(true)}>
              Thêm ảnh
            </Button>
            <Button color="default" variant="flat" startContent={<LinkIcon className="w-4 h-4" />} onPress={() => setIsParentModalOpen(true)}>
              Gán cha
            </Button>
            <Button color="danger" variant="flat" startContent={<Trash2 className="w-4 h-4" />} onPress={handleBulkDelete}>
              Xóa
            </Button>
            
            <div className="w-px h-8 bg-default-200 mx-1 shrink-0" />
            
            <Button variant="light" onPress={toggleSelectMode}>
              Hủy
            </Button>
          </div>
        </div>
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
          ${viewType === 'grid-portrait' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6' : ''}
          ${viewType === 'grid-square' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6' : ''}
          ${viewType === 'grid-landscape' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' : ''}
          ${viewType === 'grid-portrait-out' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6' : ''}
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
    </div>
  );
}
