import { useState, useMemo, useEffect, useRef } from 'react';
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
import { MealPlannerSelectModal } from './components/MealPlannerSelectModal';
import { TagSelectModal } from './components/TagSelectModal';
import { ParentRecipeSelectModal } from './components/ParentRecipeSelectModal';
import { BatchImageDrawer } from './components/BatchImageDrawer';
import { useMealPlanStore } from '../../store/useMealPlanStore';
import { Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

import { useTranslation } from 'react-i18next';

// Persistent list state across unmount / navigation
let cachedMobileScrollTop = 0;
let cachedMobileDisplayLimit = 24;
let cachedMobileSearchQuery = '';
let cachedMobileSortOption = 'newest';
let cachedMobileFilters: RecipeFilterState = defaultFilterState;
let cachedMobileViewType: RecipeViewType = 'grid-portrait';

export function RecipeListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(cachedMobileSearchQuery);
  const [viewType, setViewType] = useState<RecipeViewType>(cachedMobileViewType);
  const [sortOption, setSortOption] = useState(cachedMobileSortOption);
  
  // Selection
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filter
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<RecipeFilterState>(cachedMobileFilters);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    cachedMobileSearchQuery = val;
    cachedMobileScrollTop = 0;
    cachedMobileDisplayLimit = 24;
    setDisplayLimit(24);
  };

  const handleSortChange = (opt: string) => {
    setSortOption(opt);
    cachedMobileSortOption = opt;
    cachedMobileScrollTop = 0;
    cachedMobileDisplayLimit = 24;
    setDisplayLimit(24);
  };

  const handleFiltersChange = (f: RecipeFilterState) => {
    setFilters(f);
    cachedMobileFilters = f;
    cachedMobileScrollTop = 0;
    cachedMobileDisplayLimit = 24;
    setDisplayLimit(24);
  };

  const handleViewTypeChange = (v: RecipeViewType) => {
    setViewType(v);
    cachedMobileViewType = v;
  };

  // Confirm modal
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const { recipes, fetchRecipes, deleteBulkRecipes, updateRecipe, deleteRecipe, toggleFavorite, isLoading } = useRecipeStore();
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
    (filters.minRating ? 1 : 0);

  const filteredAndSortedRecipes = useMemo(() => {
    let result = [...recipes];

    // Tìm kiếm theo từ khóa an toàn
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => (r.title || '').toLowerCase().includes(q));
    }
    
    // Lọc độ khó (tương thích cả 'Trung bình' và 'Vừa')
    if (filters.difficulties.length > 0) {
      result = result.filter(r => 
        filters.difficulties.includes(r.difficulty) ||
        (filters.difficulties.includes('Trung bình') && (r.difficulty as string) === 'Vừa') ||
        (filters.difficulties.includes('Vừa') && (r.difficulty as string) === 'Trung bình')
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

  const variantCountsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of recipes) {
      if (r.parent_id) {
        map.set(r.parent_id, (map.get(r.parent_id) || 0) + 1);
      }
    }
    return map;
  }, [recipes]);

  const INITIAL_BATCH = 24;
  const BATCH_SIZE = 24;
  const [displayLimit, setDisplayLimit] = useState(cachedMobileDisplayLimit);

  // Theo dõi vị trí cuộn trên mobile
  useEffect(() => {
    const scrollEl = document.querySelector('main.overflow-y-auto') as HTMLElement | null;
    if (!scrollEl) return;
    const onScroll = () => {
      cachedMobileScrollTop = scrollEl.scrollTop;
    };
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', onScroll);
  }, []);

  const displayedRecipes = useMemo(() => {
    return filteredAndSortedRecipes.slice(0, displayLimit);
  }, [filteredAndSortedRecipes, displayLimit]);

  // Phục hồi lại vị trí cuộn chính xác khi quay lại trang
  useEffect(() => {
    if (cachedMobileScrollTop > 0 && displayedRecipes.length > 0) {
      const scrollEl = document.querySelector('main.overflow-y-auto') as HTMLElement | null;
      if (scrollEl) {
        scrollEl.scrollTop = cachedMobileScrollTop;
      }
      const t1 = setTimeout(() => {
        if (scrollEl && cachedMobileScrollTop > 0) {
          scrollEl.scrollTop = cachedMobileScrollTop;
        }
      }, 50);
      const t2 = setTimeout(() => {
        if (scrollEl && cachedMobileScrollTop > 0) {
          scrollEl.scrollTop = cachedMobileScrollTop;
        }
      }, 150);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [displayedRecipes.length]);

  const hasMore = displayLimit < filteredAndSortedRecipes.length;

  const handleLoadMore = () => {
    setDisplayLimit(prev => {
      const next = Math.min(prev + BATCH_SIZE, filteredAndSortedRecipes.length);
      cachedMobileDisplayLimit = next;
      return next;
    });
  };

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setDisplayLimit(prev => {
          const next = Math.min(prev + BATCH_SIZE, filteredAndSortedRecipes.length);
          cachedMobileDisplayLimit = next;
          return next;
        });
      }
    }, { rootMargin: '300px' });

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, filteredAndSortedRecipes.length]);

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
      const scrollEl = document.querySelector('main.overflow-y-auto') as HTMLElement | null;
      if (scrollEl) {
        cachedMobileScrollTop = scrollEl.scrollTop;
      }
      cachedMobileDisplayLimit = displayLimit;
      navigate(`/recipes/${id}`, { state: { from: '/recipes' } });
    }
  };

  const handleRecipeAction = async (action: string, recipe: Recipe) => {
    switch (action) {
      case 'favorite': {
        const nextFav = !recipe.is_favorite;
        try {
          await toggleFavorite(recipe.id);
          if (nextFav) {
            toast.success(`Đã thêm "${recipe.title}" vào yêu thích!`);
          } else {
            toast.info(`Đã bỏ yêu thích "${recipe.title}".`);
          }
        } catch {
          toast.error('Không thể cập nhật trạng thái yêu thích.');
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
        title={t('recipes.title')}
        description={
          filteredAndSortedRecipes.length === recipes.length
            ? t('recipes.subtitle', { count: recipes.length })
            : `${filteredAndSortedRecipes.length} / ${recipes.length}`
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
            onSearchChange={handleSearchChange}
            viewType={viewType}
            onViewTypeChange={handleViewTypeChange}
            sortOption={sortOption}
            onSortOptionChange={handleSortChange}
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
        onFilterChange={handleFiltersChange}
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
              label: t('recipes.actions.addToMealPlan'), 
              description: t('recipes.actions.addingRecipeCount', { count: selectedIds.size }),
              icon: <CalendarDays className="w-4 h-4" />, 
              color: 'primary', 
              onPress: () => setIsMealPlannerModalOpen(true) 
            },
            { 
              key: 'tags', 
              label: t('recipes.actions.addTags'), 
              description: t('recipes.actions.taggingRecipeCount', { count: selectedIds.size }),
              icon: <Tags className="w-4 h-4" />, 
              color: 'secondary', 
              onPress: () => setIsTagModalOpen(true) 
            },
            { 
              key: 'images', 
              label: t('recipes.actions.addImages'), 
              description: t('recipes.actions.addImages'),
              icon: <ImageIcon className="w-4 h-4" />, 
              color: 'warning', 
              onPress: () => setIsBatchImageDrawerOpen(true) 
            },
            { 
              key: 'parent', 
              label: t('recipes.actions.setParent'), 
              description: t('recipes.actions.settingParentRecipeCount', { count: selectedIds.size }),
              icon: <LinkIcon className="w-4 h-4" />, 
              color: 'default', 
              onPress: () => setIsParentModalOpen(true) 
            },
            { 
              key: 'delete', 
              label: t('common.actions.delete'), 
              description: t('common.confirm.bulkDeleteMessage', { count: selectedIds.size }),
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
          <p className="text-sm text-default-400">{t('common.status.loading')}</p>
        </div>
      ) : filteredAndSortedRecipes.length === 0 ? (
        <EmptyState
          icon={<Search className="w-10 h-10 text-default-300" />}
          title={t('recipes.empty.title')}
          description={t('recipes.empty.description')}
        />
      ) : (
        <div className={`
          ${viewType === 'grid-portrait' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6' : ''}
          ${viewType === 'grid-square' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6' : ''}
          ${viewType === 'grid-landscape' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6' : ''}
          ${viewType === 'grid-portrait-out' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6' : ''}
        `}>
          {displayedRecipes.map(r => {
            const variantCount = variantCountsMap.get(r.id!) || 0;
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
          {hasMore && (
            <div ref={sentinelRef} className="col-span-full flex flex-col items-center justify-center py-6 gap-2">
              <Button 
                variant="flat" 
                size="sm" 
                onPress={handleLoadMore}
                className="text-xs text-default-500 font-medium bg-default-100 dark:bg-default-50/20"
              >
                {t('common.actions.more')} ({displayedRecipes.length}/{filteredAndSortedRecipes.length})
              </Button>
            </div>
          )}
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
        title={t('recipes.actions.delete')}
        description={t('recipes.actions.deleteConfirm', { title: deleteTarget?.title })}
        confirmLabel={t('common.actions.delete')}
        confirmColor="danger"
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteRecipe(deleteTarget.id!);
            setDeleteTarget(null);
            toast.success(t('common.status.deletedSuccessfully'));
          }
        }}
      />
      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        title={t('common.confirm.deleteTitle')}
        description={t('recipes.actions.bulkDeleteConfirm', { count: selectedIds.size })}
        confirmLabel={t('common.actions.delete')}
        confirmColor="danger"
        onConfirm={handleBulkDeleteConfirm}
      />
    </div>
  );
}
