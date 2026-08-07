import { User, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@apron/ui';
import { Settings, MoreVertical, Database, Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SidebarProfileProps {
  onOpenSettings: () => void;
}

export function SidebarProfile({ onOpenSettings }: SidebarProfileProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3 w-full">
      <User 
        name={localStorage.getItem('account_name') || 'Apron'}
        avatarProps={{
          src: "/logo.svg",
          className: "bg-transparent"
        }}
        classNames={{
          base: "justify-start flex-grow min-w-0 group-hover/sidebar:gap-3 transition-all duration-300",
          name: "font-bold text-lg text-gray-800 dark:text-white truncate whitespace-nowrap opacity-0 w-0 group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto transition-all duration-300",
        }}
      />
      
      <Dropdown placement="top-end">
        <DropdownTrigger>
          <Button isIconOnly variant="light" size="sm" className="text-gray-500 opacity-0 w-0 pointer-events-none group-hover/sidebar:opacity-100 group-hover/sidebar:w-8 group-hover/sidebar:pointer-events-auto transition-all duration-300">
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
