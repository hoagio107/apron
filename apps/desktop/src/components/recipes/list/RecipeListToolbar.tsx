import { useTranslation } from 'react-i18next';
import { Input, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@/ui';
import { Search, LayoutGrid, Filter, ArrowUpDown, Grip, CheckSquare } from 'lucide-react';
import type { RecipeViewType } from './RecipeCard';

interface RecipeListToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  viewType: RecipeViewType;
  onViewTypeChange: (type: RecipeViewType) => void;
  sortOption: string;
  onSortOptionChange: (option: string) => void;
  filterCount: number;
  onOpenFilter: () => void;
  onToggleSelectMode: () => void;
}

export function RecipeListToolbar({
  searchQuery,
  onSearchChange,
  viewType,
  onViewTypeChange,
  sortOption,
  onSortOptionChange,
  filterCount,
  onOpenFilter,
  onToggleSelectMode
}: RecipeListToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-end py-2">
      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
        <div className="w-full sm:w-64 shrink-0 mr-2">
          <Input
            placeholder={t('recipes.searchPlaceholder')}
            variant="flat"
            value={searchQuery}
            onValueChange={onSearchChange}
            startContent={<Search className="w-4 h-4 text-default-400" />}
          />
        </div>

        {/* Filters */}
        <Button 
          variant="flat" 
          color={filterCount > 0 ? "primary" : "default"}
          startContent={<Filter className="w-4 h-4" />}
          onPress={onOpenFilter}
        >
          {t('common.actions.filter')} {filterCount > 0 && `(${filterCount})`}
        </Button>

        {/* Sort */}
        <Dropdown>
          <DropdownTrigger>
            <Button variant="flat" startContent={<ArrowUpDown className="w-4 h-4" />}>
              {t('recipes.sort.label')}
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Sort options"
            selectedKeys={new Set([sortOption])}
            selectionMode="single"
            onSelectionChange={(keys) => onSortOptionChange(Array.from(keys)[0] as string)}
          >
            <DropdownItem key="newest">{t('recipes.sort.newest')}</DropdownItem>
            <DropdownItem key="oldest">{t('recipes.sort.oldest')}</DropdownItem>
            <DropdownItem key="highest_rated">{t('recipes.sort.highestRated')}</DropdownItem>
            <DropdownItem key="quickest">{t('recipes.sort.quickest')}</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <div className="w-px h-6 bg-default-200 mx-1 shrink-0" />

        {/* Multi Select Toggle */}
        <Button 
          variant="flat" 
          color="default"
          startContent={<CheckSquare className="w-4 h-4 text-default-500" />}
          onPress={onToggleSelectMode}
        >
          {t('common.actions.selectMultiple')}
        </Button>

        <div className="w-px h-6 bg-default-200 mx-1 shrink-0" />

        {/* View toggle */}
        <Button
          isIconOnly
          variant="flat"
          aria-label={viewType === 'grid-portrait' ? t('recipes.views.switchToSquare') : t('recipes.views.switchToPortrait')}
          onPress={() => onViewTypeChange(viewType === 'grid-portrait' ? 'grid-square' : 'grid-portrait')}
        >
          {viewType === 'grid-portrait' ? (
            <Grip className="w-5 h-5 text-default-600" />
          ) : (
            <LayoutGrid className="w-5 h-5 text-default-600" />
          )}
        </Button>
      </div>
    </div>
  );
}
