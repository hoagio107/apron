import { WindowControls } from './WindowControls';
import { SmartSearch } from './SmartSearch';

export function Titlebar() {
  return (
    <div 
      data-tauri-drag-region
      className="h-12 bg-white dark:bg-gray-800 flex items-center justify-between px-4 select-none z-50 flex-shrink-0"
    >
      {/* Left: Window Controls */}
      <div className="flex items-center gap-2 w-1/3 z-10 pointer-events-auto" data-tauri-drag-region>
        <WindowControls />
      </div>

      {/* Center: Smart Search & Breadcrumb */}
      <div className="flex-1 flex justify-center items-center pointer-events-none z-10" data-tauri-drag-region>
        <SmartSearch />
      </div>

      {/* Right: Empty placeholder to balance flex */}
      <div className="w-1/3 flex justify-end z-10 pointer-events-none" data-tauri-drag-region>
      </div>
    </div>
  );
}
