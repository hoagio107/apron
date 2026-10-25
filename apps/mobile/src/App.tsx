import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { getStorageProvider } from '@apron/core';
import { seedMockData } from './lib/seedMockData';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { BottomNav } from './components/layout/BottomNav';
import { NewRecipePage } from './pages/recipes/NewRecipePage';
import { RecipeListPage } from './pages/recipes/RecipeListPage';
import { RecipeDetailPage } from './pages/recipes/RecipeDetailPage';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { MealPlannerPage } from './pages/meal-planner/MealPlannerPage';
import { ShoppingListPage } from './pages/shopping-list/ShoppingListPage';
import { SmartFridgePage } from './pages/smart-fridge/SmartFridgePage';
import { UnitsPage } from './pages/units/UnitsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { IngredientCatalogPage } from './pages/catalog/IngredientCatalogPage';
import { SavedRecipesPage } from './pages/recipes/SavedRecipesPage';
import { TipListPage } from './pages/tips/TipListPage';
import { TipDetailPage } from './pages/tips/TipDetailPage';
import { CoursesPage } from './pages/courses/CoursesPage';
import { CourseFormPage } from './pages/courses/CourseFormPage';
import { CourseDetailPage } from './pages/courses/CourseDetailPage';
import { OnboardingScreen } from './components/onboarding/OnboardingScreen';
import { DashboardPage } from './pages/DashboardPage';
import { useKeyboard } from './hooks/useKeyboard';

function AppLayout() {
  useKeyboard(); // Kích hoạt lắng nghe bàn phím toàn cục
  const location = useLocation();
  
  // Hide BottomNav on forms and detail sub-pages
  const isRecipeDetailPageOrForm = location.pathname.startsWith('/recipes/') && location.pathname !== '/recipes' && location.pathname !== '/recipes/';
  const isCourseDetailPageOrForm = location.pathname.startsWith('/courses/') && location.pathname !== '/courses' && location.pathname !== '/courses/';
  const isTipDetailPage = location.pathname.startsWith('/tips/') && location.pathname !== '/tips' && location.pathname !== '/tips/';

  const hideNav = isRecipeDetailPageOrForm || isCourseDetailPageOrForm || isTipDetailPage;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto no-scrollbar ${hideNav ? 'pb-0' : 'pb-16'}`}>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/recipes" element={<RecipeListPage />} />
            <Route path="/recipes/new" element={<NewRecipePage />} />
            <Route path="/recipes/:id/edit" element={<NewRecipePage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/saved" element={<SavedRecipesPage />} />
            <Route path="/meal-planner" element={<MealPlannerPage />} />
            <Route path="/shopping-list" element={<ShoppingListPage />} />
            <Route path="/smart-fridge" element={<SmartFridgePage />} />
            <Route path="/catalog" element={<IngredientCatalogPage />} />
            <Route path="/tips" element={<TipListPage />} />
            <Route path="/tips/:id" element={<TipDetailPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/courses/add" element={<CourseFormPage />} />
            <Route path="/courses/edit/:id" element={<CourseFormPage />} />
            <Route path="/units" element={<UnitsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/design-system" element={<DesignSystemPage />} />
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center h-full">
                <h2 className="text-2xl font-bold text-gray-400">Trang đang được xây dựng...</h2>
              </div>
            } />
          </Routes>
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
    const initStorage = async () => {
      try {
        const storage = getStorageProvider();
        await storage.initialize();
        await seedMockData();
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
