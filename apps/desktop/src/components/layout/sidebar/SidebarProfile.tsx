import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@/ui';
import { Settings, MoreVertical, Database, Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProfileProps {
  isExpanded?: boolean;
  onOpenSettings: () => void;
}

export function SidebarProfile({ isExpanded = false, onOpenSettings }: SidebarProfileProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex items-center w-full", isExpanded ? "gap-2 justify-between" : "justify-center")}>
      <div className={cn("flex items-center min-w-0 transition-all duration-300", isExpanded ? "gap-3 justify-start flex-1" : "justify-center")}>
        <div 
          onClick={onOpenSettings}
          title={!isExpanded ? t('Settings & Sync') : undefined}
          className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-primary/10 cursor-pointer hover:bg-primary/20 transition-colors"
        >
          <img src="/logo.svg" alt="Apron Logo" className="w-6 h-6" />
        </div>
        {isExpanded && (
          <div className="flex flex-col min-w-0 overflow-hidden">
            <span className="font-bold text-sm text-foreground truncate whitespace-nowrap">
              {localStorage.getItem('account_name') || 'Apron'}
            </span>
          </div>
        )}
      </div>
      
      {isExpanded && (
        <Dropdown placement="top-end">
          <DropdownTrigger>
            <Button isIconOnly variant="light" size="sm" className="text-default-500 hover:text-foreground w-8 h-8 min-w-8 rounded-lg shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Device Actions" variant="flat">
            <DropdownItem 
              key="settings" 
              startContent={<Settings className="w-4 h-4 text-default-500" />}
              onPress={onOpenSettings}
            >
              {t('Settings & Sync')}
            </DropdownItem>
            <DropdownItem 
              key="import" 
              startContent={<Database className="w-4 h-4 text-default-500" />}
              href="/import"
            >
              {t('Import Data')}
            </DropdownItem>
            <DropdownItem 
              key="export" 
              startContent={<Archive className="w-4 h-4 text-default-500" />}
              href="/export"
            >
              {t('Export Data')}
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      )}
    </div>
  );
}
