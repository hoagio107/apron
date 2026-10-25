import { useState, useMemo } from 'react';
import { Button, Autocomplete, AutocompleteItem, Avatar, EmptyState } from '@/ui';
import { Plus, Search, AlertTriangle, Layers } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { usePantryStore } from '../../store/usePantryStore';
import { useIngredientCatalogStore } from '../../store/useIngredientCatalogStore';
import { CATEGORIES, autoCategorizeIngredient } from '@apron/core';
import { getCategoryTheme } from '../../lib/categoryTheme';
import { PantryItemCard } from './components/PantryItemCard';

const isExpired = (date?: string) => {
  if (!date) return false;
  return new Date(date).getTime() < new Date().getTime();
}

export function SmartFridgePage() {
  const { items, addItem, removeItem } = usePantryStore();
  const { getAllIngredients, updateIngredientMeta, addIngredientMeta, getIngredientMetaByName } = useIngredientCatalogStore();
  const catalogItems = getAllIngredients();

  const [newItemName, setNewItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'expiry' | 'name' | 'added'>('expiry');

  const quickAdd = (name: string) => {
    const group = autoCategorizeIngredient(name.trim());
    addItem({ name: name.trim(), quantity: 1, unit: 'đơn vị', group, added_date: new Date().toISOString().split('T')[0] });
    const existingMeta = getIngredientMetaByName(name.trim());
    if (existingMeta) {
      updateIngredientMeta(existingMeta.id, { default_category: group, default_unit: 'đơn vị' });
    } else {
      addIngredientMeta(name.trim(), { default_category: group, default_unit: 'đơn vị' });
    }
    setNewItemName('');
  };

  const handleSearchBlur = () => {
    if (newItemName.trim() && !items.find(i => i.name.toLowerCase() === newItemName.toLowerCase())) {
        // Can optionally auto-add on blur or just let them use the combobox options
    }
  };

  const autocompleteOptions = useMemo(() => {
    const filtered = catalogItems
      .filter(ci => !newItemName || ci.name.toLowerCase().includes(newItemName.toLowerCase()))
      .slice(0, 5)
      .map(item => ({
        key: item.name,
        label: item.name,
        sublabel: item.default_category || 'Chưa phân loại',
        imageUrl: item.image_url,
        isAddNew: false,
      }));

    if (newItemName.trim() && !catalogItems.some(i => i.name.toLowerCase() === newItemName.trim().toLowerCase())) {
      filtered.push({
        key: '__add_new__',
        label: `Thêm "${newItemName}" vào tủ`,
        sublabel: '',
        imageUrl: undefined,
        isAddNew: true,
      });
    }

    return filtered;
  }, [catalogItems, newItemName]);

  // Derived state
  const activeItems = useMemo(() => items.filter(i => !isExpired(i.expiry_date)), [items]);
  const expiredItems = useMemo(() => items.filter(i => isExpired(i.expiry_date)), [items]);

  const filteredItems = useMemo(() => {
    let result = activeItems;
    if (selectedCategory) {
      result = result.filter(i => (i.group || CATEGORIES.OTHERS) === selectedCategory);
    }
    if (newItemName.trim()) {
      result = result.filter(i => i.name.toLowerCase().includes(newItemName.toLowerCase()));
    }
    return result.sort((a, b) => {
      if (sortBy === 'expiry') {
        const dateA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
        const dateB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
        return dateA - dateB;
      }
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      const dateA = a.added_date ? new Date(a.added_date).getTime() : 0;
      const dateB = b.added_date ? new Date(b.added_date).getTime() : 0;
      return dateB - dateA; // Newest first
    });
  }, [activeItems, selectedCategory, newItemName, sortBy]);

  const groupedCounts = useMemo(() => {
    return items.reduce((acc, item) => {
      const group = item.group || CATEGORIES.OTHERS;
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);

  return (
    <div className="h-full flex flex-col pt-6">
      <PageHeader
        title="Tủ lạnh thông minh"
        description={`Quản lý ${items.length} nguyên liệu trong bếp của bạn`}
        className="pt-0"
      />

      <div className="max-w-[96rem] mx-auto w-full flex-1 flex gap-5 min-h-0 pb-8 px-4">
        
        {/* LEFT: Categories Sidebar */}
        <div className="w-72 shrink-0 flex flex-col min-h-0 bg-white rounded-2xl border border-default-100 shadow-none overflow-hidden">
          <div className="p-4 border-b border-default-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-default-500" />
            <h3 className="font-semibold text-foreground">Danh mục</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${selectedCategory === null ? 'bg-primary-50 text-primary-700' : 'text-default-600 hover:bg-default-100'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-default-100 flex items-center justify-center">
                  🍱
                </div>
                <span>Tất cả</span>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${selectedCategory === null ? 'bg-primary-100 text-primary-700' : 'bg-default-100 text-default-500'}`}>
                {items.length}
              </span>
            </button>
            
            {Object.values(CATEGORIES).map(cat => {
              const count = groupedCounts[cat] || 0;
              const theme = getCategoryTheme(cat);
              const Icon = theme.icon;
              const isSelected = selectedCategory === cat;
              
              if (count === 0 && !isSelected) return null; // Hide empty categories unless selected
              
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isSelected ? 'bg-primary-50 text-primary-700' : 'text-default-600 hover:bg-default-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary-100' : theme.bg}`}>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-primary-700' : theme.text}`} />
                    </div>
                    <span>{cat}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isSelected ? 'bg-primary-100 text-primary-700' : 'bg-default-100 text-default-500'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* MIDDLE: Main Content (Search & Grid) */}
        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-default-100 shadow-none overflow-hidden">
          <div className="p-4 border-b border-default-100 flex flex-col gap-4">
            <Autocomplete
              placeholder="Tìm hoặc thêm nguyên liệu vào tủ lạnh..."
              inputValue={newItemName}
              onInputChange={(value) => setNewItemName(value)}
              onSelectionChange={(key) => {
                if (!key) return;
                if (key === '__add_new__') { quickAdd(newItemName); return; }
                const selectedItem = catalogItems.find(i => i.name === key);
                if (selectedItem) { quickAdd(selectedItem.name); }
              }}
              onBlur={handleSearchBlur}
              allowsCustomValue
              size="lg"
              classNames={{
                base: "w-full"
              }}
              inputProps={{
                classNames: {
                  inputWrapper: "bg-default-50 hover:bg-default-100 border border-default-200 rounded-xl"
                }
              }}
              startContent={<Search className="w-5 h-5 text-default-400" />}
            >
              {autocompleteOptions.map((item) => (
                <AutocompleteItem
                  key={item.key}
                  textValue={item.label}
                  startContent={
                    item.isAddNew ? (
                      <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4 text-primary-500" />
                      </div>
                    ) : item.imageUrl ? (
                      <Avatar alt={item.label} size="sm" src={item.imageUrl} className="shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-default-100 flex items-center justify-center shrink-0">🥩</div>
                    )
                  }
                  className={item.isAddNew ? "text-primary" : ""}
                >
                  <div className="flex flex-col">
                    <span className="text-small font-medium">{item.label}</span>
                    {item.sublabel && <span className="text-tiny text-default-400">{item.sublabel}</span>}
                  </div>
                </AutocompleteItem>
              ))}
            </Autocomplete>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {selectedCategory || 'Tất cả nguyên liệu'} 
                <span className="text-default-400 font-normal ml-2">({filteredItems.length})</span>
              </h2>
              <div className="flex items-center gap-2 text-sm text-default-500">
                <span>Sắp xếp theo:</span>
                <select 
                  className="bg-transparent font-medium text-foreground outline-none cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="expiry">Hạn sử dụng</option>
                  <option value="name">Tên A-Z</option>
                  <option value="added">Mới thêm</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 bg-default-50/50">
            {filteredItems.length === 0 ? (
              <EmptyState
                icon={<Search className="w-10 h-10 text-default-400" />}
                title="Không tìm thấy nguyên liệu"
                description="Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredItems.map(item => (
                  <PantryItemCard key={item.id} item={item} onRemove={removeItem} />
                ))}
              </div>
            )}
            
            {expiredItems.length > 0 && (!selectedCategory || expiredItems.some(i => i.group === selectedCategory)) && (
              <div className="border border-danger-200 bg-danger-50 rounded-xl p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2 text-danger-700">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">Xem thêm nguyên liệu đã hết hạn ({expiredItems.length})</span>
                  </div>
                </div>
                {/* Could expand here, but for now just show a summary or first few */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 opacity-75">
                   {expiredItems.slice(0, 5).map(item => (
                     <PantryItemCard key={item.id} item={item} onRemove={removeItem} />
                   ))}
                </div>
              </div>
            )}

            <div className="mt-auto pt-6 pb-2">
              <div className="bg-primary-50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-primary-100">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                     <span className="text-xl">🛒</span>
                   </div>
                   <div>
                     <h4 className="font-semibold text-primary-900">Thiếu nguyên liệu?</h4>
                     <p className="text-sm text-primary-700">Thêm ngay vào danh sách đi chợ của bạn</p>
                   </div>
                 </div>
                 <Button color="primary" className="font-medium shrink-0" startContent={<Plus className="w-4 h-4" />}>
                   Đến danh sách mua sắm
                 </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
