import { useState, useMemo } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Button,
  Tabs,
  Tab
} from '@/ui';
import { Search, ChefHat, Clock, Flame, Plus, X, Utensils } from 'lucide-react';
import type { Recipe } from '@apron/core';
import { useRecipeStore } from '../../../store/useRecipeStore';
import { ImageManager } from '../../../lib/image-manager';

interface RecipePickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string;
  targetSlotName: string;
  onSelectRecipe: (recipe: Recipe) => void;
  onAddCustomMeal: (title: string, note?: string) => void;
}

export function RecipePickerDrawer({
  isOpen,
  onClose,
  targetDate,
  targetSlotName,
  onSelectRecipe,
  onAddCustomMeal
}: RecipePickerDrawerProps) {
  const { recipes } = useRecipeStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customTitle, setCustomTitle] = useState('');
  const [customNote, setCustomNote] = useState('');

  // Format date display
  const dateFormatted = useMemo(() => {
    if (!targetDate) return '';
    try {
      const d = new Date(targetDate);
      return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    } catch {
      return targetDate;
    }
  }, [targetDate]);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    recipes.forEach((r) => {
      if (r.category) cats.add(r.category);
    });
    return ['all', ...Array.from(cats)];
  }, [recipes]);

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [recipes, search, selectedCategory]);

  const handleCustomSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customTitle.trim()) return;
    onAddCustomMeal(customTitle.trim(), customNote.trim() || undefined);
    setCustomTitle('');
    setCustomNote('');
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      placement="bottom"
      size="2xl"
      radius="lg"
      hideCloseButton
      classNames={{
        base: 'max-h-[85vh] rounded-t-3xl bg-content1 text-foreground flex flex-col',
        body: 'p-0 flex-1 overflow-y-auto',
      }}
    >
      <DrawerContent>
        {/* Header */}
        <DrawerHeader className="flex flex-col gap-1 border-b border-divider/40 px-4 pt-3 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full bg-default-300 mx-auto mb-2" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Thêm món vào {targetSlotName}
              </h3>
              <p className="text-xs text-default-400 font-medium">
                Kế hoạch ngày: {dateFormatted}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-default-400 hover:text-foreground hover:bg-default-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DrawerHeader>

        <DrawerBody>
          <Tabs
            aria-label="Tùy chọn thêm món"
            color="primary"
            variant="underlined"
            classNames={{
              tabList: 'px-4 gap-6 p-0 border-b border-divider/40 w-full',
              tab: 'h-11 px-0 font-bold text-sm text-default-500 data-[selected=true]:text-primary',
              cursor: 'w-full bg-primary h-0.5',
              panel: 'p-4 flex flex-col gap-3',
            }}
          >
            {/* TAB 1: CHỌN TỪ CÔNG THỨC */}
            <Tab
              key="from-recipes"
              title={
                <div className="flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4" />
                  <span>Từ công thức ({recipes.length})</span>
                </div>
              }
            >
              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-default-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm công thức nấu ăn..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-default-100 dark:bg-default-50/20 text-foreground placeholder:text-default-400 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-default-400 hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              {categories.length > 2 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-primary text-white font-bold shadow-xs'
                          : 'bg-default-100 dark:bg-default-50/20 text-default-600 hover:text-foreground'
                      }`}
                    >
                      {cat === 'all' ? 'Tất cả' : cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Recipes List */}
              <div className="flex flex-col divide-y divide-divider/30 -mx-4 px-4 max-h-[46vh] overflow-y-auto">
                {filteredRecipes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-default-400 gap-2">
                    <ChefHat className="w-10 h-10 opacity-30 stroke-[1.5]" />
                    <p className="text-sm font-medium">Không tìm thấy công thức nào</p>
                    <p className="text-xs text-default-400">
                      Bạn có thể nhập món tự chọn ở tab bên cạnh
                    </p>
                  </div>
                ) : (
                  filteredRecipes.map((r) => {
                    const totalTime = (r.prep_time || 0) + (r.cook_time || 0);
                    return (
                      <div
                        key={r.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          onSelectRecipe(r);
                          onClose();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onSelectRecipe(r);
                            onClose();
                          }
                        }}
                        className="py-3 flex items-center gap-3 active:bg-default-100/50 hover:bg-default-100/30 transition-colors cursor-pointer select-none group"
                      >
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-xl bg-default-100 overflow-hidden shrink-0 relative shadow-2xs">
                          {r.image_url ? (
                            <img
                              src={ImageManager.getAssetUrl(r.image_url)}
                              alt={r.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLElement).classList.add('hidden');
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-default-400">
                              <ChefHat className="w-6 h-6 opacity-40" />
                            </div>
                          )}
                        </div>

                        {/* Title & Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {r.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-default-400 mt-1">
                            {totalTime > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {totalTime}m
                              </span>
                            )}
                            {r.nutrition?.calories ? (
                              <span className="flex items-center gap-0.5 text-danger font-medium">
                                <Flame className="w-3 h-3" />
                                {r.nutrition.calories} kcal
                              </span>
                            ) : null}
                            {r.category && (
                              <span className="text-[11px] text-default-400 truncate">
                                • {r.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Select Button */}
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          className="rounded-xl shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRecipe(r);
                            onClose();
                          }}
                        >
                          Chọn
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </Tab>

            {/* TAB 2: MÓN TỰ CHỌN / GHI CHÚ */}
            <Tab
              key="custom-dish"
              title={
                <div className="flex items-center gap-1.5">
                  <Utensils className="w-4 h-4" />
                  <span>Món tự chọn / Ăn ngoài</span>
                </div>
              }
            >
              <form onSubmit={handleCustomSubmit} className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="custom-dish-title" className="text-xs font-bold text-foreground">
                    Tên món ăn <span className="text-danger">*</span>
                  </label>
                  <input
                    id="custom-dish-title"
                    type="text"
                    required
                    placeholder="Vd: Phở bò tái lăn, Cơm sườn nướng, Ăn ngoài..."
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-default-100 dark:bg-default-50/20 text-foreground placeholder:text-default-400 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="custom-dish-note" className="text-xs font-bold text-foreground">
                    Ghi chú món (tùy chọn)
                  </label>
                  <textarea
                    id="custom-dish-note"
                    rows={2}
                    placeholder="Vd: Quán quen đầu ngõ, nhớ mua thêm sữa chua..."
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    className="w-full px-3.5 py-2 bg-default-100 dark:bg-default-50/20 text-foreground placeholder:text-default-400 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
                  />
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-default-400">
                    Gợi ý nhanh:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Cơm văn phòng', 'Phở bò', 'Bún chả', 'Bánh mì', 'Ăn cỗ / Tiệc', 'Tự nấu đơn giản'].map(
                      (suggest) => (
                        <button
                          key={suggest}
                          type="button"
                          onClick={() => setCustomTitle(suggest)}
                          className="px-2.5 py-1 rounded-lg bg-default-100 dark:bg-default-50/20 hover:bg-primary/10 hover:text-primary text-default-600 text-xs font-medium transition-colors"
                        >
                          {suggest}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  color="primary"
                  className="rounded-xl font-bold mt-2 h-11"
                  startContent={<Plus className="w-4 h-4" />}
                  disabled={!customTitle.trim()}
                >
                  Thêm vào thực đơn
                </Button>
              </form>
            </Tab>
          </Tabs>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
