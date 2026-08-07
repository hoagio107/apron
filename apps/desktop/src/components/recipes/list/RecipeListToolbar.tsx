import { Input, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@apron/ui';
import { Search, LayoutGrid, LayoutList, Filter, ArrowUpDown, Grip } from 'lucide-react';
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
}

export function RecipeListToolbar({
  searchQuery,
  onSearchChange,
  viewType,
  onViewTypeChange,
  sortOption,
  onSortOptionChange,
  filterCount,
  onOpenFilter
}: RecipeListToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-content1 p-4 rounded-2xl shadow-sm border border-default-100">
      <div className="w-full sm:max-w-xs">
        <Input
          placeholder="Tìm kiếm công thức..."
          value={searchQuery}
          onValueChange={onSearchChange}
          startContent={<Search className="w-4 h-4 text-default-400" />}
          classNames={{
            inputWrapper: "bg-default-100/50 hover:bg-default-100 focus-within:!bg-default-100"
          }}
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
        {/* Filters */}
        <Button 
          variant="flat" 
          color={filterCount > 0 ? "primary" : "default"}
          startContent={<Filter className="w-4 h-4" />}
          onPress={onOpenFilter}
        >
          Lọc {filterCount > 0 && `(${filterCount})`}
        </Button>

        {/* Sort */}
        <Dropdown>
          <DropdownTrigger>
            <Button variant="flat" startContent={<ArrowUpDown className="w-4 h-4" />}>
              Sắp xếp
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Sort options"
            selectedKeys={new Set([sortOption])}
            selectionMode="single"
            onSelectionChange={(keys) => onSortOptionChange(Array.from(keys)[0] as string)}
          >
            <DropdownItem key="newest">Mới nhất</DropdownItem>
            <DropdownItem key="oldest">Cũ nhất</DropdownItem>
            <DropdownItem key="highest_rated">Đánh giá cao</DropdownItem>
            <DropdownItem key="quickest">Thời gian nhanh</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <div className="w-px h-6 bg-default-200 mx-1 shrink-0" />

        {/* View toggles */}
        <div className="flex items-center bg-default-100 rounded-lg p-1 shrink-0">
          <Button
            isIconOnly
            size="sm"
            variant={viewType === 'grid-portrait' ? 'solid' : 'light'}
            color={viewType === 'grid-portrait' ? 'primary' : 'default'}
            onPress={() => onViewTypeChange('grid-portrait')}
            className={viewType === 'grid-portrait' ? 'shadow-sm' : ''}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant={viewType === 'grid-square' ? 'solid' : 'light'}
            color={viewType === 'grid-square' ? 'primary' : 'default'}
            onPress={() => onViewTypeChange('grid-square')}
            className={viewType === 'grid-square' ? 'shadow-sm' : ''}
          >
            <Grip className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant={viewType === 'list' ? 'solid' : 'light'}
            color={viewType === 'list' ? 'primary' : 'default'}
            onPress={() => onViewTypeChange('list')}
            className={viewType === 'list' ? 'shadow-sm' : ''}
          >
            <LayoutList className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
