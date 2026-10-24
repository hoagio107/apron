import React from 'react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@/ui';
import { MoreHorizontal, X } from 'lucide-react';

export interface BulkAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  color?: 'primary' | 'secondary' | 'warning' | 'danger' | 'default' | 'success';
  variant?: 'flat' | 'solid' | 'light' | 'ghost' | 'bordered';
  onPress: () => void;
}

interface BulkActionBarProps {
  /** Number of currently selected items */
  selectedCount: number;
  /** Total items in the list (used for "select all" toggle) */
  totalCount: number;
  /** Callback when "Select All / Deselect All" is pressed */
  onSelectAll: () => void;
  /** Callback when "Cancel" is pressed */
  onCancel: () => void;
  /** List of action buttons to render */
  actions: BulkAction[];
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onCancel,
  actions,
}: BulkActionBarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-content1/95 backdrop-blur-md shadow-2xl border border-default-200/80 rounded-full animate-in slide-in-from-bottom-8 fade-in duration-300 max-w-[calc(100vw-2rem)] justify-center">
      {/* Select All + Count */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <Button
          variant="flat"
          onPress={onSelectAll}
          className="px-3 min-w-0 text-xs md:text-sm h-8 md:h-9 rounded-full font-medium shrink-0"
          size="sm"
        >
          {allSelected ? 'Bỏ chọn' : 'Tất cả'}
        </Button>
        <span className="font-semibold text-primary-600 text-xs md:text-sm px-1.5 shrink-0 whitespace-nowrap">
          Đã chọn {selectedCount}
        </span>
      </div>

      <div className="w-px h-4 bg-default-300/70 mx-1 shrink-0" />

      {/* MOBILE VIEW: Consolidated 3-dots button with Dropdown Popover */}
      <div className="flex md:hidden items-center shrink-0">
        <Dropdown
          placement="top"
          offset={12}
        >
          <DropdownTrigger>
            <Button
              isIconOnly
              color="default"
              variant="flat"
              size="sm"
              className="w-8 h-8 md:w-9 md:h-9 min-w-8 min-h-8 rounded-full text-default-600 hover:text-default-900 shrink-0"
              title="Thao tác hàng loạt"
              aria-label="Thao tác hàng loạt"
            >
              <MoreHorizontal className="w-4 h-4 md:w-4.5 md:h-4.5" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Thao tác hàng loạt"
            onAction={(key) => {
              const act = actions.find(a => a.key === key);
              if (act) act.onPress();
            }}
          >
            {actions.map((action) => {
              const isDanger = action.color === 'danger';
              return (
                <DropdownItem
                  key={action.key}
                  color={isDanger ? 'danger' : 'default'}
                  className={isDanger ? 'text-danger' : ''}
                  startContent={
                    <span className={`shrink-0 ${
                      action.color === 'primary' ? 'text-primary' :
                      action.color === 'secondary' ? 'text-secondary' :
                      action.color === 'warning' ? 'text-warning' :
                      action.color === 'danger' ? 'text-danger' :
                      'text-default-500'
                    }`}>
                      {action.icon}
                    </span>
                  }
                >
                  {action.label}
                </DropdownItem>
              );
            })}
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* DESKTOP VIEW: Full horizontal action buttons with labels */}
      <div className="hidden md:flex items-center gap-1.5 shrink-0">
        {actions.map((action) => (
          <Button
            key={action.key}
            color={action.color ?? 'default'}
            variant={action.variant ?? 'flat'}
            onPress={action.onPress}
            title={action.description || action.label}
            className="h-9 px-3 text-xs font-medium rounded-full"
            size="sm"
            startContent={action.icon}
          >
            {action.label}
          </Button>
        ))}
      </div>

      <div className="w-px h-4 bg-default-300/70 mx-1 shrink-0" />

      {/* Cancel button: Icon X */}
      <Button
        isIconOnly
        variant="light"
        onPress={onCancel}
        title="Thoát chế độ chọn"
        aria-label="Thoát chế độ chọn"
        className="w-8 h-8 md:w-9 md:h-9 min-w-8 min-h-8 rounded-full text-default-500 hover:text-default-800 hover:bg-default-200/60 transition-colors shrink-0"
        size="sm"
      >
        <X className="w-4 h-4 md:w-4.5 md:h-4.5" strokeWidth={2.2} />
      </Button>
    </div>
  );
}
