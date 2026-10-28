import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  PageHeader,
  EmptyState,
  toast,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@/ui';
import {
  Plus,
  Search,
  Share2,
  Trash2,
  ShoppingCart,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { useShoppingListStore } from '../../store/useShoppingListStore';
import { autoCategorizeIngredient, type ShoppingListItem } from '@apron/core';
import { ShoppingListItemCard } from './components/ShoppingListItemCard';
import { AddRecipeIngredientsDrawer } from './components/AddRecipeIngredientsDrawer';
import { getCategoryTheme } from '../../lib/categoryTheme';

// Các gợi ý nguyên liệu cơ bản hay dùng
const QUICK_SUGGESTIONS = [
  'Trứng gà',
  'Hành tím',
  'Tỏi',
  'Cà chua',
  'Dầu ăn',
  'Nước mắm',
  'Sữa chua',
  'Hành lá'
];

export function ShoppingListPage() {
  const { t } = useTranslation();
  const {
    items,
    fetchItems,
    addItem,
    addItems,
    toggleItem,
    removeItems,
    updateItem,
    clearCompleted
  } = useShoppingListStore();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'done'>('all');
  const [quickInput, setQuickInput] = useState('');
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Phân loại Pending / Completed
  const activeItems = useMemo(() => items.filter((item) => !item.checked), [items]);
  const completedItems = useMemo(() => items.filter((item) => item.checked), [items]);

  // Danh sách hiển thị theo Tab
  const displayedItems = useMemo(() => {
    if (activeTab === 'pending') return activeItems;
    if (activeTab === 'done') return completedItems;
    return items;
  }, [activeTab, activeItems, completedItems, items]);

  // Nhóm các món theo Category
  const groupedItems = useMemo(() => {
    const groups: { [cat: string]: ShoppingListItem[] } = {};

    displayedItems.forEach((item) => {
      const cat = item.group ?? autoCategorizeIngredient(item.name);
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(item);
    });

    return groups;
  }, [displayedItems]);

  // Thêm nhanh nguyên liệu từ input
  const handleQuickAdd = (nameToAdd?: string) => {
    const targetName = (nameToAdd ?? quickInput).trim();
    if (!targetName) return;

    const detectedCategory = autoCategorizeIngredient(targetName);
    addItem(targetName, 1, 'đơn vị', detectedCategory);
    setQuickInput('');
    toast.success(t('shopping.addIngredientsSuccess', { count: 1 }));
  };

  // Cập nhật số lượng
  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    updateItem(id, { quantity: newQuantity });
  };

  // Cập nhật đơn vị
  const handleUpdateUnit = (id: string, newUnit: string) => {
    updateItem(id, { unit: newUnit });
  };

  // Xóa nguyên liệu
  const handleRemoveItem = (id: string) => {
    removeItems([id]);
  };

  // Dọn dẹp tất cả các món đã mua
  const handleClearCompleted = async () => {
    if (completedItems.length === 0) return;
    await clearCompleted();
    toast.success(t('shopping.cleanUpSuccess', { count: completedItems.length }));
  };

  // Thêm hàng loạt từ công thức
  const handleAddFromRecipe = async (
    recipeItems: { name: string; quantity?: number; unit?: string; group?: string }[]
  ) => {
    if (recipeItems.length === 0) return;
    await addItems(recipeItems);
    toast.success(t('shopping.addIngredientsSuccess', { count: recipeItems.length }));
  };

  // Sao chép chia sẻ danh sách đi chợ
  const handleShareList = async () => {
    if (items.length === 0) {
      toast.info(t('shopping.empty.title'));
      return;
    }

    const lines = [
      '🛒 Danh sách đi chợ Apron:',
      ...activeItems.map(
        (i) => `• [ ] ${i.name} (${i.quantity ?? 1} ${i.unit ?? ''})`
      ),
      ...(completedItems.length > 0
        ? [
            '',
            '✅ Đã mua:',
            ...completedItems.map(
              (i) => `• [x] ${i.name} (${i.quantity ?? 1} ${i.unit ?? ''})`
            )
          ]
        : [])
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      toast.success(t('shopping.copiedListSuccess'));
    } catch {
      toast.error(t('shopping.copiedListError'));
    }
  };

  const isDoneTab = activeTab === 'done';

  return (
    <div className="flex flex-col min-h-full gap-6 w-full pt-6 pb-28 px-4 md:px-8">
      {/* 1. Header & Toolbar chuẩn hệ thống */}
      <PageHeader
        title={t('shopping.title')}
        description={
          items.length === 0
            ? t('shopping.emptySubtitle')
            : t('shopping.itemCountSummary', { active: activeItems.length, completed: completedItems.length })
        }
        actions={
          <div className="flex flex-col md:flex-row justify-end gap-3 w-full">
            {/* Thanh nhập nhanh nguyên liệu đồng bộ với Input của các trang khác */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleQuickAdd();
              }}
              className="w-full md:max-w-[320px] flex items-center gap-2"
            >
              <Input
                placeholder={t('shopping.quickAddPlaceholder')}
                variant="flat"
                classNames={{
                  base: 'w-full',
                  input: 'text-small',
                }}
                size="md"
                value={quickInput}
                onValueChange={setQuickInput}
                startContent={<Search className="w-4 h-4 text-default-400 shrink-0" />}
                isClearable
                onClear={() => setQuickInput('')}
              />
              <Button
                isIconOnly
                color="primary"
                className="h-10 w-10 min-w-10 rounded-xl font-semibold shrink-0"
                type="submit"
                aria-label={t('shopping.addItem')}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </form>

            {/* Các nút hành động chuẩn đồng bộ */}
            <div className="flex items-center gap-2 w-full">
              {/* Dropdown Filter: Tất cả / Chưa mua / Đã mua kéo dài lấp đầy width */}
              <Dropdown className="flex-1 min-w-0">
                <DropdownTrigger className="flex-1 min-w-0">
                  <Button
                    variant="flat"
                    className="flex-1 min-w-0 w-full justify-between h-10 px-3.5 rounded-xl font-semibold text-default-700 bg-content1/80 border border-divider/40"
                    startContent={<Filter className="w-4 h-4 text-default-500 shrink-0" />}
                    endContent={<ChevronDown className="w-3.5 h-3.5 text-default-400 shrink-0" />}
                  >
                    <span className="truncate">
                      {activeTab === 'all' && t('shopping.filterAll', { count: items.length })}
                      {activeTab === 'pending' && t('shopping.filterPending', { count: activeItems.length })}
                      {activeTab === 'done' && t('shopping.filterDone', { count: completedItems.length })}
                    </span>
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label={t('shopping.filterStatusLabel')}
                  selectedKeys={new Set([activeTab])}
                  selectionMode="single"
                  disallowEmptySelection
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as 'all' | 'pending' | 'done';
                    if (selected) setActiveTab(selected);
                  }}
                >
                  <DropdownItem key="all" textValue={t('common.actions.all')}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{t('common.actions.all')}</span>
                      <span className="text-xs text-default-400 font-normal">({items.length})</span>
                    </div>
                  </DropdownItem>
                  <DropdownItem key="pending" textValue={t('shopping.pending')}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{t('shopping.pending')}</span>
                      <span className="text-xs text-default-400 font-normal">({activeItems.length})</span>
                    </div>
                  </DropdownItem>
                  <DropdownItem key="done" textValue={t('shopping.bought')}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{t('shopping.bought')}</span>
                      <span className="text-xs text-default-400 font-normal">({completedItems.length})</span>
                    </div>
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Button
                color="primary"
                variant="flat"
                className="h-10 px-3.5 rounded-xl font-semibold shrink-0"
                startContent={<ChefHat className="w-4 h-4" />}
                onClick={() => setIsAddRecipeOpen(true)}
              >
                {t('shopping.fromRecipe')}
              </Button>

              <Button
                isIconOnly
                variant="flat"
                className="h-10 w-10 min-w-10 rounded-xl text-default-600 shrink-0"
                onClick={handleShareList}
                aria-label={t('common.actions.share')}
              >
                <Share2 className="w-4 h-4" />
              </Button>

              {completedItems.length > 0 && (
                <Button
                  isIconOnly
                  variant="flat"
                  color="danger"
                  className="h-10 w-10 min-w-10 rounded-xl text-danger shrink-0"
                  onClick={handleClearCompleted}
                  aria-label={t('shopping.cleanUp')}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-6 w-full">
        {/* 2. Dải gợi ý nguyên liệu cơ bản lướt ngang */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-semibold text-default-400 shrink-0">
            {t('shopping.suggestions')}
          </span>
          {QUICK_SUGGESTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleQuickAdd(item)}
              className="px-2.5 py-1 rounded-xl bg-content1/80 border border-divider/40 hover:border-primary/50 text-default-600 hover:text-primary text-xs font-medium whitespace-nowrap active:scale-95 transition-all shadow-2xs"
            >
              + {item}
            </button>
          ))}
        </div>

        {/* 3. Danh sách các nguyên liệu theo nhóm quầy hàng */}
        {displayedItems.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="w-10 h-10 text-default-400" />}
            title={
              isDoneTab
                ? t('shopping.empty.noCompletedTitle')
                : t('shopping.empty.title')
            }
            description={
              isDoneTab
                ? t('shopping.empty.noCompletedDesc')
                : t('shopping.empty.emptyWithAction')
            }
            action={
              !isDoneTab ? (
                <Button
                  color="primary"
                  className="rounded-xl font-bold mt-2"
                  startContent={<ChefHat className="w-4 h-4" />}
                  onClick={() => setIsAddRecipeOpen(true)}
                >
                  {t('shopping.selectFromRecipes')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(groupedItems).map(([categoryName, groupItems]) => {
              const theme = getCategoryTheme(categoryName);
              const CatIcon = theme.icon;

              return (
                <div key={categoryName} className="flex flex-col gap-2">
                  {/* Category Header */}
                  <div className="flex items-center justify-between px-1 pb-1.5 border-b border-divider/40">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center ${theme.bg} ${theme.text}`}
                      >
                        <CatIcon className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-default-500">
                        {categoryName}
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-default-400">
                      {groupItems.length} {t('recipes.detail.ingredients', { defaultValue: 'món' })}
                    </span>
                  </div>

                  {/* List of items in this category */}
                  <div className="flex flex-col divide-y divide-divider/30">
                    {groupItems.map((item) => (
                      <ShoppingListItemCard
                        key={item.id}
                        item={item}
                        onToggle={toggleItem}
                        onRemove={handleRemoveItem}
                        onUpdateQuantity={handleUpdateQuantity}
                        onUpdateUnit={handleUpdateUnit}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Mục "Đã mua" có thể mở rộng/thu gọn (khi ở Tab Chưa mua) */}
            {activeTab === 'pending' && completedItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-divider/40 flex flex-col gap-2">
                <div className="flex items-center justify-between px-1 py-1 text-default-500">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsCompletedExpanded(!isCompletedExpanded);
                    }}
                    className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {t('shopping.boughtCount', { count: completedItems.length })}
                    </span>
                    {isCompletedExpanded ? (
                      <ChevronUp className="w-4 h-4 text-default-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-default-400" />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleClearCompleted}
                    className="text-xs font-semibold text-danger hover:underline cursor-pointer"
                  >
                    {t('shopping.cleanUp')}
                  </button>
                </div>

                {isCompletedExpanded && (
                  <div className="flex flex-col divide-y divide-divider/30">
                    {completedItems.map((item) => (
                      <ShoppingListItemCard
                        key={item.id}
                        item={item}
                        onToggle={toggleItem}
                        onRemove={handleRemoveItem}
                        onUpdateQuantity={handleUpdateQuantity}
                        onUpdateUnit={handleUpdateUnit}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Bottom Sheet Drawer: Thêm nguyên liệu từ công thức */}
      <AddRecipeIngredientsDrawer
        isOpen={isAddRecipeOpen}
        onClose={() => setIsAddRecipeOpen(false)}
        onAddIngredients={handleAddFromRecipe}
      />
    </div>
  );
}
