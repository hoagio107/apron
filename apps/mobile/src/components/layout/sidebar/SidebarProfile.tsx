import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@/ui';
import { Settings, MoreVertical, Database, Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SidebarProfileProps {
  onOpenSettings: () => void;
}

export function SidebarProfile({ onOpenSettings }: SidebarProfileProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-0 group-[.is-expanded]/sidebar:gap-3 w-full">
      <div className="flex items-center justify-center group-[.is-expanded]/sidebar:justify-start flex-grow min-w-0 gap-0 group-[.is-expanded]/sidebar:gap-3 transition-all duration-300">
        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-primary/10">
          <img src="/logo.svg" alt="Apron Logo" className="w-8 h-8" />
        </div>
        <div className="flex flex-col min-w-0 overflow-hidden opacity-0 w-0 group-[.is-expanded]/sidebar:opacity-100 group-[.is-expanded]/sidebar:w-auto transition-all duration-300">
          <span className="font-bold text-lg text-gray-800 dark:text-white truncate whitespace-nowrap">
            {localStorage.getItem('account_name') || 'Apron'}
          </span>
        </div>
      </div>
      
      <Dropdown placement="top-end">
        <DropdownTrigger>
          <Button isIconOnly variant="light" size="md" className="text-gray-500 min-w-0 px-0 opacity-0 w-0 pointer-events-none group-[.is-expanded]/sidebar:opacity-100 group-[.is-expanded]/sidebar:w-8 group-[.is-expanded]/sidebar:pointer-events-auto transition-all duration-300">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Device Actions" variant="flat">
          <DropdownItem 
            key="settings" 
            startContent={<Settings className="w-4 h-4 text-gray-500" />}
            onPress={onOpenSettings}
          >
            {t('Settings & Sync')}
          </DropdownItem>
          <DropdownItem 
            key="switch_account" 
            startContent={<Database className="w-4 h-4 text-gray-500" />}
            onPress={() => {
              // Xóa cấu hình hiện tại và reload để về màn hình Onboarding
              localStorage.removeItem('byos_base_dir');
              window.location.reload();
            }}
          >
            Đổi thư mục / Tài khoản
          </DropdownItem>
          <DropdownItem 
            key="import" 
            startContent={<Database className="w-4 h-4 text-gray-500" />}
            href="/import"
          >
            {t('Import Data')}
          </DropdownItem>
          <DropdownItem 
            key="export" 
            startContent={<Archive className="w-4 h-4 text-gray-500" />}
            href="/export"
          >
            {t('Export Data')}
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
