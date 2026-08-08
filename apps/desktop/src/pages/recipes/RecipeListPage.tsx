import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@apron/ui';
import { Plus, Trash2, CalendarDays, Tags, Search } from 'lucide-react';
import type { RecipeViewType } from '../../components/recipes/list/RecipeCard';
import { RecipeCard } from '../../components/recipes/list/RecipeCard';
import { RecipeListToolbar } from '../../components/recipes/list/RecipeListToolbar';
import { useRecipeStore } from '../../store/useRecipeStore';
import { useEffect } from 'react';

export function RecipeListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState<RecipeViewType>('grid-portrait');
  const [sortOption, setSortOption] = useState('newest');
  
  // Selection
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { recipes, fetchRecipes, deleteBulkRecipes } = useRecipeStore();

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const filteredAndSortedRecipes = useMemo(() => {
    let result = [...recipes];
    
    // Filter out children (variants)
    result = result.filter(r => !r.parent_id);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => r.title.toLowerCase().includes(q));
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
  }, [recipes, searchQuery, sortOption]);

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

  const handleBulkDelete = async () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.size} công thức này không?`)) {
      await deleteBulkRecipes(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectMode(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 w-full pb-8">
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
            <p className="text-default-500">{recipes.length} công thức đã lưu</p>
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
            filterCount={0}
            onOpenFilter={() => console.log('open filter')}
            onToggleSelectMode={toggleSelectMode}
          />
        </div>
      </div>

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
      {filteredAndSortedRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
          <div className="w-24 h-24 bg-default-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-default-300" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Không tìm thấy công thức</h3>
          <p className="text-default-500 max-w-md">
            Thử thay đổi từ khóa tìm kiếm hoặc xóa bớt bộ lọc để xem các công thức khác.
          </p>
        </div>
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
                variantCount={variantCount}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
