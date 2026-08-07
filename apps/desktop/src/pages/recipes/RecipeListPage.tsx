import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@apron/ui';
import { Plus, Trash2, CalendarDays, Tags, Search } from 'lucide-react';
import type { RecipeViewType } from '../../components/recipes/list/RecipeCard';
import { RecipeCard } from '../../components/recipes/list/RecipeCard';
import { RecipeListToolbar } from '../../components/recipes/list/RecipeListToolbar';
import { PageHeader } from '../../components/layout/PageHeader';
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
      {/* Header */}
      <PageHeader
        title="Sổ tay Công thức"
        description={`${recipes.length} công thức đã lưu`}
        showBackButton={false}
        actions={
          <>
            <Button 
              variant="flat" 
              color={isSelectMode ? "primary" : "default"} 
              onPress={toggleSelectMode}
              className="flex-1 sm:flex-none"
            >
              {isSelectMode ? "Hủy chọn" : "Chọn nhiều"}
            </Button>
            <Button 
              color="primary" 
              startContent={<Plus className="w-5 h-5" />}
              onPress={() => navigate('/recipes/new')}
              className="flex-1 sm:flex-none"
            >
              Thêm mới
            </Button>
          </>
        }
      />

      <RecipeListToolbar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewType={viewType}
        onViewTypeChange={setViewType}
        sortOption={sortOption}
        onSortOptionChange={setSortOption}
        filterCount={0}
        onOpenFilter={() => console.log('open filter')}
      />

      {/* Action bar for Multi-select */}
      {isSelectMode && selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-primary-50 border border-primary-100 p-3 rounded-xl sticky top-0 z-20 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="flat" onPress={selectAll}>
              {selectedIds.size === filteredAndSortedRecipes.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>
            <span className="text-sm font-medium text-primary-700">
              Đã chọn {selectedIds.size} công thức
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" color="primary" variant="flat" startContent={<CalendarDays className="w-4 h-4" />}>
              Thêm vào thực đơn
            </Button>
            <Button size="sm" color="secondary" variant="flat" startContent={<Tags className="w-4 h-4" />}>
              Gắn thẻ
            </Button>
            <Button size="sm" color="danger" variant="flat" startContent={<Trash2 className="w-4 h-4" />} onPress={handleBulkDelete}>
              Xóa
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
          ${viewType === 'list' ? 'flex flex-col gap-2' : ''}
        `}>
          {filteredAndSortedRecipes.map(recipe => (
            <RecipeCard 
              key={recipe.id}
              recipe={recipe}
              viewType={viewType}
              selectable={isSelectMode}
              isSelected={selectedIds.has(recipe.id)}
              onSelectChange={() => toggleSelect(recipe.id)}
              onClick={() => handleCardClick(recipe.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
