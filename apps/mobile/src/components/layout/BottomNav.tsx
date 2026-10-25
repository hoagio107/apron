import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, ChefHat, Plus, Lightbulb, Menu
} from 'lucide-react';
import { useState } from 'react';
import { BottomNavMore } from './BottomNavMore';

export function BottomNav() {
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <>
      {/* 
        Container for the nav bar. 
        We use an SVG in the center to create a perfect rounded cutout (shoulders) and drop-shadow on the parent.
      */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-[calc(64px+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] pointer-events-none transition-transform duration-300 [.multi-select-open_&]:translate-y-full">
        
        {/* Background with cutout - single continuous SVG for perfection */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1920px] h-[300px] pointer-events-none filter drop-shadow-[0_-4px_12px_rgba(0,0,0,0.06)] dark:drop-shadow-[0_-4px_16px_rgba(0,0,0,0.4)] text-content1 fill-current">
          <svg width="1920" height="300" viewBox="0 0 1920 300" className="w-full h-full block">
            <path d="M0,0 L915,0 C930,0 930,40 960,40 C990,40 990,0 1005,0 L1920,0 L1920,300 L0,300 Z" />
          </svg>
        </div>

        {/* Nav Items */}
        <div className="relative h-[64px] flex items-center px-2 pointer-events-auto">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-1 items-center justify-center h-full transition-colors ${
                isActive ? 'text-primary' : 'text-default-400 hover:text-default-600'
              }`
            }
          >
            {({ isActive }) => (
              <Home className="w-6 h-6 transition-all duration-200" fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 2 : 1.5} />
            )}
          </NavLink>

          <NavLink
            to="/recipes"
            className={({ isActive }) =>
              `flex flex-1 items-center justify-center h-full transition-colors ${
                isActive ? 'text-primary' : 'text-default-400 hover:text-default-600'
              }`
            }
          >
            {({ isActive }) => (
              <ChefHat className="w-6 h-6 transition-all duration-200" fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 2 : 1.5} />
            )}
          </NavLink>

          {/* Spacer for center button */}
          <div className="w-[88px]" />

          <NavLink
            to="/tips"
            className={({ isActive }) =>
              `flex flex-1 items-center justify-center h-full transition-colors ${
                isActive ? 'text-primary' : 'text-default-400 hover:text-default-600'
              }`
            }
          >
            {({ isActive }) => (
              <Lightbulb className="w-6 h-6 transition-all duration-200" fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 2 : 1.5} />
            )}
          </NavLink>

          <button
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-1 items-center justify-center h-full transition-colors ${
              isMoreOpen ? 'text-primary' : 'text-default-400 hover:text-default-600'
            }`}
          >
            <Menu className="w-6 h-6 transition-all duration-200" fill={isMoreOpen ? "currentColor" : "none"} strokeWidth={isMoreOpen ? 2 : 1.5} />
          </button>
        </div>
      </nav>

      {/* Center Floating Button */}
      <div className="fixed bottom-[calc(32px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-50 transition-transform duration-300 [.multi-select-open_&]:translate-y-[200%]">
        <button 
          onClick={() => navigate('/recipes/new')}
          className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      <BottomNavMore isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </>
  );
}
