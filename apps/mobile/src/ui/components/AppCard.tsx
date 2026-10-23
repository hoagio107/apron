import type { ReactNode } from 'react';
import { Card as HeroUICard, type CardProps as HeroUICardProps } from '@heroui/react';

export interface AppCardProps extends Omit<HeroUICardProps, 'children'> {
  children?: ReactNode;
  /** Thẻ card viền đứt nét cho các trạng thái rỗng / upload */
  dashed?: boolean;
  /** Cho phép tương tác (hover sáng nhẹ, hiệu ứng bấm active) */
  pressable?: boolean;
  /** Mức độ padding bên trong thẻ */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Custom class bổ sung */
  className?: string;
}

/**
 * AppCard — Component hiển thị thẻ card chuẩn hoá của APRON.
 * Kế thừa Card từ HeroUI (cung cấp đầy đủ CardContext cho CardHeader, CardBody, CardFooter).
 * Style được chuẩn hoá tập trung từ style.css (.app-card, .app-card-dashed, .app-card-interactive).
 * Đảm bảo tự động thích ứng hoàn hảo với Light, Dark và System theme.
 */
export function AppCard({ 
  children, 
  dashed = false, 
  pressable = false, 
  padding,
  className = '', 
  ...props 
}: AppCardProps) {
  const cardTypeCls = dashed ? 'app-card-dashed' : 'app-card border-none';
  const interactiveCls = pressable ? 'app-card-interactive' : '';
  const paddingCls = padding === 'none' ? 'p-0' : padding === 'sm' ? 'p-3' : padding === 'md' ? 'p-4 sm:p-5' : padding === 'lg' ? 'p-6' : '';
  const combined = [cardTypeCls, interactiveCls, paddingCls, className].filter(Boolean).join(' ');

  return (
    <HeroUICard 
      shadow="none"
      isPressable={pressable}
      className={combined} 
      {...props}
    >
      {children}
    </HeroUICard>
  );
}
