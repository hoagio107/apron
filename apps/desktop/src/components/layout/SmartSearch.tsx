import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Utensils, Lightbulb, GraduationCap, Clock, Flame, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRecipeStore, useTipStore, useCourseStore } from '@apron/core';
import { ImageManager } from '../../lib/image-manager';
import { useTranslation } from 'react-i18next';

export function SmartSearch() {
  const { t } = useTranslation();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { recipes, fetchRecipes } = useRecipeStore();
  const { tips, fetchTips } = useTipStore();
  const { courses, fetchCourses } = useCourseStore();

  useEffect(() => {
    if (isSearchActive) {
      if (recipes.length === 0) fetchRecipes();
      if (tips.length === 0) fetchTips();
      if (courses.length === 0) fetchCourses();
    }
  }, [isSearchActive, recipes.length, tips.length, courses.length, fetchRecipes, fetchTips, fetchCourses]);

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

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        if (!searchValue) {
          setIsSearchActive(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchValue]);

  // Filter items
  const query = searchValue.trim().toLowerCase();

  const filteredRecipes = useMemo(() => {
    if (!query) return [];
    return recipes.filter(r => {
      const matchTitle = r.title.toLowerCase().includes(query);
      const matchTags = r.tags?.some(tag => tag.toLowerCase().includes(query));
      const matchIngs = r.ingredients?.some(ing => ing.name.toLowerCase().includes(query));
      return matchTitle || matchTags || matchIngs;
    }).slice(0, 5);
  }, [recipes, query]);

  const filteredTips = useMemo(() => {
    if (!query) return [];
    return tips.filter(tip => {
      const matchTitle = tip.title.toLowerCase().includes(query);
      const matchContent = tip.content.toLowerCase().includes(query);
      return matchTitle || matchContent;
    }).slice(0, 3);
  }, [tips, query]);

  const filteredCourses = useMemo(() => {
    if (!query) return [];
    return courses.filter(course => {
      const matchTitle = course.title.toLowerCase().includes(query);
      const matchDesc = course.description?.toLowerCase().includes(query);
      return matchTitle || matchDesc;
    }).slice(0, 3);
  }, [courses, query]);

  // Flatten items for keyboard navigation
  const allResults = useMemo(() => {
    const list: Array<{ type: 'recipe' | 'tip' | 'course'; id: string; title: string }> = [];
    filteredRecipes.forEach(r => list.push({ type: 'recipe', id: r.id!, title: r.title }));
    filteredTips.forEach(t => list.push({ type: 'tip', id: t.id!, title: t.title }));
    filteredCourses.forEach(c => list.push({ type: 'course', id: c.id!, title: c.title }));
    return list;
  }, [filteredRecipes, filteredTips, filteredCourses]);

  const totalResultsCount = allResults.length;

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelectItem = (item: { type: 'recipe' | 'tip' | 'course'; id: string }) => {
    if (item.type === 'recipe') {
      navigate(`/recipes/${item.id}`);
    } else if (item.type === 'tip') {
      navigate(`/tips/${item.id}`);
    } else if (item.type === 'course') {
      navigate(`/courses/${item.id}`);
    }
    setSearchValue('');
    setIsSearchActive(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchValue('');
      setIsSearchActive(false);
      return;
    }

    if (allResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % allResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + allResults.length) % allResults.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allResults[selectedIndex]) {
          handleSelectItem(allResults[selectedIndex]);
        }
      }
    }
  };

  const showDropdown = isSearchActive && query.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className={`
          relative flex items-center h-8 bg-default-100/80 rounded-lg transition-all duration-300 ease-in-out pointer-events-auto cursor-pointer border border-transparent hover:border-divider
          ${isSearchActive ? 'w-80 md:w-96 ring-2 ring-primary/20 bg-default-100 border-primary/30' : 'w-64 hover:bg-default-200/70'}
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
            placeholder={t('common.actions.search') || 'Tìm công thức, mẹo, khoá học...'}
            className="flex-1 bg-transparent border-none outline-none text-xs px-2 text-foreground placeholder:text-default-400"
            onKeyDown={handleKeyDown}
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

      {/* Floating Search Results Dropdown */}
      {showDropdown && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[460px] max-w-[92vw] bg-content1/95 backdrop-blur-xl border border-divider/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-divider/60 text-xs font-medium text-default-500 bg-default-50/50">
            <span>{t('common.status.total') || 'Kết quả tìm kiếm'}: {totalResultsCount}</span>
            <span className="text-[10px] text-default-400">Esc để đóng</span>
          </div>

          <div className="overflow-y-auto max-h-[380px] p-2 divide-y divide-divider/40">
            {totalResultsCount === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                <Search className="w-8 h-8 text-default-300" />
                <p className="text-xs text-default-500 font-medium">
                  Không tìm thấy kết quả nào phù hợp với &quot;{searchValue}&quot;
                </p>
              </div>
            ) : (
              <>
                {/* Recipes section */}
                {filteredRecipes.length > 0 && (
                  <div className="py-1.5 first:pt-0">
                    <div className="px-2 py-1 text-[11px] font-bold text-default-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-primary" />
                      <span>{t('recipes.title') || 'Công thức'} ({filteredRecipes.length})</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {filteredRecipes.map((r) => {
                        const itemIdx = allResults.findIndex(x => x.type === 'recipe' && x.id === r.id);
                        const isHighlighted = itemIdx === selectedIndex;
                        return (
                          <div
                            key={r.id}
                            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                              isHighlighted ? 'bg-primary/10 text-primary' : 'hover:bg-default-100 text-foreground'
                            }`}
                            onClick={() => handleSelectItem({ type: 'recipe', id: r.id! })}
                            onMouseEnter={() => setSelectedIndex(itemIdx)}
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-default-100 shrink-0 border border-divider/40">
                              {r.image_url ? (
                                <img src={ImageManager.getAssetUrl(r.image_url)} alt={r.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-default-400">
                                  <Utensils className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col">
                              <span className="text-xs font-semibold truncate leading-tight">{r.title}</span>
                              <div className="flex items-center gap-2 text-[10px] text-default-400 mt-0.5">
                                {(r.prep_time || r.cook_time) && (
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" />
                                    {(r.prep_time || 0) + (r.cook_time || 0)}m
                                  </span>
                                )}
                                {r.calories && (
                                  <span className="flex items-center gap-0.5">
                                    <Flame className="w-3 h-3 text-danger" />
                                    {r.calories} kcal
                                  </span>
                                )}
                                {r.difficulty && <span>• {r.difficulty}</span>}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-default-400 shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tips section */}
                {filteredTips.length > 0 && (
                  <div className="py-1.5">
                    <div className="px-2 py-1 text-[11px] font-bold text-default-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-warning" />
                      <span>{t('tips.title') || 'Mẹo nấu ăn'} ({filteredTips.length})</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {filteredTips.map((tip) => {
                        const itemIdx = allResults.findIndex(x => x.type === 'tip' && x.id === tip.id);
                        const isHighlighted = itemIdx === selectedIndex;
                        return (
                          <div
                            key={tip.id}
                            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                              isHighlighted ? 'bg-warning/10 text-warning-600 dark:text-warning-400' : 'hover:bg-default-100 text-foreground'
                            }`}
                            onClick={() => handleSelectItem({ type: 'tip', id: tip.id! })}
                            onMouseEnter={() => setSelectedIndex(itemIdx)}
                          >
                            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0 text-warning">
                              <Lightbulb className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col">
                              <span className="text-xs font-semibold truncate leading-tight">{tip.title}</span>
                              <span className="text-[10px] text-default-400 line-clamp-1 mt-0.5">
                                {tip.content.replace(/<[^>]*>?/gm, '').trim()}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-default-400 shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Courses section */}
                {filteredCourses.length > 0 && (
                  <div className="py-1.5 last:pb-0">
                    <div className="px-2 py-1 text-[11px] font-bold text-default-400 uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-secondary" />
                      <span>{t('courses.title') || 'Khoá học'} ({filteredCourses.length})</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {filteredCourses.map((c) => {
                        const itemIdx = allResults.findIndex(x => x.type === 'course' && x.id === c.id);
                        const isHighlighted = itemIdx === selectedIndex;
                        return (
                          <div
                            key={c.id}
                            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                              isHighlighted ? 'bg-secondary/10 text-secondary' : 'hover:bg-default-100 text-foreground'
                            }`}
                            onClick={() => handleSelectItem({ type: 'course', id: c.id! })}
                            onMouseEnter={() => setSelectedIndex(itemIdx)}
                          >
                            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 text-secondary">
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col">
                              <span className="text-xs font-semibold truncate leading-tight">{c.title}</span>
                              <span className="text-[10px] text-default-400 line-clamp-1 mt-0.5">
                                {c.description || (c.modules ? `${c.modules.length} bài học` : '')}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-default-400 shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="px-4 py-2 bg-default-50/80 border-t border-divider/60 flex items-center justify-between text-[11px] text-default-400">
            <span>Dùng phím <kbd className="px-1.5 py-0.5 bg-content1 rounded border border-divider text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 bg-content1 rounded border border-divider text-[10px]">↓</kbd> để di chuyển, <kbd className="px-1.5 py-0.5 bg-content1 rounded border border-divider text-[10px]">Enter</kbd> để mở</span>
          </div>
        </div>
      )}
    </div>
  );
}
