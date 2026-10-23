import React from 'react';
import { Button } from '@/ui';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export function PageHeader({ 
  title, 
  description,
  showBackButton = true, 
  onBack, 
  actions,
  className = ""
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const rootClass = twMerge(clsx('flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-12 pb-4', className));

  return (
    <div className={rootClass}>
      <div className="flex items-start sm:items-center gap-4">
        {showBackButton && (
          <Button 
            isIconOnly
            variant="flat" 
            onPress={handleBack}
            aria-label="Back"
            className="mt-1 sm:mt-0 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="app-page-title">{title}</h1>
          {description && <p className="app-page-subtitle mt-1">{description}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
