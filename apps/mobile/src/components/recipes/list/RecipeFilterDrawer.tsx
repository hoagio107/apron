import { useTranslation } from 'react-i18next';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerBody, 
  DrawerFooter, 
  Button 
} from '@/ui';
import { 
  Filter, 
  Check, 
  Clock, 
  Star, 
  Flame, 
  X, 
  Layers, 
  ChefHat 
} from 'lucide-react';
import { DEFAULT_TAGS } from '@apron/core';

export interface RecipeFilterState {
  difficulties: string[];
  maxTime: number | null; // minutes
  tags: string[];
  cookedStatus?: 'all' | 'cooked' | 'uncooked';
  minRating?: number;
}

export const defaultFilterState: RecipeFilterState = {
  difficulties: [],
  maxTime: null,
  tags: [],
  cookedStatus: 'all',
  minRating: 0
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
  const { t } = useTranslation();

  // Options
  const timeOptions = [
    { label: t('recipes.filter.all'), value: null },
    { label: `≤ 15 ${t('common.time.minutes')}`, value: 15 },
    { label: `≤ 30 ${t('common.time.minutes')}`, value: 30 },
    { label: `≤ 60 ${t('common.time.minutes')}`, value: 60 },
  ];

  const difficultyOptions = [
    { value: 'Dễ', label: t('recipes.difficulty.easy'), colorClass: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold' },
    { value: 'Trung bình', label: t('recipes.difficulty.medium'), colorClass: 'border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold' },
    { value: 'Khó', label: t('recipes.difficulty.hard'), colorClass: 'border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold' }
  ];

  const cookedOptions = [
    { label: t('recipes.filter.cookedAll'), value: 'all' },
    { label: t('recipes.filter.cooked'), value: 'cooked' },
    { label: t('recipes.filter.uncooked'), value: 'uncooked' }
  ];

  const ratingOptions = [
    { label: t('recipes.filter.all'), value: 0 },
    { label: '3+ ★', value: 3 },
    { label: '4+ ★', value: 4 },
    { label: '5 ★', value: 5 }
  ];

  const activeFilterCount = 
    (filters.difficulties.length > 0 ? 1 : 0) + 
    (filters.maxTime !== null ? 1 : 0) + 
    ((filters.tags?.length ?? 0) > 0 ? 1 : 0) + 
    (filters.cookedStatus && filters.cookedStatus !== 'all' ? 1 : 0) + 
    ((filters.minRating ?? 0) > 0 ? 1 : 0);

  const handleClear = () => {
    onFilterChange(defaultFilterState);
  };

  const toggleDifficulty = (diffValue: string) => {
    const isSelected = filters.difficulties.includes(diffValue);
    const newDiffs = isSelected
      ? filters.difficulties.filter(d => d !== diffValue)
      : [...filters.difficulties, diffValue];
    onFilterChange({ ...filters, difficulties: newDiffs });
  };

  return (
    <Drawer 
      isOpen={isOpen} 
      onOpenChange={onOpenChange} 
      size="md" 
      placement="right" 
      hideCloseButton
      classNames={{
        base: "max-w-md w-full bg-background dark:bg-background border-l border-divider/60 shadow-2xl flex flex-col top-[calc(var(--sat,0px)+10px)] h-[calc(100dvh-var(--sat,0px)-10px)] max-h-[calc(100dvh-var(--sat,0px)-10px)] rounded-tl-3xl pb-safe overflow-hidden",
        backdrop: "bg-black/60 backdrop-blur-sm"
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            {/* 1. Header */}
            <DrawerHeader className="flex items-center justify-between px-5 py-3.5 border-b border-divider/50 bg-background/90 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-teal-500/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-foreground">{t('recipes.filter.title')}</span>
                    {activeFilterCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-primary text-primary-foreground rounded-full shadow-xs animate-in fade-in zoom-in-95">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-default-400 font-normal">
                    {t('recipes.filter.resetFilters')} &bull; {activeFilterCount} {t('common.actions.filter').toLowerCase()}
                  </p>
                </div>
              </div>

              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="rounded-full text-default-400 hover:text-foreground"
                onPress={onClose}
                aria-label={t('common.actions.close')}
              >
                <X className="w-5 h-5" />
              </Button>
            </DrawerHeader>

            {/* 2. Scrollable Body */}
            <DrawerBody className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-3">
              
              {/* 1. ĐỘ KHÓ */}
              <div className="space-y-2.5">
                <span className="text-sm font-bold text-foreground flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-warning/15 text-warning flex items-center justify-center shrink-0 shadow-xs">
                    <Flame className="w-4 h-4" />
                  </div>
                  <span>{t('recipes.filter.difficulty')}</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {difficultyOptions.map(diff => {
                    const isSelected = filters.difficulties.includes(diff.value);
                    return (
                      <button
                        key={diff.value}
                        type="button"
                        onClick={() => toggleDifficulty(diff.value)}
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

              <FilterDivider />

              {/* 2. THỜI GIAN NẤU */}
              <div className="space-y-2.5">
                <span className="text-sm font-bold text-foreground flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span>{t('recipes.filter.maxTime')}</span>
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

              <FilterDivider />

              {/* 3. TRẠNG THÁI NẤU */}
              <div className="space-y-2.5">
                <span className="text-sm font-bold text-foreground flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0 shadow-xs">
                    <ChefHat className="w-4 h-4" />
                  </div>
                  <span>{t('recipes.filter.cookedStatus')}</span>
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

              <FilterDivider />

              {/* 4. ĐÁNH GIÁ TỐI THIỂU */}
              <div className="space-y-2.5">
                <span className="text-sm font-bold text-foreground flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
                    <Star className="w-4 h-4 fill-amber-500" />
                  </div>
                  <span>{t('recipes.filter.minRating')}</span>
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



              {/* 6. THẺ CÔNG THỨC */}
              {availableTags && availableTags.length > 0 && (
                <>
                  <FilterDivider />
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-xs">
                        <Layers className="w-4 h-4" />
                      </div>
                      <span>{t('recipes.filter.tags')} ({availableTags.length})</span>
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                      {availableTags.map(tag => {
                        const isSelected = (filters.tags || []).includes(tag);
                        const matchedTag = DEFAULT_TAGS.find(t => t.id === tag || t.slug === tag || t.name.toLowerCase() === tag.toLowerCase());
                        const displayTag = matchedTag ? matchedTag.name : tag.replace(/^[a-z]+-/, '').replace(/-/g, ' ');
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
                            #{displayTag}
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
                {t('recipes.filter.resetFilters')}
              </Button>
              <Button
                color="primary"
                onPress={() => onOpenChange(false)}
                className="flex-1 font-bold rounded-xl h-11 text-sm shadow-md"
              >
                {t('recipes.filter.applyFilters')}
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
