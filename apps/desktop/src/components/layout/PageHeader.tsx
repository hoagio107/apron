import React from 'react';
import { Button } from '@apron/ui';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
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

  return (
    <div className={`sticky -top-8 -mx-8 px-8 pt-4 pb-4 z-50 flex items-center justify-between bg-default-50 ${className}`}>
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button 
            isIconOnly
            variant="light" 
            onPress={handleBack}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
