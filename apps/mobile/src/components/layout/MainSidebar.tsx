import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, Heart, GraduationCap, 
  Lightbulb, PlusCircle, ShoppingCart, Scale, 
  CalendarDays, FileUp, ChefHat,
  PanelLeftClose, PanelLeft
} from 'lucide-react';
import { Button } from '@/ui';
import { useTranslation } from 'react-i18next';
import { SettingsModal } from '../settings/SettingsModal';
import { SidebarNav, type NavItem } from './sidebar/SidebarNav';
import { SidebarProfile } from './sidebar/SidebarProfile';

interface MainSidebarProps {
  isExpanded: boolean;
  onToggle?: () => void;
}

export function MainSidebar({ isExpanded, onToggle }: MainSidebarProps) {
  const { t } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Lắng nghe custom event từ AiAssistModal để mở Settings
  useEffect(() => {
    const handler = () => setIsSettingsOpen(true);
    window.addEventListener('open-settings', handler);
    return () => window.removeEventListener('open-settings', handler);
  }, []);

  const navItems: NavItem[] = [
    { name: t('nav.home'), icon: Home, path: '/' },
    { name: t('nav.recipes'), icon: ChefHat, path: '/recipes' },
    { name: t('nav.saved'), icon: Heart, path: '/saved' },
    { name: t('nav.shoppingList'), icon: ShoppingCart, path: '/shopping-list' },
    { name: t('nav.courses'), icon: GraduationCap, path: '/courses' },
    { name: t('nav.mealPlanner'), icon: CalendarDays, path: '/meal-planner' },
    { name: t('nav.kitchenTips'), icon: Lightbulb, path: '/tips' },
    { name: t('nav.units'), icon: Scale, path: '/units' },
    { name: t('nav.import', 'Nhập dữ liệu'), icon: FileUp, path: '/import' },
  ];

  return (
    <>
      <aside 
        className={`hidden md:flex flex-col absolute inset-y-0 left-0 bg-content1 border-r border-divider text-foreground z-30 transition-[width] duration-300 ease-in-out overflow-hidden shadow-none ${isExpanded ? 'w-64' : 'w-20'}`}
      >
        {/* Top Header Row with Expand/Collapse toggle */}
        <div className={`flex items-center h-12 px-3 pt-2 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
          {isExpanded ? (
            <>
              <span className="font-bold text-xs tracking-wider text-default-400 uppercase px-2">Điều hướng</span>
              {onToggle && (
                <Button 
                  isIconOnly 
                  variant="light" 
                  size="sm" 
                  onPress={onToggle}
                  title="Thu gọn menu"
                  className="text-default-500 hover:text-foreground w-8 h-8 rounded-lg"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </Button>
              )}
            </>
          ) : (
            onToggle && (
              <Button 
                isIconOnly 
                variant="light" 
                size="sm" 
                onPress={onToggle}
                title="Mở rộng menu"
                className="text-default-500 hover:text-foreground w-8 h-8 rounded-lg"
              >
                <PanelLeft className="w-4 h-4" />
              </Button>
            )
          )}
        </div>

        <nav className={`flex-grow ${isExpanded ? 'px-3' : 'px-2'} py-2 space-y-3 overflow-y-auto custom-scrollbar`}>
          <Button 
            as={Link} 
            to="/recipes/new"
            color="primary" 
            variant="solid"
            className={`w-full font-bold h-11 flex items-center rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? 'justify-start px-3.5 gap-2.5' : 'justify-center px-0 gap-0 min-w-0'}`}
            title={!isExpanded ? t('Add Recipe') : undefined}
          >
            <PlusCircle className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <span className="whitespace-nowrap truncate">{t('Add Recipe')}</span>
            )}
          </Button>

          <div className="pt-1">
            <SidebarNav items={navItems} isExpanded={isExpanded} />
          </div>
        </nav>

        <div className="p-3 border-t border-divider">
          <SidebarProfile isExpanded={isExpanded} onOpenSettings={() => setIsSettingsOpen(true)} />
        </div>
      </aside>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
    </>
  );
}
