import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Spinner } from '@/ui';
import { Plus, Search, Trash2, CalendarDays, Tags, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
import { ImagePickerModal } from '../../components/recipes/form/ImagePickerModal';
import { useMealPlanStore } from '../../store/useMealPlanStore';

// Persistent list state across unmount / navigation
let cachedDesktopScrollTop = 0;
let cachedDesktopSearchQuery = '';
let cachedDesktopSortOption = 'newest';
let cachedDesktopFilters: RecipeFilterState = defaultFilterState;
let cachedDesktopViewType: RecipeViewType = 'grid-portrait';

export function RecipeListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(cachedDesktopSearchQuery);
  const [viewType, setViewType] = useState<RecipeViewType>(cachedDesktopViewType);
  const [sortOption, setSortOption] = useState(cachedDesktopSortOption);
  
  // Selection
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filter
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<RecipeFilterState>(cachedDesktopFilters);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    cachedDesktopSearchQuery = val;
    cachedDesktopScrollTop = 0;
    const scrollEl = containerRef.current?.closest('.overflow-y-auto') as HTMLElement | null;
    if (scrollEl) {
      scrollEl.scrollTop = 0;
    }
    rowVirtualizer.scrollToOffset(0);
  };

  const handleSortChange = (opt: string) => {
    setSortOption(opt);
    cachedDesktopSortOption = opt;
    cachedDesktopScrollTop = 0;
    const scrollEl = containerRef.current?.closest('.overflow-y-auto') as HTMLElement | null;
    if (scrollEl) {
      scrollEl.scrollTop = 0;
    }
    rowVirtualizer.scrollToOffset(0);
  };

  const handleFiltersChange = (f: RecipeFilterState) => {
    setFilters(f);
    cachedDesktopFilters = f;
    cachedDesktopScrollTop = 0;
    const scrollEl = containerRef.current?.closest('.overflow-y-auto') as HTMLElement | null;
    if (scrollEl) {
      scrollEl.scrollTop = 0;
    }
    rowVirtualizer.scrollToOffset(0);
  };

  const handleViewTypeChange = (v: RecipeViewType) => {
    setViewType(v);
    cachedDesktopViewType = v;
  };

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
        (filters.difficulties.includes('Trung bình') && r.difficulty === 'Vừa') ||
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

  const variantCountsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of recipes) {
      if (r.parent_id) {
        map.set(r.parent_id, (map.get(r.parent_id) || 0) + 1);
      }
    }
    return map;
  }, [recipes]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const isSidebarPinned = localStorage.getItem('apron_desktop_sidebar_pinned') === 'true';
      const sidebarWidth = isSidebarPinned ? 256 : 80;
      return Math.max(600, window.innerWidth - sidebarWidth - 64);
    }
    return 1200;
  });

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current && containerRef.current.clientWidth > 0) {
        setContainerWidth(containerRef.current.clientWidth);
      } else if (typeof window !== 'undefined') {
        const isSidebarPinned = localStorage.getItem('apron_desktop_sidebar_pinned') === 'true';
        const sidebarWidth = isSidebarPinned ? 256 : 80;
        setContainerWidth(Math.max(600, window.innerWidth - sidebarWidth - 64));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    let ro: ResizeObserver | null = null;
    if (containerRef.current) {
      ro = new ResizeObserver(() => {
        updateWidth();
      });
      ro.observe(containerRef.current);
    }

    // Handles window maximization / resizing shortly after app startup
    const t1 = setTimeout(updateWidth, 50);
    const t2 = setTimeout(updateWidth, 200);

    return () => {
      window.removeEventListener('resize', updateWidth);
      clearTimeout(t1);
      clearTimeout(t2);
      if (ro) {
        ro.disconnect();
      }
    };
  }, []);

  const columnsCount = useMemo(() => {
    if (viewType === 'grid-landscape') {
      if (containerWidth >= 1100) return 4;
      if (containerWidth >= 800) return 3;
      if (containerWidth >= 550) return 2;
      return 1;
    }
    if (viewType === 'grid-portrait-out') {
      if (containerWidth >= 1200) return 5;
      if (containerWidth >= 900) return 4;
      if (containerWidth >= 650) return 3;
      return 2;
    }
    // grid-portrait or grid-square
    if (containerWidth >= 1200) return 6;
    if (containerWidth >= 1000) return 5;
    if (containerWidth >= 750) return 4;
    if (containerWidth >= 550) return 3;
    return 2;
  }, [containerWidth, viewType]);

  const rows = useMemo(() => {
    const chunks: Recipe[][] = [];
    for (let i = 0; i < filteredAndSortedRecipes.length; i += columnsCount) {
      chunks.push(filteredAndSortedRecipes.slice(i, i + columnsCount));
    }
    return chunks;
  }, [filteredAndSortedRecipes, columnsCount]);

  const getItemKey = useCallback((index: number) => {
    const rowRecipes = rows[index];
    return rowRecipes && rowRecipes[0] && rowRecipes[0].id ? rowRecipes[0].id : `row-${index}`;
  }, [rows]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current?.closest('.overflow-y-auto') as HTMLElement | null,
    getItemKey,
    estimateSize: () => {
      const availableWidth = containerWidth > 0 ? containerWidth : 1200;
      const colWidth = Math.max(140, Math.floor((availableWidth - (columnsCount - 1) * 24) / columnsCount));
      if (viewType === 'grid-landscape') return Math.round(colWidth * 3 / 4) + 110;
      if (viewType === 'grid-square') return colWidth + 110;
      if (viewType === 'grid-portrait-out') return Math.round(colWidth * 5 / 4) + 110;
      return Math.round(colWidth * 5 / 4);
    },
    gap: 24,
    overscan: 3,
    initialOffset: cachedDesktopScrollTop,
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [columnsCount, viewType, containerWidth, filteredAndSortedRecipes.length, filters]);

  // Lưu vị trí cuộn khi người dùng cuộn danh sách
  useEffect(() => {
    const scrollEl = containerRef.current?.closest('.overflow-y-auto') as HTMLElement | null;
    if (!scrollEl) return;
    const onScroll = () => {
      cachedDesktopScrollTop = scrollEl.scrollTop;
    };
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', onScroll);
  }, []);

  // Phục hồi lại vị trí cuộn chính xác khi danh sách nạp lại
  useEffect(() => {
    if (cachedDesktopScrollTop > 0 && rows.length > 0) {
      const scrollEl = containerRef.current?.closest('.overflow-y-auto') as HTMLElement | null;
      if (scrollEl) {
        scrollEl.scrollTop = cachedDesktopScrollTop;
        rowVirtualizer.scrollToOffset(cachedDesktopScrollTop);
      }
      const t1 = setTimeout(() => {
        if (scrollEl && cachedDesktopScrollTop > 0) {
          scrollEl.scrollTop = cachedDesktopScrollTop;
          rowVirtualizer.scrollToOffset(cachedDesktopScrollTop);
        }
      }, 50);
      const t2 = setTimeout(() => {
        if (scrollEl && cachedDesktopScrollTop > 0) {
          scrollEl.scrollTop = cachedDesktopScrollTop;
          rowVirtualizer.scrollToOffset(cachedDesktopScrollTop);
        }
      }, 150);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [rows.length]);


  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

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

  const handleCardClick = useCallback((id: string) => {
    if (isSelectMode) {
      toggleSelect(id);
    } else {
      const scrollEl = containerRef.current?.closest('.overflow-y-auto') as HTMLElement | null;
      if (scrollEl) {
        cachedDesktopScrollTop = scrollEl.scrollTop;
      }
      navigate(`/recipes/${id}`, { state: { from: '/recipes' } });
    }
  }, [isSelectMode, navigate, toggleSelect]);

  const handleRecipeAction = async (action: string, recipe: Recipe) => {
    switch (action) {
      case 'favorite':
        await updateRecipe({ ...recipe, is_favorite: !recipe.is_favorite });
        break;
      case 'edit':
        navigate(`/recipes/${recipe.id}/edit`); // Hoặc trang sửa nếu có
        break;
        case 'delete':
          if (window.confirm(t('recipes.actions.deleteConfirm', { title: recipe.title }))) {
            await deleteRecipe(recipe.id!);
          }
          break;
        case 'meal_plan':
          navigate('/meal-planner');
          break;
      }
    };

    const handleBulkDelete = async () => {
      if (window.confirm(t('recipes.actions.bulkDeleteConfirm', { count: selectedIds.size }))) {
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
        alert(t('recipes.detail.addedToMealPlanSuccess'));
        toggleSelectMode();
      } catch (e) {
        console.error(e);
        alert(t('common.status.errorOccurred'));
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
        alert(t('common.status.updatedSuccessfully'));
        toggleSelectMode();
      } catch (e) {
        console.error(e);
        alert(t('common.status.errorOccurred'));
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
        alert(t('common.status.updatedSuccessfully'));
        toggleSelectMode();
      } catch (e) {
        console.error(e);
        alert(t('common.status.errorOccurred'));
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
        alert(t('common.status.updatedSuccessfully'));
        toggleSelectMode();
      } catch (e) {
        console.error(e);
        alert(t('common.status.errorOccurred'));
      }
    };

    return (
      <div ref={containerRef} className="flex flex-col h-full gap-6 w-full pb-8">
        {/* Header & Toolbar */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-6 pb-4 -mx-8 px-8 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-divider/50 shadow-2xs">
          {/* Left side: Add New + Title */}
          <div className="flex items-center gap-4 shrink-0">
            <Button 
              isIconOnly
              color="primary" 
              className="w-14 h-14 rounded-2xl shrink-0"
              onPress={() => navigate('/recipes/new')}
            >
              <Plus className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="app-page-title leading-tight">{t('recipes.title')}</h1>
              <p className="app-page-subtitle">
                {filteredAndSortedRecipes.length === recipes.length
                  ? t('recipes.subtitle', { count: recipes.length })
                  : `${filteredAndSortedRecipes.length} / ${recipes.length}`}
              </p>
            </div>
          </div>

          {/* Right side: Toolbar */}
          <div className="flex-1 w-full xl:w-auto flex justify-end">
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
          </div>
        </div>

        <RecipeFilterDrawer 
          isOpen={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          filters={filters}
          onFilterChange={handleFiltersChange}
          availableTags={availableTags}
        />

        {/* Floating Selection Action Bar */}
        {isSelectMode && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-content1 shadow-2xl border border-divider rounded-full animate-in slide-in-from-bottom-8 fade-in duration-300">
            <div className="flex items-center gap-3">
              <Button variant="flat" onPress={selectAll}>
                {selectedIds.size === filteredAndSortedRecipes.length ? t('common.actions.deselectAll') : t('common.actions.selectAll')}
              </Button>
              <span className="font-medium text-primary min-w-[100px] text-center">
                {t('common.actions.selectedCount', { count: selectedIds.size })}
              </span>
            </div>
            
            <div className="w-px h-8 bg-divider mx-1 shrink-0" />
            
            <div className="flex items-center gap-2">
              <Button color="primary" variant="flat" startContent={<CalendarDays className="w-4 h-4" />} onPress={() => setIsMealPlannerModalOpen(true)}>
                {t('recipes.actions.addToMealPlan')}
              </Button>
              <Button color="secondary" variant="flat" startContent={<Tags className="w-4 h-4" />} onPress={() => setIsTagModalOpen(true)}>
                {t('recipes.actions.addTags')}
              </Button>
              <Button color="warning" variant="flat" startContent={<ImageIcon className="w-4 h-4" />} onPress={() => setIsImagePickerOpen(true)}>
                {t('recipes.actions.addImages')}
              </Button>
              <Button color="default" variant="flat" startContent={<LinkIcon className="w-4 h-4" />} onPress={() => setIsParentModalOpen(true)}>
                {t('recipes.actions.setParent')}
              </Button>
              <Button color="danger" variant="flat" startContent={<Trash2 className="w-4 h-4" />} onPress={handleBulkDelete}>
                {t('common.actions.delete')}
              </Button>
              
              <div className="w-px h-8 bg-divider mx-1 shrink-0" />
              
              <Button variant="light" onPress={toggleSelectMode}>
                {t('common.actions.cancel')}
              </Button>
            </div>
          </div>
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
        <div className="w-full relative" style={{ minHeight: `${rowVirtualizer.getTotalSize()}px` }}>
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const rowRecipes = rows[virtualRow.index];
            if (!rowRecipes) return null;
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className="absolute top-0 left-0 w-full grid gap-6"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))`,
                }}
              >
                {rowRecipes.map(r => (
                  <RecipeCard 
                    key={r.id!} 
                    recipe={r} 
                    viewType={viewType}
                    selectable={isSelectMode}
                    isSelected={selectedIds.has(r.id!)}
                    onSelectChange={() => toggleSelect(r.id!)}
                    onClick={() => handleCardClick(r.id!)}
                    onAction={handleRecipeAction}
                    variantCount={variantCountsMap.get(r.id!) || 0}
                  />
                ))}
              </div>
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
