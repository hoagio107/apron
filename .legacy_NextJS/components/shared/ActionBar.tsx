
"use client";

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActionBarProps {
  selectedCount: number;
  onCancel: () => void;
  children: ReactNode;
  className?: string;
}

export function ActionBar({ selectedCount, onCancel, children, className }: ActionBarProps) {
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 md:left-64 z-40 p-4 md:pb-8 transition-all duration-300 pointer-events-none flex justify-center",
      className
    )}>
      <div className="pointer-events-auto w-full max-w-5xl bg-gray-900 dark:bg-gray-800 text-white border border-white/10 shadow-none rounded-3xl flex flex-col-reverse md:flex-row md:items-center justify-between gap-4 p-4 md:px-8 animate-in slide-in-from-bottom-8 duration-500">
        <div className="flex items-center justify-between md:justify-start gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-sm shadow-none">
              {selectedCount}
            </div>
            <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Mục đã chọn</span>
          </div>
          
          <button 
            onClick={onCancel}
            className="text-xs font-bold text-gray-500 hover:text-white underline decoration-dotted transition-colors"
          >
            Hủy chọn
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="h-6 w-px bg-gray-700 hidden md:block mr-2" />
          <div className="flex gap-3 w-full md:w-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
