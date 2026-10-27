import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { getStorageProvider, purgeAllLegacyMockData } from '@apron/core';
import { Capacitor } from '@capacitor/core';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { BottomNav } from './components/layout/BottomNav';
import { useKeyboard } from './hooks/useKeyboard';
import { SwipeBackHandler } from './components/layout/SwipeBackHandler';
import { ImageManager } from './lib/image-manager';

// Lazy-loaded pages for mobile bundle optimization & faster startup
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
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const JsonImportPage = lazy(() => import('./pages/import/JsonImportPage').then(m => ({ default: m.JsonImportPage })));

function PageLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] h-full w-full gap-3 animate-in fade-in duration-200">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-default-400 font-medium">Đang tải...</span>
    </div>
  );
}

function AppLayout() {
  useKeyboard(); // Kích hoạt lắng nghe bàn phím toàn cục
  const location = useLocation();
  
  // Hide BottomNav on forms and detail sub-pages
  const isRecipeDetailPageOrForm = location.pathname.startsWith('/recipes/') && location.pathname !== '/recipes' && location.pathname !== '/recipes/';
  const isCourseDetailPageOrForm = location.pathname.startsWith('/courses/') && location.pathname !== '/courses' && location.pathname !== '/courses/';
  const isTipDetailPage = location.pathname.startsWith('/tips/') && location.pathname !== '/tips' && location.pathname !== '/tips/';
  const isCollectionDetailPage = location.pathname.startsWith('/collections/') && location.pathname !== '/collections' && location.pathname !== '/collections/';

  const hideNav = isRecipeDetailPageOrForm || isCourseDetailPageOrForm || isTipDetailPage || isCollectionDetailPage || location.pathname === '/import';

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-background text-foreground overflow-hidden pt-safe">
      {/* Cử chỉ vuốt để quay lại toàn cục */}
      <SwipeBackHandler />

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto no-scrollbar ${hideNav ? 'pb-safe' : 'pb-[calc(76px+var(--sab,0px))]'}`}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/recipes" element={<RecipeListPage />} />
              <Route path="/recipes/new" element={<NewRecipePage />} />
              <Route path="/recipes/:id/edit" element={<NewRecipePage />} />
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
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/import" element={<JsonImportPage />} />
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center h-full">
                  <h2 className="text-2xl font-bold text-default-400">Trang đang được xây dựng...</h2>
                </div>
              } />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Bottom Nav */}
      {!hideNav && (
        <div className="bottom-nav-container">
          <BottomNav />
        </div>
      )}
    </div>
  );
}

function App() {
  const [isStorageReady, setIsStorageReady] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      document.documentElement.classList.add('is-native');
      document.body.classList.add('is-native');
    }

    const initStorage = async () => {
      try {
        const storage = getStorageProvider();
        await storage.initialize();
        await ImageManager.initDirs();
        // Quét sạch triệt để toàn bộ dữ liệu mẫu cũ từng sinh ra trên máy
        await purgeAllLegacyMockData();
      } catch (e) {
        console.error('Failed to init storage', e);
      } finally {
        setIsStorageReady(true);
      }
    };
    initStorage();
  }, []);

  if (!isStorageReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-default-500 font-medium">Đang tải dữ liệu Apron...</p>
      </div>
    );
  }

  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
