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
        name="Apron"
        avatarProps={{
          src: "/logo.svg",
          className: "bg-transparent"
        }}
        classNames={{
          base: "justify-start flex-grow min-w-0 gap-3",
          name: "font-bold text-lg text-gray-800 dark:text-white truncate",
        }}
      />
      
      <Dropdown placement="top-end">
        <DropdownTrigger>
          <Button isIconOnly variant="light" size="sm" className="text-gray-500">
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
