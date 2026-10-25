import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface FormFieldProps {
  label: ReactNode;
  icon?: LucideIcon;
  children: ReactNode;
  error?: string;
  className?: string;
  isRequired?: boolean;
}

export function FormField({ label, icon: Icon, children, error, className, isRequired }: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-2 w-full ${className || ''}`}>
      <span className="text-sm font-medium text-default-700 flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-primary" />} 
        {label}
        {isRequired && <span className="text-danger">*</span>}
      </span>
      {children}
      {error && <span className="text-tiny text-danger">{error}</span>}
    </div>
  );
}
