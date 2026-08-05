
"use client";

import Link from 'next/link';
import { Tip, TIP_CATEGORIES } from '@/lib/recipe-types';
import { Card } from '@/components/ui/card';
import { Calendar, Check, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface TipCardProps {
  tip: Tip;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
}

export function TipCard({ tip, isSelectionMode, isSelected, onToggleSelection }: TipCardProps) {
  const category = TIP_CATEGORIES.find(c => c.id === tip.category_id) || TIP_CATEGORIES[0];
  
  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode && onToggleSelection) {
      e.preventDefault();
      e.stopPropagation();
      onToggleSelection(tip.id);
    }
  };

  const formattedDate = tip.createdAt ? format(new Date(tip.createdAt), 'dd/MM/yyyy', { locale: vi }) : 'Gần đây';

  return (
    <div className="relative group h-full" onClick={handleClick}>
      <Link href={isSelectionMode ? "#" : `/tips/${tip.id}`} className="block h-full">
        <Card className={cn(
          "overflow-hidden transition-all duration-500 border bg-white dark:bg-gray-800 rounded-xl md:rounded-3xl h-full border-gray-100 dark:border-gray-700 shadow-none",
          "p-1.5 md:p-2.5",
          isSelectionMode && isSelected ? "border-orange-500 ring-4 ring-orange-500/10" : "hover:border-orange-200"
        )}>
          <div className="relative aspect-square overflow-hidden rounded-xl md:rounded-2xl bg-gray-50">
            <img 
              src={tip.image_url || `https://picsum.photos/seed/${tip.category_id}/600/600`} 
              alt={tip.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              data-ai-hint="kitchen tools"
            />
            
            {isSelectionMode && (
              <div className={cn(
                "absolute inset-0 z-20 flex items-start justify-end p-2 transition-all duration-300",
                isSelected ? "bg-orange-50/10" : "bg-black/5"
              )}>
                <div className={cn(
                  "w-6 h-6 md:w-7 md:h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-lg",
                  isSelected ? "bg-orange-500 border-orange-500 scale-110" : "bg-white/80 border-white"
                )}>
                  {isSelected && <Check className="text-white w-3 h-3 md:w-4 md:h-4 stroke-[4px]" />}
                </div>
              </div>
            )}

            {!isSelectionMode && (
              <div className={cn("absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] md:text-xs font-bold text-white shadow-sm flex items-center border border-transparent")}>
                <Tag className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5 text-orange-400" />
                {category.name}
              </div>
            )}
          </div>

          <div className="pt-2 md:pt-4 px-1 pb-1 flex flex-col flex-grow">
            <h3 className="text-[11px] md:text-lg font-bold text-gray-800 dark:text-white line-clamp-2 min-h-[1.75rem] md:min-h-[3rem] leading-tight group-hover:text-orange-600 transition-colors font-body">
              {tip.title}
            </h3>

            <div className="flex items-center justify-between text-[10px] md:text-[11px] font-bold text-gray-400 pt-2 md:pt-3 border-t border-gray-100 dark:border-gray-700 mt-2 md:mt-4 uppercase tracking-normal md:tracking-widest flex-nowrap gap-1">
              <div className="flex items-center shrink-0">
                <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 text-blue-500" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
