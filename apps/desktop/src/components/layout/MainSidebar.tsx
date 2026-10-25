import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, Heart, GraduationCap, 
  Lightbulb, PlusCircle, ShoppingCart, Scale, 
  Refrigerator, CalendarDays, Palette, ChefHat, NotebookTabs
} from 'lucide-react';
import { Button } from '@/ui';
import { useTranslation } from 'react-i18next';
import { SettingsModal } from '../settings/SettingsModal';
import { SidebarNav, type NavItem } from './sidebar/SidebarNav';
import { SidebarProfile } from './sidebar/SidebarProfile';

interface MainSidebarProps {
  isExpanded: boolean;
}

export function MainSidebar({ isExpanded }: MainSidebarProps) {
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
    { name: t('nav.smartFridge'), icon: Refrigerator, path: '/smart-fridge' },
    { name: t('recipes.detail.ingredients'), icon: NotebookTabs, path: '/catalog' },
    { name: t('nav.mealPlanner'), icon: CalendarDays, path: '/meal-planner' },
    { name: t('nav.kitchenTips'), icon: Lightbulb, path: '/tips' },
    { name: t('nav.units'), icon: Scale, path: '/units' },
    { name: 'Design System', icon: Palette, path: '/design-system' },
  ];

  return (
    <>
      <aside className={`hidden md:flex flex-col absolute inset-y-0 left-0 bg-content1 border-r border-divider text-foreground z-30 transition-[width] duration-300 ease-in-out overflow-hidden shadow-none group/sidebar ${isExpanded ? 'w-64 is-expanded' : 'w-20'}`}>
        <nav className="flex-grow pl-4 pr-2 py-4 pt-4 group-[.is-expanded]/sidebar:pr-4 space-y-4 overflow-y-auto custom-scrollbar">
          <Button 
            as={Link} 
            to="/recipes/new"
            color="primary" 
            variant="solid"
            className="w-full font-bold min-w-0 px-0 group-[.is-expanded]/sidebar:px-4 h-12 flex items-center justify-center group-[.is-expanded]/sidebar:justify-start gap-0 group-[.is-expanded]/sidebar:gap-2 rounded-xl overflow-hidden transition-all duration-300"
          >
            <PlusCircle className="w-5 h-5 flex-shrink-0" />
            <span className="whitespace-nowrap opacity-0 group-[.is-expanded]/sidebar:opacity-100 w-0 group-[.is-expanded]/sidebar:w-auto transition-all duration-300">{t('Add Recipe')}</span>
          </Button>

          <div className="pt-2">
            <SidebarNav items={navItems} />
          </div>
        </nav>

        <div className="ml-4 mr-2 group-[.is-expanded]/sidebar:mr-4 border-t border-gray-200 dark:border-gray-700 py-4">
          <SidebarProfile onOpenSettings={() => setIsSettingsOpen(true)} />
        </div>
      </aside>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
    </>
  );
}
