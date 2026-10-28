import type { ReactNode } from 'react';
import { Button } from './Button';
import { ArrowRight } from 'lucide-react';

export interface SectionTitleProps {
  title: ReactNode;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  action?: ReactNode;
  className?: string;
}

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
