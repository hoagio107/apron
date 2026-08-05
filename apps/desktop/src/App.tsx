import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Button } from '@apron/ui';
import { MainSidebar } from './components/layout/MainSidebar';
import { Titlebar } from './components/layout/Titlebar';
import { NewRecipePage } from './pages/recipes/NewRecipePage';
import { DesignSystemPage } from './pages/DesignSystemPage';

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <Titlebar />
        
        <div className="flex flex-1 overflow-hidden relative">
          <MainSidebar />
          
          {/* Main Content Area */}
          <main className="flex-1 flex flex-col md:pl-64 overflow-hidden bg-background">
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
              
              <Route path="/recipes/new" element={<NewRecipePage />} />
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
