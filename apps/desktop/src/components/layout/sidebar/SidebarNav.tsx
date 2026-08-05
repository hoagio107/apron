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
}

export function SidebarNav({ items }: SidebarNavProps) {
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
              className={cn(
                "flex items-center py-3 px-4 rounded-xl transition-all group",
                isActive 
                  ? "bg-primary-50 text-primary font-bold dark:bg-primary-900/30" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              )}
            >
              <item.icon 
                className={cn(
                  "h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform", 
                  isActive ? "text-primary" : "text-gray-400"
                )} 
              />
              <span className="ml-3">{item.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
