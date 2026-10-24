import React from 'react';
import { 
  Input, 
  Button, 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem, 
  Badge 
} from '@/ui';
import { Search, Filter, ArrowUpDown, Plus } from 'lucide-react';

export interface ToolbarFilterItem {
  key: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface ToolbarSortItem {
  key: string;
  label: string;
}

export interface ListToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Filter options
  filterItems?: ToolbarFilterItem[];
  selectedFilter?: string;
  onFilterChange?: (key: string) => void;
  filterCount?: number;
  onOpenFilter?: () => void;
  filterAriaLabel?: string;
  
  // Sort options
  sortItems?: ToolbarSortItem[];
  selectedSort?: string;
  onSortChange?: (key: string) => void;
  sortAriaLabel?: string;
  
  // Add action
  onAdd?: () => void;
  addLabel?: string;
  addIconOnly?: boolean;
  
  // Extra elements
  extraActions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function ListToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  filterItems,
  selectedFilter,
  onFilterChange,
  filterCount,
  onOpenFilter,
  filterAriaLabel = 'Bộ lọc',
  sortItems,
  selectedSort,
  onSortChange,
  sortAriaLabel = 'Sắp xếp',
  onAdd,
  addLabel = 'Thêm mới',
  addIconOnly = true,
  extraActions,
  children,
  className = ''
}: ListToolbarProps) {
  const isFilterActive =
    (filterCount !== undefined && filterCount > 0) ||
    (selectedFilter !== undefined && selectedFilter !== 'all');

  return (
    <div className={`flex flex-col md:flex-row justify-end gap-3 w-full ${className}`}>
      {/* Search Input */}
      <Input
        placeholder={searchPlaceholder}
        variant="flat"
        classNames={{
          base: 'w-full md:max-w-[300px]',
          input: 'text-small',
        }}
        size="md"
        value={searchQuery}
        onValueChange={onSearchChange}
        startContent={<Search className="w-4 h-4 text-default-400 shrink-0" />}
        isClearable
        onClear={() => onSearchChange('')}
      />

      {/* Action Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden shrink-0">
        {/* Add Button - Standard primary button placed first */}
        {onAdd && (
          <Button
            isIconOnly={addIconOnly}
            color="primary"
            onPress={onAdd}
            aria-label={addLabel}
            className="shrink-0 font-semibold"
          >
            <Plus className="w-5 h-5 shrink-0" />
            {!addIconOnly && <span>{addLabel}</span>}
          </Button>
        )}

        {/* Filter Trigger / Dropdown */}
        {onOpenFilter ? (
          <Badge
            content={filterCount}
            isInvisible={!filterCount || filterCount === 0}
            color="danger"
            shape="circle"
          >
            <Button
              isIconOnly
              variant="flat"
              color={isFilterActive ? 'primary' : 'default'}
              onPress={onOpenFilter}
              aria-label={filterAriaLabel}
            >
              <Filter className="w-5 h-5" />
            </Button>
          </Badge>
        ) : filterItems && filterItems.length > 0 ? (
          <Dropdown>
            <Badge
              content={filterCount ?? (isFilterActive ? 1 : 0)}
              isInvisible={!isFilterActive}
              color="danger"
              shape="circle"
            >
              <DropdownTrigger>
                <Button
                  isIconOnly
                  variant="flat"
                  color={isFilterActive ? 'primary' : 'default'}
                  aria-label={filterAriaLabel}
                >
                  <Filter className="w-5 h-5" />
                </Button>
              </DropdownTrigger>
            </Badge>
            <DropdownMenu
              aria-label={filterAriaLabel}
              selectedKeys={selectedFilter ? new Set([selectedFilter]) : new Set(['all'])}
              selectionMode="single"
              onSelectionChange={(keys) => onFilterChange?.(Array.from(keys)[0] as string)}
              items={filterItems}
            >
              {(item) => (
                <DropdownItem key={item.key} startContent={item.icon} textValue={item.label}>
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                    {item.count !== undefined && (
                      <span className="text-xs text-default-400 font-normal">({item.count})</span>
                    )}
                  </div>
                </DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
        ) : null}

        {/* Sort Dropdown */}
        {sortItems && sortItems.length > 0 && (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="flat" aria-label={sortAriaLabel}>
                <ArrowUpDown className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label={sortAriaLabel}
              selectedKeys={selectedSort ? new Set([selectedSort]) : undefined}
              selectionMode="single"
              onSelectionChange={(keys) => onSortChange?.(Array.from(keys)[0] as string)}
              items={sortItems}
            >
              {(item) => (
                <DropdownItem key={item.key} textValue={item.label}>
                  <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                </DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
        )}

        {/* Extra Action Buttons */}
        {extraActions}
        {children}
      </div>
    </div>
  );
}
