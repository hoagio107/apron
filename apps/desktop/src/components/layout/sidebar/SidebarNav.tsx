import { Link, useLocation } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { LucideIcon } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface NavItem {
  name: string;
  icon: LucideIcon;
  path?: string;
  onClick?: () => void;
}

interface SidebarNavProps {
  items: NavItem[];
  isExpanded?: boolean;
}

export function SidebarNav({ items, isExpanded = false }: SidebarNavProps) {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <ul className="space-y-1 p-0 m-0 list-none w-full">
      {items.map((item) => {
        const isActive = item.path ? pathname === item.path : false;
        const sharedClasses = cn(
          "flex items-center h-11 rounded-xl transition-all duration-200 overflow-hidden text-left border-none bg-transparent cursor-pointer",
          isExpanded 
            ? "w-full justify-start px-3.5 gap-3" 
            : "w-11 min-w-11 justify-center px-0 mx-auto",
          isActive 
            ? "bg-primary/10 text-primary font-bold" 
            : "text-default-600 hover:bg-default-100 hover:text-foreground"
        );

        const innerContent = (
          <>
            <item.icon 
              className={cn(
                "h-5 w-5 flex-shrink-0 transition-transform", 
                isActive ? "text-primary" : "text-default-400 group-hover:scale-105"
              )} 
            />
            {isExpanded && (
              <span className="whitespace-nowrap text-sm font-semibold truncate animate-in fade-in duration-200">
                {item.name}
              </span>
            )}
          </>
        );

        return (
          <li key={item.name} className="flex justify-center w-full">
            {item.onClick ? (
              <button 
                type="button"
                onClick={item.onClick}
                title={!isExpanded ? item.name : undefined}
                className={sharedClasses}
              >
                {innerContent}
              </button>
            ) : (
              <Link 
                to={item.path || '#'} 
                title={!isExpanded ? item.name : undefined}
                className={sharedClasses}
              >
                {innerContent}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
