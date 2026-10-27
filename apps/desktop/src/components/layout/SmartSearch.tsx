import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function SmartSearch() {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  // Generate a simple breadcrumb from location
  const pathnames = location.pathname.split('/').filter((x) => x);
  const breadcrumb = pathnames.length === 0 
    ? 'Home' 
    : pathnames.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' > ');

  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  return (
    <div 
      className={`
        relative flex items-center h-8 bg-default-100/80 rounded-lg transition-all duration-300 ease-in-out pointer-events-auto cursor-pointer border border-transparent hover:border-divider
        ${isSearchActive ? 'w-full max-w-md ring-2 ring-primary/20 bg-default-100 border-primary/30' : 'w-64 hover:bg-default-200/70'}
      `}
      onClick={() => {
        if (!isSearchActive) setIsSearchActive(true);
      }}
    >
      {/* Breadcrumb Mode */}
      <div 
        className={`
          absolute inset-0 flex items-center justify-center gap-2 px-3 transition-opacity duration-300
          ${isSearchActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
      >
        <span className="text-xs font-medium text-default-600 truncate">{breadcrumb}</span>
        <Search className="w-3.5 h-3.5 text-default-400 absolute right-2.5" />
      </div>

      {/* Search Mode */}
      <div 
        className={`
          absolute inset-0 flex items-center px-2.5 transition-opacity duration-300
          ${isSearchActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        <Search className="w-3.5 h-3.5 text-default-400 flex-shrink-0" />
        <input 
          ref={searchInputRef}
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Tìm kiếm..."
          className="flex-1 bg-transparent border-none outline-none text-xs px-2 text-foreground placeholder:text-default-400"
          onBlur={() => {
            if (!searchValue) setIsSearchActive(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSearchValue('');
              setIsSearchActive(false);
            }
          }}
        />
        {searchValue && (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSearchValue('');
              searchInputRef.current?.focus();
            }}
            className="p-0.5 hover:bg-default-200 rounded text-default-400 hover:text-foreground outline-none"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
