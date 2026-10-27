import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { getStorageProvider, purgeAllLegacyMockData } from '@apron/core';
import { MainSidebar } from './components/layout/MainSidebar';
import { Titlebar } from './components/layout/Titlebar';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { OnboardingScreen } from './components/onboarding/OnboardingScreen';
import { ImageManager } from './lib/image-manager';

// Lazy-loaded pages for code splitting & faster initial launch
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const RecipeListPage = lazy(() => import('./pages/recipes/RecipeListPage').then(m => ({ default: m.RecipeListPage })));
const NewRecipePage = lazy(() => import('./pages/recipes/NewRecipePage').then(m => ({ default: m.NewRecipePage })));
const RecipeDetailPage = lazy(() => import('./pages/recipes/RecipeDetailPage').then(m => ({ default: m.RecipeDetailPage })));
const SavedRecipesPage = lazy(() => import('./pages/recipes/SavedRecipesPage').then(m => ({ default: m.SavedRecipesPage })));
const MealPlannerPage = lazy(() => import('./pages/meal-planner/MealPlannerPage').then(m => ({ default: m.MealPlannerPage })));
const ShoppingListPage = lazy(() => import('./pages/shopping-list/ShoppingListPage').then(m => ({ default: m.ShoppingListPage })));
const TipListPage = lazy(() => import('./pages/tips/TipListPage').then(m => ({ default: m.TipListPage })));
const TipDetailPage = lazy(() => import('./pages/tips/TipDetailPage').then(m => ({ default: m.TipDetailPage })));
const CoursesPage = lazy(() => import('./pages/courses/CoursesPage').then(m => ({ default: m.CoursesPage })));
const CourseDetailPage = lazy(() => import('./pages/courses/CourseDetailPage').then(m => ({ default: m.CourseDetailPage })));
const CourseFormPage = lazy(() => import('./pages/courses/CourseFormPage').then(m => ({ default: m.CourseFormPage })));
const CollectionsPage = lazy(() => import('./pages/collections/CollectionsPage').then(m => ({ default: m.CollectionsPage })));
const CollectionDetailPage = lazy(() => import('./pages/collections/CollectionDetailPage').then(m => ({ default: m.CollectionDetailPage })));
const UnitsPage = lazy(() => import('./pages/units/UnitsPage').then(m => ({ default: m.UnitsPage })));
const DesignSystemPage = lazy(() => import('./pages/DesignSystemPage').then(m => ({ default: m.DesignSystemPage })));

function PageLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] h-full w-full gap-3 animate-in fade-in duration-200">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-default-400 font-medium">Đang tải trang...</span>
    </div>
  );
}

function App() {
  const [isStorageReady, setIsStorageReady] = useState(false);
  // Sidebar auto expands/collapses on hover by default; user can pin with Ctrl+B
  const [isSidebarPinned, setIsSidebarPinned] = useState<boolean>(() => {
    const saved = localStorage.getItem('apron_desktop_sidebar_pinned');
    return saved === 'true';
  });

  const togglePinSidebar = () => {
    setIsSidebarPinned(prev => {
      const next = !prev;
      localStorage.setItem('apron_desktop_sidebar_pinned', String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        togglePinSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const initStorage = async () => {
      try {
        const storage = getStorageProvider();
        const success = await storage.initialize();
        if (success) {
          await ImageManager.initDirs();
          await purgeAllLegacyMockData();
          setIsStorageReady(true);
        }
      } catch (e) {
        console.error('Failed to init storage', e);
      } finally {
        setIsStorageReady(true);
      }
    };
    initStorage();
  }, []);

  const handleOnboardingComplete = () => {
    setIsStorageReady(true);
  };

  if (!isStorageReady) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <Router>
      <div className="flex flex-col h-screen bg-content1 text-foreground overflow-hidden">
        <Titlebar />
        
        <div className="flex flex-1 overflow-hidden relative bg-content1">
          <MainSidebar isPinned={isSidebarPinned} />
          
          {/* Main Content Area */}
          <main className={`flex-1 flex flex-col overflow-hidden bg-content1 transition-[padding] duration-300 ${isSidebarPinned ? 'md:pl-64' : 'md:pl-20'}`}>
            <div className="flex-1 overflow-y-auto px-8 pb-8 pt-0 m-2 bg-background rounded-2xl border border-divider">
              <ErrorBoundary>
                <Suspense fallback={<PageLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    
                    <Route path="/recipes" element={<RecipeListPage />} />
                    <Route path="/recipes/new" element={<NewRecipePage />} />
                    <Route path="/recipes/:id" element={<RecipeDetailPage />} />
                    <Route path="/saved" element={<SavedRecipesPage />} />
                    <Route path="/meal-planner" element={<MealPlannerPage />} />
                    <Route path="/shopping-list" element={<ShoppingListPage />} />
                    <Route path="/tips" element={<TipListPage />} />
                    <Route path="/tips/:id" element={<TipDetailPage />} />
                    <Route path="/courses" element={<CoursesPage />} />
                    <Route path="/courses/:id" element={<CourseDetailPage />} />
                    <Route path="/courses/add" element={<CourseFormPage />} />
                    <Route path="/courses/edit/:id" element={<CourseFormPage />} />
                    <Route path="/collections" element={<CollectionsPage />} />
                    <Route path="/collections/:id" element={<CollectionDetailPage />} />
                    <Route path="/units" element={<UnitsPage />} />
                    <Route path="/design-system" element={<DesignSystemPage />} />
                    
                    <Route path="*" element={
                      <div className="flex flex-col items-center justify-center h-full">
                        <h2 className="app-page-title text-default-400">Trang đang được xây dựng...</h2>
                      </div>
                    } />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
