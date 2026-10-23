import React from 'react';
import { Button } from '@/ui';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

interface PageHeaderProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  prefix?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  description,
  showBackButton = false, 
  onBack, 
  actions,
  prefix,
  className = ""
}: PageHeaderProps) {
  const navigate = useNavigate();

  const rootClass = twMerge(clsx('flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0', className));

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={rootClass}>
      <div className="flex items-center gap-3 shrink-0">
        {showBackButton && (
          <Button
            isIconOnly
            variant="light"
            size="sm"
            radius="full"
            className="text-foreground shrink-0"
            onPress={handleBack}
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        {prefix}
        {title && (
          <div>
            <h1 className="app-page-title">{title}</h1>
            {description && <p className="app-page-subtitle mt-1">{description}</p>}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex-1 w-full xl:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
