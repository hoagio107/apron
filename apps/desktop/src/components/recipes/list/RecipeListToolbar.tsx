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
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-end py-2">
      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
        <div className="w-full sm:w-64 shrink-0 mr-2">
          <Input
            placeholder="Tìm kiếm công thức..."
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

        {/* Multi Select Toggle */}
        <Button 
          variant="flat" 
          color="default"
          startContent={<CheckSquare className="w-4 h-4 text-default-500" />}
          onPress={onToggleSelectMode}
        >
          Chọn nhiều
        </Button>

        <div className="w-px h-6 bg-default-200 mx-1 shrink-0" />

        {/* View toggle */}
        <Button
          isIconOnly
          variant="flat"
          aria-label={viewType === 'grid-portrait' ? 'Chuyển sang dạng lưới vuông' : 'Chuyển sang dạng thẻ dọc'}
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
