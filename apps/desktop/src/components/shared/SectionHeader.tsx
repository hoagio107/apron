import React from 'react';
import { CardHeader, Divider } from '@/ui';
import type { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  icon: LucideIcon;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export function SectionHeader({ title, icon: Icon, action, children }: SectionHeaderProps) {
  return (
    <>
      <CardHeader className="flex justify-between items-center min-h-14">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" /> {title}
          </h3>
          {children}
        </div>
        {action}
      </CardHeader>
      <div className="px-4">
        <Divider />
      </div>
    </>
  );
}
