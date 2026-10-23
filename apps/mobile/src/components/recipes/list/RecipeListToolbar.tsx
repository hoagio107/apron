import { Input, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Badge } from '@/ui';
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
    <div className="flex flex-col md:flex-row justify-end gap-3 w-full">
      {/* Search Input */}
      <Input
        placeholder="Tìm kiếm công thức..."
        variant="flat"
        classNames={{
          base: "w-full md:max-w-[300px]",
          input: "text-small",
        }}
        size="md"
        value={searchQuery}
        onValueChange={onSearchChange}
        startContent={<Search className="w-4 h-4 text-default-400" />}
      />

      {/* Action Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden">

        {/* Filters */}
        <Badge content={filterCount} isInvisible={filterCount === 0} color="danger" shape="circle">
          <Button 
            isIconOnly
            variant="flat" 
            color={filterCount > 0 ? "primary" : "default"}
            onPress={onOpenFilter}
          >
            <Filter className="w-5 h-5" />
          </Button>
        </Badge>

        {/* Sort */}
        <Dropdown>
          <DropdownTrigger>
            <Button isIconOnly variant="flat">
              <ArrowUpDown className="w-5 h-5" />
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
          isIconOnly
          variant="flat" 
          color="default"
          onPress={onToggleSelectMode}
        >
          <CheckSquare className="w-5 h-5 text-default-500" />
        </Button>

        <div className="w-px h-6 bg-default-200 mx-1 shrink-0" />

        {/* View toggles */}
        <div className="flex items-center bg-default-100 rounded-lg p-1 shrink-0">
          <Button
            isIconOnly
            size="md"
            variant={viewType === 'grid-portrait' ? 'solid' : 'light'}
            color={viewType === 'grid-portrait' ? 'primary' : 'default'}
            onPress={() => onViewTypeChange('grid-portrait')}
            className={viewType === 'grid-portrait' ? 'shadow-sm' : ''}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="md"
            variant={viewType === 'grid-square' ? 'solid' : 'light'}
            color={viewType === 'grid-square' ? 'primary' : 'default'}
            onPress={() => onViewTypeChange('grid-square')}
            className={viewType === 'grid-square' ? 'shadow-sm' : ''}
          >
            <Grip className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
