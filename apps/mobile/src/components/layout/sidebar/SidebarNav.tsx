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
  path: string;
}

interface SidebarNavProps {
  items: NavItem[];
  isExpanded?: boolean;
}

export function SidebarNav({ items, isExpanded = false }: SidebarNavProps) {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const isActive = pathname === item.path;
        return (
          <li key={item.name}>
            <Link 
              to={item.path} 
              title={!isExpanded ? item.name : undefined}
              className={cn(
                "flex items-center h-11 rounded-xl transition-all duration-200 overflow-hidden",
                isExpanded ? "justify-start pl-3.5 pr-0 gap-3" : "justify-center px-0 gap-0",
                isActive 
                  ? "bg-primary/10 text-primary font-bold" 
                  : "text-default-600 hover:bg-default-100 hover:text-foreground"
              )}
            >
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
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
