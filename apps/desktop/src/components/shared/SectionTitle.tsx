import type { ReactNode } from 'react';
import { Button } from '@apron/ui';
import { ArrowRight } from 'lucide-react';

interface SectionTitleProps {
  title: ReactNode;
  /** Icon shown to the left of the title */
  icon?: ReactNode;
  /** Label for the "see all" action button */
  actionLabel?: string;
  /** Handler for action button press */
  onAction?: () => void;
  /** Custom action element (overrides actionLabel/onAction) */
  action?: ReactNode;
  className?: string;
}

/**
 * SectionTitle — Consistent section header with optional "see all" action.
 *
 * Usage:
 *   <SectionTitle title="Công thức gần đây" icon={<Flame />} actionLabel="Xem tất cả" onAction={() => navigate('/recipes')} />
 */
export function SectionTitle({ title, icon, actionLabel, onAction, action, className }: SectionTitleProps) {
  return (
    <div className={`flex items-center justify-between ${className ?? ''}`}>
      <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
        {icon}
        {title}
      </h2>
      {action ?? (
        actionLabel && onAction ? (
          <Button
            variant="light"
            color="primary"
            size="sm"
            endContent={<ArrowRight className="w-4 h-4" />}
            onPress={onAction}
          >
            {actionLabel}
          </Button>
        ) : null
      )}
    </div>
  );
}
