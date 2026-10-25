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
                "flex items-center justify-center group-[.is-expanded]/sidebar:justify-start gap-0 group-[.is-expanded]/sidebar:gap-3 h-12 px-0 group-[.is-expanded]/sidebar:px-4 rounded-xl transition-all group overflow-hidden",
                isActive 
                  ? "bg-primary/10 dark:bg-primary/20 text-primary font-bold" 
                  : "text-default-600 dark:text-default-400 hover:bg-default-100/50 dark:hover:bg-default-50/10"
              )}
            >
              <item.icon 
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform", 
                  isActive ? "text-primary" : "text-gray-400 group-hover:scale-110 group-[.is-expanded]/sidebar:scale-100"
                )} 
              />
              <span className="whitespace-nowrap opacity-0 group-[.is-expanded]/sidebar:opacity-100 w-0 group-[.is-expanded]/sidebar:w-auto transition-all duration-300 pointer-events-none group-[.is-expanded]/sidebar:pointer-events-auto">
                {item.name}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
