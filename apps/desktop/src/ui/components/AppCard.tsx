import type { ReactNode } from 'react';
import { Card as HeroUICard, type CardProps as HeroUICardProps } from '@heroui/react';

export interface AppCardProps extends Omit<HeroUICardProps, 'children'> {
  children?: ReactNode;
  dashed?: boolean;
  pressable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function AppCard({ 
  children, 
  dashed = false, 
  pressable = false, 
  padding,
  className = '', 
  ...props 
}: AppCardProps) {
  const cardTypeCls = dashed ? 'app-card-dashed' : 'app-card';
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
