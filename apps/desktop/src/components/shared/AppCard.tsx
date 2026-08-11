import type { ReactNode, HTMLAttributes } from 'react';

interface AppCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Use dashed border for empty state cards */
  dashed?: boolean;
  /** Make it interactive with hover effect */
  pressable?: boolean;
}

/**
 * AppCard — Standard card style for the app.
 * bg-white rounded-2xl border border-default-100 shadow-none
 */
export function AppCard({ children, dashed, pressable, className, ...props }: AppCardProps) {
  const base = 'bg-white rounded-2xl border shadow-none';
  const borderCls = dashed ? 'border-dashed border-default-200' : 'border-default-100';
  const interactiveCls = pressable ? 'cursor-pointer transition-colors hover:bg-default-50' : '';
  const combined = [base, borderCls, interactiveCls, className].filter(Boolean).join(' ');

  return (
    <div className={combined} {...props}>
      {children}
    </div>
  );
}
