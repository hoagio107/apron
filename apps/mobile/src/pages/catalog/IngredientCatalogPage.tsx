import { useState, useMemo, useEffect } from 'react';
import { 
  Button, 
  PageHeader, 
  ListToolbar, 
  EmptyState, 
  toast 
} from '@/ui';
import type { ToolbarFilterItem } from '@/ui';
import {
  Plus,
  BookOpen,
  Search,
  LayoutGrid,
  List
} from 'lucide-react';
import { CATEGORIES, autoCategorizeIngredient } from '@apron/core';
import {
  useIngredientCatalogStore,
  type IngredientMeta
} from '../../store/useIngredientCatalogStore';
import { useRecipeStore } from '../../store/useRecipeStore';
import { IngredientCard } from './components/IngredientCard';
import { IngredientListItem } from './components/IngredientListItem';
import { IngredientModal } from './components/IngredientModal';
import { CascadeDeleteModal } from './components/CascadeDeleteModal';

export function IngredientCatalogPage() {
  const {
    getAllIngredients,
    updateIngredientMeta,
    addIngredientMeta,
    removeIngredientMeta
  } = useIngredientCatalogStore();

  const {
    recipes,
    updateIngredientInRecipes,
    removeIngredientFromRecipes,
    detachIngredientFromRecipes
  } = useRecipeStore();

  const items = getAllIngredients();

  // View mode (grid vs list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('ingredient_view_mode') as 'grid' | 'list') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('ingredient_view_mode', viewMode);
  }, [viewMode]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'category'>('name-asc');

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IngredientMeta | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<IngredientMeta | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const cat = item.default_category || autoCategorizeIngredient(item.name);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [items]);

  // Filter options for ListToolbar (no usage statistics)
  const filterItems = useMemo(() => {
    const list: ToolbarFilterItem[] = [
      { key: 'all', label: 'Tất cả nguyên liệu', count: items.length }
    ];

    Object.values(CATEGORIES).forEach(cat => {
      const count = categoryCounts[cat] || 0;
      if (count > 0) {
        list.push({
          key: `cat:${cat}`,
          label: cat,
          count
        });
      }
    });

    return list;
  }, [items.length, categoryCounts]);

  const selectedFilterKey = useMemo(() => {
    if (selectedCategory) return `cat:${selectedCategory}`;
    return 'all';
  }, [selectedCategory]);

  const handleFilterChange = (key: string) => {
    if (key.startsWith('cat:')) {
      setSelectedCategory(key.replace('cat:', ''));
    } else {
      setSelectedCategory(null);
    }
  };

  const sortItems = [
    { key: 'name-asc', label: 'Tên A-Z' },
    { key: 'name-desc', label: 'Tên Z-A' },
    { key: 'category', label: 'Nhóm danh mục' }
  ];

  // Filtered and sorted ingredients
  const filteredItems = useMemo(() => {
    let result = [...items];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        const cat = item.default_category || autoCategorizeIngredient(item.name);
        return (
          item.name.toLowerCase().includes(q) ||
          cat.toLowerCase().includes(q) ||
          Boolean(item.default_unit?.toLowerCase().includes(q))
        );
      });
    }

    // 2. Category Filter
    if (selectedCategory) {
      result = result.filter(item => {
        const cat = item.default_category || autoCategorizeIngredient(item.name);
        return cat === selectedCategory;
      });
    }

    // 3. Sort
    return result.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name, 'vi');
      }
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name, 'vi');
      }
      if (sortBy === 'category') {
        const catA = a.default_category || autoCategorizeIngredient(a.name);
        const catB = b.default_category || autoCategorizeIngredient(b.name);
        const catDiff = catA.localeCompare(catB, 'vi');
        if (catDiff !== 0) return catDiff;
        return a.name.localeCompare(b.name, 'vi');
      }
      return 0;
    });
  }, [items, searchQuery, selectedCategory, sortBy]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (item: IngredientMeta) => {
    setEditingItem(item);
    setIsAddEditOpen(true);
  };

  const handleSaveIngredient = async (
    data: { name: string; default_category?: string; default_unit?: string; image_url?: string },
    id?: string
  ) => {
    if (id) {
      // Editing
      const oldItem = items.find(i => i.id === id);
      if (oldItem && oldItem.name !== data.name) {
        await updateIngredientInRecipes(id, data.name);
      }
      updateIngredientMeta(id, data);
      toast.success(`Đã cập nhật nguyên liệu "${data.name}"`);
    } else {
      // Adding new
      addIngredientMeta(data.name, data);
      toast.success(`Đã thêm nguyên liệu "${data.name}" vào từ điển`);
    }
  };

  const handleDeleteRequest = (item: IngredientMeta) => {
    setDeletingItem(item);
    setIsDeleteOpen(true);
    setIsAddEditOpen(false);
  };

  // Safe recipe association check when deleting
  const deletingItemAffectedRecipes = useMemo(() => {
    if (!deletingItem) return [];
    return recipes.filter(r =>
      r.ingredients?.some(i => i.ingredient_id === deletingItem.id)
    );
  }, [deletingItem, recipes]);

  const handleDirectDelete = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      removeIngredientMeta(deletingItem.id);
      toast.success(`Đã xoá "${deletingItem.name}" khỏi từ điển`);
    } finally {
      setIsDeleting(false);
      setDeletingItem(null);
    }
  };

  const handleDetachDelete = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      await detachIngredientFromRecipes(deletingItem.id);
      removeIngredientMeta(deletingItem.id);
      toast.success(
        `Đã gỡ liên kết và giữ tên "${deletingItem.name}" trong các công thức`
      );
    } finally {
      setIsDeleting(false);
      setDeletingItem(null);
    }
  };

  const handleCascadeRemove = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      await removeIngredientFromRecipes(deletingItem.id);
      removeIngredientMeta(deletingItem.id);
      toast.success(
        `Đã xoá hoàn toàn "${deletingItem.name}" khỏi từ điển và các công thức`
      );
    } finally {
      setIsDeleting(false);
      setDeletingItem(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
  };

  return (
    <div className="flex flex-col min-h-full gap-6 w-full pt-6 pb-28 px-4 md:px-8">
      {/* 1. Header & Toolbar chuẩn hệ thống */}
      <PageHeader
        title="Từ điển nguyên liệu"
        description={
          filteredItems.length === items.length
            ? `${items.length} nguyên liệu đã lưu trữ`
            : `Hiển thị ${filteredItems.length} / ${items.length} nguyên liệu`
        }
        actions={
          <ListToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Tìm kiếm nguyên liệu..."
            filterItems={filterItems}
            selectedFilter={selectedFilterKey}
            onFilterChange={handleFilterChange}
            sortItems={sortItems}
            selectedSort={sortBy}
            onSortChange={(key) => setSortBy(key as 'name-asc' | 'name-desc' | 'category')}
            onAdd={handleOpenAdd}
            addLabel="Thêm mới"
            extraActions={
              <Button
                isIconOnly
                variant="flat"
                aria-label={viewMode === 'grid' ? 'Chuyển sang dạng danh sách' : 'Chuyển sang dạng lưới'}
                onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? (
                  <List className="w-5 h-5 text-default-600" />
                ) : (
                  <LayoutGrid className="w-5 h-5 text-default-600" />
                )}
              </Button>
            }
          />
        }
      />

      {/* 2. Content: Empty / Grid / List */}
      <div className="flex-1 w-full">
        {items.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-12 h-12 text-default-300" />}
            title="Từ điển đang trống"
            description="Bắt đầu thêm nguyên liệu đầu tiên để xây dựng từ điển bếp của bạn."
            action={
              <Button
                color="primary"
                onPress={handleOpenAdd}
                startContent={<Plus className="w-4 h-4" />}
                className="h-11 rounded-xl px-5 font-semibold text-sm shadow-xs"
              >
                Thêm nguyên liệu
              </Button>
            }
          />
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-default-100 flex items-center justify-center text-default-400 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-foreground">Không tìm thấy nguyên liệu</h3>
            <p className="text-xs text-default-500 max-w-xs mt-1 mb-4">
              Không có nguyên liệu nào khớp với từ khoá hoặc nhóm phân loại đang chọn.
            </p>
            <Button
              variant="flat"
              size="sm"
              onPress={resetFilters}
              className="rounded-xl h-9 text-xs"
            >
              Xoá bộ lọc tìm kiếm
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {filteredItems.map(item => (
              <IngredientCard
                key={item.id}
                item={item}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col rounded-2xl bg-content1 border border-divider/60 overflow-hidden divide-y divide-divider/40">
            {filteredItems.map(item => (
              <IngredientListItem
                key={item.id}
                item={item}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. Add / Edit Modal Drawer */}
      <IngredientModal
        isOpen={isAddEditOpen}
        onOpenChange={setIsAddEditOpen}
        item={editingItem}
        onSave={handleSaveIngredient}
        onDeleteRequest={handleDeleteRequest}
      />

      {/* 5. Safe Cascade Delete Modal */}
      <CascadeDeleteModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        item={deletingItem}
        affectedRecipes={deletingItemAffectedRecipes}
        onConfirmDeleteDirect={handleDirectDelete}
        onDetachFromRecipes={handleDetachDelete}
        onRemoveFromRecipes={handleCascadeRemove}
        isLoading={isDeleting}
      />
    </div>
  );
}
