import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerBody, 
  DrawerFooter,
  Button, 
  Switch,
  Avatar 
} from '@/ui';
import { 
  Filter, 
  Check, 
  Clock, 
  Star, 
  Sparkles, 
  ChefHat, 
  UtensilsCrossed, 
  Flame,
  Search,
  ChevronDown,
  X,
  Layers
} from 'lucide-react';
import { useIngredientCatalogStore } from '../../../store/useIngredientCatalogStore';
import { getCategoryTheme } from '../../../lib/categoryTheme';
import { autoCategorizeIngredient, CATEGORIES } from '@apron/core';

export interface RecipeFilterState {
  difficulties: string[];
  maxTime: number | null; // minutes
  tags: string[];
  cookedStatus?: 'all' | 'cooked' | 'uncooked';
  minRating?: number;
  hideVariants?: boolean;
  ingredientIds: string[];
}

export const defaultFilterState: RecipeFilterState = {
  difficulties: [],
  maxTime: null,
  tags: [],
  cookedStatus: 'all',
  minRating: 0,
  hideVariants: false,
  ingredientIds: []
};

const DEFAULT_INACTIVE_BUTTON_CLASS = 'bg-default-100 hover:bg-default-200/80 text-default-700 dark:text-default-300 border-transparent';

function FilterDivider() {
  return (
    <div className="px-3 py-1" aria-hidden="true">
      <div className="h-px bg-divider/50" />
    </div>
  );
}

interface RecipeFilterDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: RecipeFilterState;
  onFilterChange: (filters: RecipeFilterState) => void;
  availableTags?: string[];
}

export function RecipeFilterDrawer({ 
  isOpen, 
  onOpenChange, 
  filters, 
  onFilterChange, 
  availableTags = []
}: RecipeFilterDrawerProps) {
  const { getAllIngredients } = useIngredientCatalogStore();
  const allIngredients = getAllIngredients();

  // Combobox state
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [selectedIngredientCategory, setSelectedIngredientCategory] = useState<string | null>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Close combobox when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setIsComboboxOpen(false);
      }
    }
    if (isComboboxOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isComboboxOpen]);

  // Filtered ingredients for combobox
  const filteredCatalogIngredients = useMemo(() => {
    return allIngredients.filter(item => {
      const cat = item.default_category || autoCategorizeIngredient(item.name);
      const matchesSearch = !ingredientSearch.trim() || 
        item.name.toLowerCase().includes(ingredientSearch.toLowerCase().trim()) ||
        cat.toLowerCase().includes(ingredientSearch.toLowerCase().trim());
      const matchesCat = !selectedIngredientCategory || cat === selectedIngredientCategory;
      return matchesSearch && matchesCat;
    });
  }, [allIngredients, ingredientSearch, selectedIngredientCategory]);

  // Options
  const timeOptions = [
    { label: 'Tất cả', value: null },
    { label: '≤ 15 phút', value: 15 },
    { label: '≤ 30 phút', value: 30 },
    { label: '≤ 60 phút', value: 60 },
  ];

  const difficultyOptions = [
    { label: 'Dễ', colorClass: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold' },
    { label: 'Trung bình', colorClass: 'border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold' },
    { label: 'Khó', colorClass: 'border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold' }
  ];

  const cookedOptions = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Đã nấu', value: 'cooked' },
    { label: 'Chưa nấu', value: 'uncooked' }
  ];

  const ratingOptions = [
    { label: 'Tất cả', value: 0 },
    { label: '3+ ★', value: 3 },
    { label: '4+ ★', value: 4 },
    { label: '5 ★', value: 5 }
  ];

  const activeFilterCount = 
    (filters.difficulties.length > 0 ? 1 : 0) + 
    (filters.maxTime !== null ? 1 : 0) + 
    ((filters.tags?.length ?? 0) > 0 ? 1 : 0) + 
    (filters.cookedStatus && filters.cookedStatus !== 'all' ? 1 : 0) + 
    ((filters.minRating ?? 0) > 0 ? 1 : 0) + 
    (filters.hideVariants ? 1 : 0) +
    ((filters.ingredientIds?.length ?? 0) > 0 ? 1 : 0);

  const handleClear = () => {
    onFilterChange(defaultFilterState);
  };

  const toggleDifficulty = (diff: string) => {
    const isSelected = filters.difficulties.includes(diff);
    const newDiffs = isSelected
      ? filters.difficulties.filter(d => d !== diff)
      : [...filters.difficulties, diff];
    onFilterChange({ ...filters, difficulties: newDiffs });
  };

  const handleToggleIngredient = (id: string) => {
    if (filters.ingredientIds.includes(id)) {
      onFilterChange({
        ...filters,
        ingredientIds: filters.ingredientIds.filter(i => i !== id)
      });
    } else {
      onFilterChange({
        ...filters,
        ingredientIds: [...filters.ingredientIds, id]
      });
    }
  };

  const handleRemoveIngredient = (id: string) => {
    onFilterChange({
      ...filters,
      ingredientIds: filters.ingredientIds.filter(i => i !== id)
    });
  };

  return (
    <Drawer 
      isOpen={isOpen} 
      onOpenChange={onOpenChange} 
      size="md" 
      placement="right"
      hideCloseButton
      classNames={{
        base: "max-w-md w-full bg-background dark:bg-background border-l border-divider/60 shadow-2xl flex flex-col",
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            {/* 1. Header */}
            <DrawerHeader className="flex items-center justify-between px-5 py-3.5 border-b border-divider/50 bg-background/90 backdrop-blur-md sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-teal-500/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-foreground">Bộ lọc công thức</span>
                    {activeFilterCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-primary text-primary-foreground rounded-full shadow-xs animate-in fade-in zoom-in-95">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-default-400 font-normal">
                    Tùy chỉnh tiêu chí tìm kiếm món ăn
                  </p>
                </div>
              </div>

              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="rounded-full text-default-400 hover:text-foreground"
                onPress={onClose}
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </Button>
            </DrawerHeader>

            {/* 2. Scrollable Body */}
            <DrawerBody className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-3">
              
              {/* 1. LỌC THEO NGUYÊN LIỆU (COMBOBOX DROPDOWN) */}
              <div ref={comboboxRef} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <span>Lọc theo nguyên liệu</span>
                  </span>
                  {filters.ingredientIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onFilterChange({ ...filters, ingredientIds: [] })}
                      className="text-xs text-danger font-semibold hover:underline cursor-pointer transition-colors"
                    >
                      Xóa tất cả ({filters.ingredientIds.length})
                    </button>
                  )}
                </div>

                {/* Combobox Trigger / Search Input */}
                <div className="relative">
                  <div 
                    onClick={() => setIsComboboxOpen(true)}
                    className={`flex items-center gap-2.5 h-11 px-3.5 rounded-xl bg-default-100 hover:bg-default-200/70 border cursor-pointer transition-all ${
                      isComboboxOpen 
                        ? 'border-primary ring-2 ring-primary/20 bg-background' 
                        : 'border-transparent'
                    }`}
                  >
                    <Search className="w-4 h-4 text-default-400 shrink-0" />
                    <input
                      type="text"
                      value={ingredientSearch}
                      onChange={(e) => {
                        setIngredientSearch(e.target.value);
                        if (!isComboboxOpen) setIsComboboxOpen(true);
                      }}
                      onFocus={() => setIsComboboxOpen(true)}
                      placeholder="Tìm và chọn nguyên liệu..."
                      className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-default-400 outline-none cursor-text"
                    />
                    {ingredientSearch ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIngredientSearch('');
                        }}
                        className="text-default-400 hover:text-foreground shrink-0 p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <ChevronDown className={`w-4 h-4 text-default-400 shrink-0 transition-transform ${isComboboxOpen ? 'rotate-180' : ''}`} />
                    )}
                  </div>

                  {/* Dropdown Menu Container */}
                  {isComboboxOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-content1 border border-divider/70 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-72">
                      
                      {/* Category Quick Filter inside Dropdown */}
                      <div className="p-2 border-b border-divider/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-default-50/50">
                        <button
                          type="button"
                          onClick={() => setSelectedIngredientCategory(null)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                            selectedIngredientCategory === null
                              ? 'bg-primary text-primary-foreground shadow-xs'
                              : 'text-default-600 hover:bg-default-100'
                          }`}
                        >
                          Tất cả
                        </button>
                        {Object.values(CATEGORIES).map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedIngredientCategory(cat === selectedIngredientCategory ? null : cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                              selectedIngredientCategory === cat
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'text-default-600 hover:bg-default-100'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Ingredients List */}
                      <div className="overflow-y-auto divide-y divide-divider/30 p-1 flex-1">
                        {filteredCatalogIngredients.length === 0 ? (
                          <div className="py-6 text-center text-sm text-default-400">
                            Không tìm thấy nguyên liệu phù hợp
                          </div>
                        ) : (
                          filteredCatalogIngredients.map(item => {
                            const isSelected = filters.ingredientIds.includes(item.id);
                            const category = item.default_category || autoCategorizeIngredient(item.name);
                            const theme = getCategoryTheme(category);
                            const Icon = theme.icon;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleToggleIngredient(item.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 text-left rounded-xl transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-primary/10 dark:bg-primary/20 text-foreground' 
                                    : 'hover:bg-default-100/70 text-default-700'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {item.image_url ? (
                                    <Avatar
                                      src={item.image_url}
                                      size="sm"
                                      className="w-8 h-8 shrink-0 rounded-xl"
                                    />
                                  ) : (
                                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${theme.bg} ${theme.text}`}>
                                      <Icon className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="flex flex-col min-w-0">
                                    <span className={`text-sm font-semibold truncate ${isSelected ? 'text-primary font-bold' : 'text-foreground'}`}>
                                      {item.name}
                                    </span>
                                    <span className="text-xs text-default-400">
                                      {category}
                                    </span>
                                  </div>
                                </div>

                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                                  isSelected 
                                    ? 'bg-primary border-primary text-white shadow-xs' 
                                    : 'border-default-300 dark:border-default-600'
                                }`}>
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Dropdown Footer */}
                      <div className="p-2.5 border-t border-divider/40 bg-default-50/50 flex items-center justify-between">
                        <span className="text-xs text-default-500 font-medium px-1">
                          Đã chọn {filters.ingredientIds.length} nguyên liệu
                        </span>
                        <Button
                          size="sm"
                          color="primary"
                          onPress={() => setIsComboboxOpen(false)}
                          className="h-8 px-3.5 text-xs font-bold rounded-lg"
                        >
                          Xong
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Ingredients Chips Cloud */}
                {filters.ingredientIds.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-semibold text-default-500">
                      Nguyên liệu đã chọn ({filters.ingredientIds.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {filters.ingredientIds.map(id => {
                        const item = allIngredients.find(i => i.id === id);
                        if (!item) return null;
                        const category = item.default_category || autoCategorizeIngredient(item.name);
                        const theme = getCategoryTheme(category);
                        const Icon = theme.icon;

                        return (
                          <span
                            key={id}
                            className={`inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-xl text-xs font-semibold border ${theme.bg} ${theme.text} border-primary/20 shadow-xs animate-in fade-in zoom-in-95`}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(id)}
                              className="w-4 h-4 rounded-full hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center transition-colors ml-0.5 cursor-pointer"
                              aria-label={`Xoá ${item.name}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Phân cách có padding hai bên */}
              <FilterDivider />

              {/* 2. ĐỘ KHÓ */}
              <div className="space-y-2.5">
                <span className="text-sm font-bold text-foreground flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-warning/15 text-warning flex items-center justify-center shrink-0 shadow-xs">
                    <Flame className="w-4 h-4" />
                  </div>
                  <span>Độ khó</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {difficultyOptions.map(diff => {
                    const isSelected = filters.difficulties.includes(diff.label);
                    return (
                      <button
                        key={diff.label}
                        type="button"
                        onClick={() => toggleDifficulty(diff.label)}
                        className={`h-10 px-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                          isSelected
                            ? diff.colorClass + ' shadow-xs'
                            : DEFAULT_INACTIVE_BUTTON_CLASS
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                        <span>{diff.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phân cách có padding hai bên */}
              <FilterDivider />

              {/* 3. THỜI GIAN NẤU */}
              <div className="space-y-2.5">
                <span className="text-sm font-bold text-foreground flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span>Thời gian nấu tối đa</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {timeOptions.map(opt => {
                    const isSelected = filters.maxTime === opt.value;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => onFilterChange({ ...filters, maxTime: opt.value })}
                        className={`h-10 px-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : DEFAULT_INACTIVE_BUTTON_CLASS
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phân cách có padding hai bên */}
              <FilterDivider />

              {/* 4. TRẠNG THÁI THỰC HIỆN */}
              <div className="space-y-2.5">
                <span className="text-sm font-bold text-foreground flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0 shadow-xs">
                    <ChefHat className="w-4 h-4" />
                  </div>
                  <span>Trạng thái thực hiện</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {cookedOptions.map(opt => {
                    const isSelected = (filters.cookedStatus ?? 'all') === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onFilterChange({ ...filters, cookedStatus: opt.value as 'all' | 'cooked' | 'uncooked' })}
                        className={`h-10 px-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : DEFAULT_INACTIVE_BUTTON_CLASS
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phân cách có padding hai bên */}
              <FilterDivider />

              {/* 5. ĐÁNH GIÁ TỐI THIỂU */}
              <div className="space-y-2.5">
                <span className="text-sm font-bold text-foreground flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
                    <Star className="w-4 h-4 fill-amber-500" />
                  </div>
                  <span>Đánh giá tối thiểu</span>
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {ratingOptions.map(opt => {
                    const isSelected = (filters.minRating ?? 0) === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onFilterChange({ ...filters, minRating: opt.value })}
                        className={`h-10 px-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : DEFAULT_INACTIVE_BUTTON_CLASS
                        }`}
                      >
                        {opt.value > 0 && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phân cách có padding hai bên */}
              <FilterDivider />

              {/* 6. MÓN BIẾN THỂ */}
              <div className="flex items-center justify-between py-1">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-secondary" />
                    <span>Bao gồm món biến thể</span>
                  </span>
                  <span className="text-xs text-default-400">
                    Hiển thị các phiên bản công thức con
                  </span>
                </div>
                <Switch
                  isSelected={!filters.hideVariants}
                  onValueChange={(val) => onFilterChange({ ...filters, hideVariants: !val })}
                  size="md"
                  color="primary"
                />
              </div>

              {/* 7. THẺ CÔNG THỨC */}
              {availableTags && availableTags.length > 0 && (
                <>
                  {/* Phân cách có padding hai bên */}
                  <FilterDivider />
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-xs">
                        <Layers className="w-4 h-4" />
                      </div>
                      <span>Thẻ công thức ({availableTags.length})</span>
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                      {availableTags.map(tag => {
                        const isSelected = (filters.tags || []).includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const newTags = isSelected
                                ? (filters.tags || []).filter(t => t !== tag)
                                : [...(filters.tags || []), tag];
                              onFilterChange({ ...filters, tags: newTags });
                            }}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold'
                                : 'bg-default-100/70 hover:bg-default-200/70 text-default-600 border-transparent'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                            #{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </DrawerBody>

            {/* 3. Sticky Footer */}
            <DrawerFooter className="px-5 py-4 border-t border-divider/50 flex items-center gap-3 bg-background/95 backdrop-blur-md sticky bottom-0 z-30">
              <Button
                variant="flat"
                color="default"
                onPress={handleClear}
                className="flex-1 font-semibold rounded-xl h-11 text-sm"
              >
                Đặt lại
              </Button>
              <Button
                color="primary"
                onPress={() => onOpenChange(false)}
                className="flex-1 font-bold rounded-xl h-11 text-sm shadow-md"
              >
                Áp dụng bộ lọc
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
