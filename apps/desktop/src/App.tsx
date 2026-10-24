import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { getStorageProvider, seedMockData } from '@apron/core';
import { Button } from '@/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MainSidebar } from './components/layout/MainSidebar';
import { Titlebar } from './components/layout/Titlebar';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { NewRecipePage } from './pages/recipes/NewRecipePage';
import { RecipeListPage } from './pages/recipes/RecipeListPage';
import { RecipeDetailPage } from './pages/recipes/RecipeDetailPage';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { MealPlannerPage } from './pages/meal-planner/MealPlannerPage';
import { ShoppingListPage } from './pages/shopping-list/ShoppingListPage';
import { SmartFridgePage } from './pages/smart-fridge/SmartFridgePage';
import { UnitsPage } from './pages/units/UnitsPage';
import { IngredientCatalogPage } from './pages/catalog/IngredientCatalogPage';
import { SavedRecipesPage } from './pages/recipes/SavedRecipesPage';
import { TipListPage } from './pages/tips/TipListPage';
import { TipDetailPage } from './pages/tips/TipDetailPage';
import { CoursesPage } from './pages/courses/CoursesPage';
import { CourseFormPage } from './pages/courses/CourseFormPage';
import { CourseDetailPage } from './pages/courses/CourseDetailPage';
import { OnboardingScreen } from './components/onboarding/OnboardingScreen';

import { DashboardPage } from './pages/DashboardPage';

function App() {
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    const initStorage = async () => {
      try {
        const storage = getStorageProvider();
        const success = await storage.initialize();
        if (success) {
          await seedMockData();
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
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <Titlebar />
        
        <div className="flex flex-1 overflow-hidden relative">
          <MainSidebar isExpanded={isSidebarExpanded} />
          
          {/* Toggle Sidebar Button */}
          <button 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className={`hidden md:flex absolute z-40 top-[40px] -translate-y-1/2 -translate-x-1/2 ml-2 items-center justify-center w-5 h-5 bg-content1 border border-divider rounded-full shadow-sm text-default-500 hover:text-primary hover:bg-content2 opacity-0 hover:opacity-100 transition-all duration-300 ${isSidebarExpanded ? 'left-64' : 'left-20'}`}
          >
            {isSidebarExpanded ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          
          {/* Main Content Area */}
          <main className={`flex-1 flex flex-col overflow-hidden bg-background transition-[padding] duration-300 ${isSidebarExpanded ? 'md:pl-64' : 'md:pl-20'}`}>
            <div className="flex-1 overflow-y-auto px-8 pb-8 pt-0 m-2 bg-default-50 rounded-2xl border border-default-200 shadow-sm">
            <ErrorBoundary>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              
              <Route path="/recipes" element={<RecipeListPage />} />
              <Route path="/recipes/new" element={<NewRecipePage />} />
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
              <Route path="/design-system" element={<DesignSystemPage />} />
              
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center h-full">
                  <h2 className="text-2xl font-bold text-gray-400">Trang đang được xây dựng...</h2>
                </div>
              } />
            </Routes>
            </ErrorBoundary>
          </div>
        </main>
        </div>
      </div>
    </Router>
  )
}

export default App;
