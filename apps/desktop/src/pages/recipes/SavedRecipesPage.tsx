import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/ui';
import { Trash2, CalendarDays, Tags, Search, Heart } from 'lucide-react';
import type { RecipeViewType } from '../../components/recipes/list/RecipeCard';
import { RecipeCard } from '../../components/recipes/list/RecipeCard';
import { RecipeListToolbar } from '../../components/recipes/list/RecipeListToolbar';
import { RecipeFilterDrawer, defaultFilterState } from '../../components/recipes/list/RecipeFilterDrawer';
import type { RecipeFilterState } from '../../components/recipes/list/RecipeFilterDrawer';
import { useRecipeStore } from '../../store/useRecipeStore';
import type { Recipe } from '@apron/core';
import { EmptyState } from '../../components/shared/EmptyState';

export function SavedRecipesPage() {
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

  const { recipes, fetchRecipes, updateRecipe, deleteRecipe } = useRecipeStore();

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    recipes.forEach(r => {
      if (!r.parent_id && r.tags && r.is_favorite) {
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
    
    // Filter out children (variants) and only show favorites
    result = result.filter(r => !r.parent_id && r.is_favorite);

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
        navigate(`/recipes/${recipe.id}/edit`);
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

  const handleBulkUnsave = async () => {
    if (window.confirm(`Bạn có chắc chắn muốn bỏ lưu ${selectedIds.size} công thức này không?`)) {
      const updates = Array.from(selectedIds).map(id => {
        const recipe = recipes.find(r => r.id === id);
        return recipe ? updateRecipe({ ...recipe, is_favorite: false }) : Promise.resolve();
      });
      await Promise.all(updates);
      setSelectedIds(new Set());
      setIsSelectMode(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 w-full pt-6 pb-8">
      {/* Header & Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left side: Add New + Title */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="w-14 h-14 rounded-2xl shadow-sm shrink-0 bg-primary/10 flex items-center justify-center text-primary">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground leading-tight">Đã lưu</h1>
            <p className="text-default-500">{filteredAndSortedRecipes.length} công thức yêu thích</p>
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
            <Button color="primary" variant="flat" startContent={<CalendarDays className="w-4 h-4" />}>
              Thêm vào thực đơn
            </Button>
            <Button color="secondary" variant="flat" startContent={<Tags className="w-4 h-4" />}>
              Gắn thẻ
            </Button>
            <Button color="danger" variant="flat" startContent={<Trash2 className="w-4 h-4" />} onPress={handleBulkUnsave}>
              Bỏ lưu
            </Button>
            
            <div className="w-px h-8 bg-default-200 mx-1 shrink-0" />
            
            <Button variant="light" onPress={toggleSelectMode}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {/* Grid / List */}
      {filteredAndSortedRecipes.length === 0 ? (
        <EmptyState
          icon={searchQuery ? <Search className="w-10 h-10 text-default-300" /> : <Heart className="w-10 h-10 text-default-300" />}
          title={searchQuery ? 'Không tìm thấy công thức' : 'Chưa lưu công thức nào'}
          description={searchQuery 
            ? 'Thử thay đổi từ khóa tìm kiếm hoặc xóa bớt bộ lọc để xem các công thức khác.' 
            : 'Hãy khám phá các công thức ngon và lưu lại để dễ dàng truy cập sau này nhé.'}
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
    </div>
  );
}
