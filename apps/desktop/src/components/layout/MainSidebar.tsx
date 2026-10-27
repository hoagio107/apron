import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, Heart, GraduationCap, 
  Lightbulb, PlusCircle, ShoppingCart, Scale, 
  CalendarDays, FileUp, ChefHat, FolderHeart
} from 'lucide-react';
import { Button } from '@/ui';
import { useTranslation } from 'react-i18next';
import { SettingsModal } from '../settings/SettingsModal';
import { JsonImportModal } from '../import/JsonImportModal';
import { SidebarNav, type NavItem } from './sidebar/SidebarNav';
import { SidebarProfile } from './sidebar/SidebarProfile';
import { SIDEBAR_HOVER_DELAY_MS } from '../../constants';

interface MainSidebarProps {
  isPinned?: boolean;
}

export function MainSidebar({ isPinned = false }: MainSidebarProps) {
  const { t } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, SIDEBAR_HOVER_DELAY_MS);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Lắng nghe custom event từ AiAssistModal hoặc các trang khác để mở Settings/Import
  useEffect(() => {
    const settingsHandler = () => setIsSettingsOpen(true);
    const importHandler = () => setIsImportOpen(true);

    window.addEventListener('open-settings', settingsHandler);
    window.addEventListener('open-json-import', importHandler);

    return () => {
      window.removeEventListener('open-settings', settingsHandler);
      window.removeEventListener('open-json-import', importHandler);
    };
  }, []);

  const navItems: NavItem[] = [
    { name: t('nav.home'), icon: Home, path: '/' },
    { name: t('nav.recipes'), icon: ChefHat, path: '/recipes' },
    { name: t('nav.saved'), icon: Heart, path: '/saved' },
    { name: t('nav.shoppingList'), icon: ShoppingCart, path: '/shopping-list' },
    { name: t('nav.courses'), icon: GraduationCap, path: '/courses' },
    { name: t('nav.collections', 'Bộ sưu tập'), icon: FolderHeart, path: '/collections' },
    { name: t('nav.mealPlanner'), icon: CalendarDays, path: '/meal-planner' },
    { name: t('nav.kitchenTips'), icon: Lightbulb, path: '/tips' },
    { name: t('nav.units'), icon: Scale, path: '/units' },
    { 
      name: t('nav.import', 'Nhập dữ liệu'), 
      icon: FileUp, 
      onClick: () => setIsImportOpen(true) 
    },
  ];

  const isExpanded = isPinned || isHovered || isSettingsOpen || isImportOpen;

  return (
    <>
      <aside 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`hidden md:flex flex-col absolute inset-y-0 left-0 bg-content1 text-foreground transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'w-64 z-40 shadow-xl' : 'w-20 z-30 shadow-none'
        }`}
      >
        <nav className={`flex-grow ${isExpanded ? 'px-3' : 'px-0'} pt-4 pb-2 space-y-3 overflow-y-auto custom-scrollbar flex flex-col ${!isExpanded ? 'items-center' : ''}`}>
          <div className={isExpanded ? 'w-full' : 'flex justify-center w-full'}>
            <Button 
              as={Link} 
              to="/recipes/new"
              color="primary" 
              variant="solid"
              isIconOnly={!isExpanded}
              className={`font-bold h-11 rounded-xl overflow-hidden transition-all duration-200 ${
                isExpanded 
                  ? 'w-full justify-start px-3.5 gap-2.5' 
                  : 'w-11 min-w-11 h-11 justify-center p-0 mx-auto'
              }`}
              title={!isExpanded ? t('Add Recipe') : undefined}
            >
              <PlusCircle className="w-5 h-5 flex-shrink-0" />
              {isExpanded && (
                <span className="whitespace-nowrap truncate">{t('Add Recipe')}</span>
              )}
            </Button>
          </div>

          <div className="pt-1 w-full">
            <SidebarNav items={navItems} isExpanded={isExpanded} />
          </div>
        </nav>

        <div className="px-3 w-full">
          <div className="border-t border-divider w-full" />
        </div>

        <div className={isExpanded ? 'p-3' : 'py-3 px-0 flex justify-center'}>
          <SidebarProfile isExpanded={isExpanded} onOpenSettings={() => setIsSettingsOpen(true)} />
        </div>
      </aside>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />

      <JsonImportModal
        isOpen={isImportOpen}
        onOpenChange={setIsImportOpen}
      />
    </>
  );
}
