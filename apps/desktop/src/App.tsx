import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { getStorageProvider } from '@apron/core';
import { Button } from '@apron/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MainSidebar } from './components/layout/MainSidebar';
import { Titlebar } from './components/layout/Titlebar';
import { NewRecipePage } from './pages/recipes/NewRecipePage';
import { RecipeListPage } from './pages/recipes/RecipeListPage';
import { RecipeDetailPage } from './pages/recipes/RecipeDetailPage';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { MealPlannerPage } from './pages/meal-planner/MealPlannerPage';
import { OnboardingScreen } from './components/onboarding/OnboardingScreen';

function App() {
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    const initStorage = async () => {
      try {
        const storage = getStorageProvider();
        const success = await storage.initialize();
        if (success) {
          setIsStorageReady(true);
        }
      } catch (e) {
        console.error('Failed to init storage', e);
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
            className={`hidden md:flex absolute z-40 top-[40px] -translate-y-1/2 -translate-x-1/2 ml-2 items-center justify-center w-8 h-8 bg-white dark:bg-gray-800 border-[1px] border-gray-200 dark:border-gray-700 rounded-full shadow-sm text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-700 opacity-0 hover:opacity-100 transition-all duration-300 ${isSidebarExpanded ? 'left-64' : 'left-20'}`}
          >
            {isSidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {/* Main Content Area */}
          <main className={`flex-1 flex flex-col overflow-hidden bg-background transition-[padding] duration-300 ${isSidebarExpanded ? 'md:pl-64' : 'md:pl-20'}`}>
            <div className="flex-1 overflow-y-auto p-8 m-2 bg-default-50 rounded-2xl border border-default-200 shadow-sm">
            <Routes>
              <Route path="/" element={
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-4xl font-bold mb-8 text-primary">Trang chủ Cookbook</h1>
                  <p className="mb-4">Sidebar đã được tích hợp thành công!</p>
                  <Button color="primary" variant="solid">
                    Test Button
                  </Button>
                </div>
              } />
              
              <Route path="/recipes" element={<RecipeListPage />} />
              <Route path="/recipes/new" element={<NewRecipePage />} />
              <Route path="/recipes/:id" element={<RecipeDetailPage />} />
              <Route path="/meal-planner" element={<MealPlannerPage />} />
              <Route path="/design-system" element={<DesignSystemPage />} />
              
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center h-full">
                  <h2 className="text-2xl font-bold text-gray-400">Trang đang được xây dựng...</h2>
                </div>
              } />
            </Routes>
          </div>
        </main>
        </div>
      </div>
    </Router>
  )
}

export default App;
