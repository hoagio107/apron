import type { ReactNode } from 'react';
import { Button } from '@heroui/react';

export interface EmptyStateProps {
  /** Icon chính đại diện cho trạng thái rỗng */
  icon: ReactNode;
  /** Tiêu đề ngắn gọn (tuỳ chọn) */
  title?: string;
  /** Mô tả chi tiết trạng thái rỗng */
  description: string;
  /** Nhãn của nút hành động (tuỳ chọn) */
  actionLabel?: string;
  /** Callback khi bấm nút hành động */
  onAction?: () => void;
  /** Node hành động tuỳ biến thay thế actionLabel */
  action?: ReactNode;
  /** Màu sắc của nút hành động (mặc định 'primary') */
  actionColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default';
  /** Variant của nút hành động (mặc định 'flat' để hài hoà, không bị chói) */
  actionVariant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost';
  /** Chế độ compact cho hiển thị trong thẻ Card hoặc phân mục nhỏ của Dashboard */
  compact?: boolean;
  /** Bố cục: 'vertical' (dọc - mặc định) hoặc 'horizontal' (ngang nhỏ gọn đồng bộ trên Dashboard) */
  layout?: 'vertical' | 'horizontal';
  className?: string;
}

/**
 * EmptyState — Component chuẩn hoá trạng thái rỗng của Design System APRON.
 * Đảm bảo mọi trạng thái rỗng trên toàn ứng dụng có cùng:
 * - Kích cỡ badge hình tròn/vuông bo góc bọc icon
 * - Thang font chữ chuẩn (app-card-title / app-body-text)
 * - Nút hành động cùng style (size="sm", variant="flat")
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  actionColor = 'primary',
  actionVariant = 'flat',
  compact = false,
  layout = 'vertical',
  className = '',
}: EmptyStateProps) {
  if (layout === 'horizontal') {
    return (
      <div className={`flex items-center justify-between gap-3 w-full ${className}`}>
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-default-100 flex items-center justify-center text-default-500 shrink-0">
            {icon}
          </div>
          <div className="flex flex-col min-w-0">
            {title && <span className="text-sm font-semibold text-foreground truncate">{title}</span>}
            <span className="text-xs text-default-500 truncate">{description}</span>
          </div>
        </div>
        {action ?? (
          actionLabel && onAction ? (
            <Button
              size="sm"
              color={actionColor}
              variant={actionVariant}
              onPress={onAction}
              className="shrink-0 font-medium text-xs rounded-full"
            >
              {actionLabel}
            </Button>
          ) : null
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex flex-col items-center justify-center text-center py-6 px-4 gap-3 ${className}`}>
        <div className="w-12 h-12 rounded-full bg-default-100 flex items-center justify-center text-default-400 shrink-0">
          {icon}
        </div>
        {title && <h4 className="app-card-title text-foreground">{title}</h4>}
        <p className="app-body-text text-default-500 max-w-xs">{description}</p>
        {action ?? (
          actionLabel && onAction ? (
            <Button
              size="sm"
              color={actionColor}
              variant={actionVariant}
              onPress={onAction}
              className="mt-1"
            >
              {actionLabel}
            </Button>
          ) : null
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center flex-1 py-12 px-4 text-center gap-3 ${className}`}>
      <div className="w-20 h-20 bg-default-100 rounded-full flex items-center justify-center text-default-400 mb-2 shrink-0">
        {icon}
      </div>
      {title && <h3 className="app-section-title text-foreground">{title}</h3>}
      <p className="app-body-text text-default-500 max-w-md">{description}</p>
      {action ?? (
        actionLabel && onAction ? (
          <Button
            size="md"
            color={actionColor}
            variant={actionVariant}
            onPress={onAction}
            className="mt-3"
          >
            {actionLabel}
          </Button>
        ) : null
      )}
    </div>
  );
}
