import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { BulkActionBar } from '../../components/shared/BulkActionBar';
import { PageLoader } from '../../components/shared/PageLoader';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { Heart } from 'lucide-react';

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

  // Confirm modals
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null);
  const [isBulkUnsaveOpen, setIsBulkUnsaveOpen] = useState(false);

  const { recipes, fetchRecipes, updateRecipe, deleteRecipe, isLoading } = useRecipeStore();

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
        setDeleteTarget(recipe);
        break;
      case 'meal_plan':
        navigate('/meal-planner');
        break;
    }
  };

  const handleBulkUnsave = () => {
    setIsBulkUnsaveOpen(true);
  };

  const handleBulkUnsaveConfirm = async () => {
    const updates = Array.from(selectedIds).map(id => {
      const recipe = recipes.find(r => r.id === id);
      return recipe ? updateRecipe({ ...recipe, is_favorite: false }) : Promise.resolve();
    });
    await Promise.all(updates);
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  return (
    <div className="flex flex-col min-h-full gap-6 w-full pt-6 pb-28 px-4 md:px-8">
      <PageHeader
        title="Đã lưu"
        description={`${filteredAndSortedRecipes.length} công thức đã lưu`}
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
            { key: 'unsave', label: 'Bỏ lưu', icon: <Heart className="w-4 h-4 fill-current" />, color: 'danger', onPress: handleBulkUnsave },
          ]}
        />
      )}

      {/* Content */}
      <div className="flex-1">
        {isLoading ? (
          <PageLoader minHeight="200px" />
        ) : filteredAndSortedRecipes.length === 0 ? (
          <EmptyState
            icon={<Heart className="w-12 h-12 text-default-300" />}
            title="Chưa có công thức nào được lưu"
            description="Những công thức bạn yêu thích sẽ xuất hiện ở đây."
          />
        ) : (
          <div className={viewType === 'grid-portrait' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
            : "flex flex-col gap-4"
          }>
            {filteredAndSortedRecipes.map(recipe => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                viewType={viewType}
                onAction={(action) => handleRecipeAction(action, recipe)}
                isSelected={selectedIds.has(recipe.id)}
                selectable={isSelectMode}
                onSelectChange={() => toggleSelect(recipe.id)}
                onClick={() => handleCardClick(recipe.id)}
              />
            ))}
          </div>
        )}
      </div>

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
        isOpen={isBulkUnsaveOpen}
        onOpenChange={setIsBulkUnsaveOpen}
        title="Bỏ lưu công thức"
        description={`Bạn có chắc chắn muốn bỏ lưu ${selectedIds.size} công thức đã chọn?`}
        confirmLabel="Bỏ lưu"
        confirmColor="danger"
        onConfirm={handleBulkUnsaveConfirm}
      />
    </div>
  );
}
