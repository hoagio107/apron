import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface FormFieldProps {
  label: string;
  icon?: LucideIcon;
  children: ReactNode;
  error?: string;
  className?: string;
}

export function FormField({ label, icon: Icon, children, error, className }: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-2 w-full ${className || ''}`}>
      <span className="text-sm font-medium text-default-700 flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-primary" />} 
        {label}
      </span>
      {children}
      {error && <span className="text-tiny text-danger">{error}</span>}
    </div>
  );
}
