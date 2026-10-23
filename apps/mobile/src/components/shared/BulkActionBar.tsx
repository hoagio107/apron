import React from 'react';
import { Button } from '@/ui';

export interface BulkAction {
  key: string;
  label: string;
  icon: React.ReactNode;
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

/**
 * BulkActionBar — Floating action bar for multi-select mode.
 *
 * Renders at the bottom center of the viewport, animating in/out.
 * Mobile: scrollable row. Desktop: full row.
 *
 * Usage:
 *   {isSelectMode && (
 *     <BulkActionBar
 *       selectedCount={selectedIds.size}
 *       totalCount={filteredItems.length}
 *       onSelectAll={selectAll}
 *       onCancel={toggleSelectMode}
 *       actions={[
 *         { key: 'delete', label: 'Xoá', icon: <Trash2 />, color: 'danger', onPress: handleDelete },
 *       ]}
 *     />
 *   )}
 */
export function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onCancel,
  actions,
}: BulkActionBarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 md:gap-4 px-4 md:px-6 py-2 md:py-3 bg-content1 shadow-2xl border border-default-200 rounded-2xl md:rounded-full animate-in slide-in-from-bottom-8 fade-in duration-300 w-[calc(100vw-2rem)] md:w-auto overflow-x-auto [&::-webkit-scrollbar]:hidden justify-start md:justify-center">
      {/* Select All + Count */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <Button
          variant="flat"
          onPress={onSelectAll}
          className="px-3 min-w-0 text-sm"
          size="sm"
        >
          <span className="hidden md:inline">
            {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </span>
          <span className="md:hidden">Tất cả</span>
        </Button>
        <span className="font-medium text-primary-700 min-w-[30px] md:min-w-[100px] text-center text-sm md:text-base">
          <span className="hidden md:inline">Đã chọn </span>
          {selectedCount}
        </span>
      </div>

      <div className="w-px h-6 md:h-8 bg-default-200 mx-1 shrink-0" />

      {/* Action buttons */}
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        {actions.map((action) => (
          <Button
            key={action.key}
            color={action.color ?? 'default'}
            variant={action.variant ?? 'flat'}
            onPress={action.onPress}
            title={action.label}
            className="min-w-10 w-10 h-10 px-0 md:h-auto md:w-auto md:px-4"
            size="sm"
          >
            {action.icon}
            <span className="hidden md:inline">{action.label}</span>
          </Button>
        ))}

        <div className="w-px h-6 md:h-8 bg-default-200 mx-1 shrink-0" />

        <Button
          variant="light"
          onPress={onCancel}
          className="min-w-10 px-3 md:px-4 text-sm"
          size="sm"
        >
          Hủy
        </Button>
      </div>
    </div>
  );
}
