import type { ReactNode } from 'react';
import { AppCard } from './AppCard';

export interface StatCardProps {
  /** Icon hiển thị trong badge */
  icon: ReactNode;
  /** Nhãn mô tả bên dưới số liệu */
  label: string;
  /** Giá trị số liệu thống kê */
  value: ReactNode;
  /** Tông màu chủ đạo của icon badge. Mặc định: 'primary' */
  color?: 'primary' | 'secondary' | 'warning' | 'success' | 'danger' | 'default';
  /** Bố cục: 'horizontal' (ngang) hoặc 'vertical' (dọc gọn cho 4 cột full-width) */
  layout?: 'horizontal' | 'vertical';
  /** Tùy chọn click */
  onClick?: () => void;
  className?: string;
}

const colorMap: Record<string, { bg: string; text: string }> = {
  primary:   { bg: 'bg-primary/15',   text: 'text-primary' },
  secondary: { bg: 'bg-secondary/15', text: 'text-secondary' },
  warning:   { bg: 'bg-warning/15',   text: 'text-warning' },
  success:   { bg: 'bg-success/15',   text: 'text-success' },
  danger:    { bg: 'bg-danger/15',    text: 'text-danger' },
  default:   { bg: 'bg-default/15',   text: 'text-default-600' },
};

/**
 * StatCard — Component hiển thị số liệu thống kê chuẩn hoá của APRON.
 * Hỗ trợ layout 'vertical' giúp hiển thị 4 cột full-width gọn gàng trên mobile.
 */
export function StatCard({ 
  icon, 
  label, 
  value, 
  color = 'primary', 
  layout = 'horizontal',
  onClick,
  className = '' 
}: StatCardProps) {
  const { bg, text } = colorMap[color] ?? colorMap.primary;

  if (layout === 'vertical') {
    return (
      <AppCard 
        pressable={Boolean(onClick)} 
        onClick={onClick}
        className={`app-stat-card-vertical flex flex-col items-center justify-center text-center p-2.5 sm:p-3 gap-1.5 min-w-0 flex-1 ${className}`}
      >
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${bg} ${text}`}>
          {icon}
        </div>
        <div className="flex flex-col items-center min-w-0 w-full">
          <span className="text-base sm:text-xl font-bold text-foreground truncate w-full">{value}</span>
          <span className="text-[11px] sm:text-xs font-medium text-default-500 truncate w-full">{label}</span>
        </div>
      </AppCard>
    );
  }

  return (
    <AppCard 
      pressable={Boolean(onClick)} 
      onClick={onClick}
      className={`app-stat-card ${className}`}
    >
      <div className={`app-icon-badge ${bg} ${text}`}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="app-stat-label truncate">{label}</span>
        <span className="app-stat-value truncate">{value}</span>
      </div>
    </AppCard>
  );
}
