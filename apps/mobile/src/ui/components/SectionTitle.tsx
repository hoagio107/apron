import type { ReactNode } from 'react';
import { Button } from '@heroui/react';
import { ArrowRight } from 'lucide-react';

export interface SectionTitleProps {
  /** Tiêu đề chính của phân mục */
  title: ReactNode;
  /** Icon hiển thị bên trái tiêu đề */
  icon?: ReactNode;
  /** Nhãn của nút hành động phụ bên phải (VD: "Xem tất cả", "Chỉnh sửa") */
  actionLabel?: string;
  /** Callback khi click vào nút hành động phụ */
  onAction?: () => void;
  /** Tùy chọn truyền node hành động custom (thay thế actionLabel/onAction) */
  action?: ReactNode;
  className?: string;
}

/**
 * SectionTitle — Component chuẩn hoá tiêu đề phân mục (Section Header) của APRON.
 * Đảm bảo mọi phân mục cùng cấp độ trên trang chủ và toàn ứng dụng đều có chung
 * font-size (1.125rem / 18px), cùng màu chữ, cùng icon size (w-5 h-5),
 * và cùng kích thước nút hành động (Button size="sm", text-xs).
 */
export function SectionTitle({
  title,
  icon,
  actionLabel,
  onAction,
  action,
  className = '',
}: SectionTitleProps) {
  return (
    <div className={`flex items-center justify-between min-h-[36px] ${className}`}>
      <h2 className="app-section-title">
        {icon && <span className="shrink-0 flex items-center">{icon}</span>}
        <span className="truncate">{title}</span>
      </h2>
      {action ?? (
        actionLabel && onAction ? (
          <Button
            variant="light"
            color="primary"
            size="sm"
            className="text-xs font-semibold px-2.5 h-8 min-w-0"
            endContent={<ArrowRight className="w-3.5 h-3.5" />}
            onPress={onAction}
          >
            {actionLabel}
          </Button>
        ) : null
      )}
    </div>
  );
}
