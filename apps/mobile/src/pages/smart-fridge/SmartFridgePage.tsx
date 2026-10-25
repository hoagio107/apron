import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  EmptyState, 
  PageHeader, 
  ListToolbar, 
  toast 
} from '@/ui';
import type { ToolbarFilterItem } from '@/ui';
import { 
  Plus, 
  Refrigerator, 
  ShoppingCart, 
  LayoutGrid,
  List
} from 'lucide-react';
import { usePantryStore } from '../../store/usePantryStore';
import { CATEGORIES } from '@apron/core';
import type { PantryItem } from '@apron/core';
import { PantryItemCard } from './components/PantryItemCard';
import { PantryItemListItem } from './components/PantryItemListItem';
import { PantryItemModal } from './components/PantryItemModal';
import { ConfirmModal } from '../../components/shared/ConfirmModal';

const isExpired = (date?: string) => {
  if (!date) return false;
  return new Date(date).getTime() < new Date().getTime();
};

const getDaysUntilExpiry = (date?: string): number | null => {
  if (!date) return null;
  const diffTime = new Date(date).getTime() - new Date().getTime();
  return Math.ceil(diffTime / (1000 * 3600 * 24));
};

export function SmartFridgePage() {
  const navigate = useNavigate();
  const { items, addItem, updateItem, removeItem } = usePantryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [freshnessFilter, setFreshnessFilter] = useState<'all' | 'near_expiry' | 'expired'>('all');
  const [sortBy, setSortBy] = useState<'expiry' | 'name' | 'added'>('expiry');

  // View mode (grid vs list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('smart_fridge_view_mode') as 'grid' | 'list') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('smart_fridge_view_mode', viewMode);
  }, [viewMode]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Expiry calculations
  const expiredItems = useMemo(() => items.filter(i => isExpired(i.expiry_date)), [items]);
  const nearExpiryItems = useMemo(() => {
    return items.filter(i => {
      const d = getDaysUntilExpiry(i.expiry_date);
      return !isExpired(i.expiry_date) && d !== null && d <= 3 && d >= 0;
    });
  }, [items]);

  const isPantryEmpty = items.length === 0;

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter by freshness
    if (freshnessFilter === 'expired') {
      result = result.filter(i => isExpired(i.expiry_date));
    } else if (freshnessFilter === 'near_expiry') {
      result = result.filter(i => {
        const d = getDaysUntilExpiry(i.expiry_date);
        return !isExpired(i.expiry_date) && d !== null && d <= 3 && d >= 0;
      });
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter(i => (i.group || CATEGORIES.OTHERS) === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(i => i.name.toLowerCase().includes(q));
    }

    // Sort
    return result.sort((a, b) => {
      if (sortBy === 'expiry') {
        const dateA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
        const dateB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
        return dateA - dateB;
      }
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      const dateA = a.added_date ? new Date(a.added_date).getTime() : 0;
      const dateB = b.added_date ? new Date(b.added_date).getTime() : 0;
      return dateB - dateA;
    });
  }, [items, selectedCategory, freshnessFilter, searchQuery, sortBy]);

  // Grouped category counts
  const categoryCounts = useMemo(() => {
    return items.reduce((acc, item) => {
      const group = item.group || CATEGORIES.OTHERS;
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);

  // Filter options for standard ListToolbar
  const filterItems = useMemo(() => {
    const list: ToolbarFilterItem[] = [
      { key: 'all', label: 'Tất cả nguyên liệu', count: items.length }
    ];

    if (expiredItems.length > 0) {
      list.push({
        key: 'status:expired',
        label: '⚠️ Đã hết hạn',
        count: expiredItems.length
      });
    }

    if (nearExpiryItems.length > 0) {
      list.push({
        key: 'status:near_expiry',
        label: '⏳ Sắp hết hạn',
        count: nearExpiryItems.length
      });
    }

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
  }, [items.length, expiredItems.length, nearExpiryItems.length, categoryCounts]);

  const selectedFilterKey = useMemo(() => {
    if (freshnessFilter === 'expired') return 'status:expired';
    if (freshnessFilter === 'near_expiry') return 'status:near_expiry';
    if (selectedCategory) return `cat:${selectedCategory}`;
    return 'all';
  }, [freshnessFilter, selectedCategory]);

  const handleFilterChange = (key: string) => {
    if (key === 'status:expired') {
      setFreshnessFilter('expired');
      setSelectedCategory(null);
    } else if (key === 'status:near_expiry') {
      setFreshnessFilter('near_expiry');
      setSelectedCategory(null);
    } else if (key.startsWith('cat:')) {
      setSelectedCategory(key.replace('cat:', ''));
      setFreshnessFilter('all');
    } else {
      setSelectedCategory(null);
      setFreshnessFilter('all');
    }
  };

  const sortItems = [
    { key: 'expiry', label: 'Hạn sử dụng' },
    { key: 'name', label: 'Tên A-Z' },
    { key: 'added', label: 'Mới thêm' }
  ];

  const handleSaveItem = (itemData: Omit<PantryItem, 'id'>, id?: string) => {
    if (id) {
      updateItem(id, itemData);
      toast.success('Đã cập nhật nguyên liệu!');
    } else {
      addItem(itemData);
      toast.success('Đã thêm nguyên liệu vào tủ lạnh!');
    }
    setEditingItem(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      removeItem(deleteTargetId);
      toast.success('Đã xoá nguyên liệu!');
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full gap-6 w-full pt-6 pb-28 px-4 md:px-8">
      {/* 1. Header & Toolbar chuẩn hệ thống */}
      <PageHeader
        title="Tủ lạnh thông minh"
        description={
          filteredItems.length === items.length
            ? `${items.length} nguyên liệu trong bếp của bạn`
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
            onSortChange={(key) => setSortBy(key as 'expiry' | 'name' | 'added')}
            onAdd={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
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

      {/* Ingredients Grid / Empty State */}
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={<Refrigerator className="w-12 h-12 text-default-300" />}
            title={isPantryEmpty ? 'Tủ lạnh đang trống' : 'Không tìm thấy nguyên liệu'}
            description={
              isPantryEmpty
                ? 'Thêm nguyên liệu vào tủ để theo dõi hạn sử dụng và chuẩn bị bữa ăn chu đáo!'
                : 'Thử tìm với từ khoá khác hoặc xoá bộ lọc danh mục.'
            }
            action={
              <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
                <Button
                  color="primary"
                  startContent={<Plus className="w-4 h-4" />}
                  onPress={() => {
                    setEditingItem(null);
                    setIsModalOpen(true);
                  }}
                  className="font-semibold h-11 px-4 rounded-xl"
                >
                  Thêm nguyên liệu
                </Button>
              </div>
            }
          />
        ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredItems.map(item => (
                  <PantryItemCard
                    key={item.id}
                    item={item}
                    onRemove={(id) => setDeleteTargetId(id)}
                    onEdit={(it) => {
                      setEditingItem(it);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col rounded-2xl bg-content1 border border-divider/60 overflow-hidden divide-y divide-divider/40">
                {filteredItems.map(item => (
                  <PantryItemListItem
                    key={item.id}
                    item={item}
                    onRemove={(id) => setDeleteTargetId(id)}
                    onEdit={(it) => {
                      setEditingItem(it);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Shopping List Card CTA */}
            {items.length > 0 && (
              <div className="mt-4 p-4 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-foreground">Thiếu nguyên liệu?</span>
                    <span className="text-xs text-default-500 truncate">Lên thực đơn và chuẩn bị đi chợ</span>
                  </div>
                </div>
                <Button
                  color="primary"
                  variant="flat"
                  size="sm"
                  onPress={() => navigate('/shopping-list')}
                  className="font-semibold text-xs h-9 px-3 rounded-xl shrink-0"
                >
                  Đi chợ
                </Button>
              </div>
            )}

      {/* Add / Edit Ingredient Modal */}
      <PantryItemModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        item={editingItem}
        onSave={handleSaveItem}
        onDelete={(id) => setDeleteTargetId(id)}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="Xoá nguyên liệu"
        description="Bạn có chắc chắn muốn xoá nguyên liệu này khỏi tủ lạnh không?"
        confirmLabel="Xoá"
        confirmColor="danger"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
