import type { ReactNode } from 'react';
import { Card as HeroUICard, type CardProps as HeroUICardProps } from '@heroui/react';

export interface AppCardProps extends Omit<HeroUICardProps, 'children'> {
  children?: ReactNode;
  dashed?: boolean;
  pressable?: boolean;
  className?: string;
}

export function AppCard({ 
  children, 
  dashed = false, 
  pressable = false, 
  className = '', 
  ...props 
}: AppCardProps) {
  const cardTypeCls = dashed ? 'app-card-dashed' : 'app-card border-none';
  const interactiveCls = pressable ? 'app-card-interactive' : '';
  const combined = [cardTypeCls, interactiveCls, className].filter(Boolean).join(' ');

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
