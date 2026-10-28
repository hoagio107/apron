import { useState, useEffect, useMemo, useRef } from 'react';

/**
 * Shared container-width responsive grid column calculator for Desktop card grids
 * (Recipes, Saved Recipes, Kitchen Tips, Collections) so all card grids maintain
 * the exact same number of columns at any window/sidebar width.
 */
export function useGridColumns<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? Math.max(window.innerWidth - 320, 600) : 1200
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const initialWidth = el.clientWidth || el.getBoundingClientRect().width;
    if (initialWidth > 0) {
      setContainerWidth(initialWidth);
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columnsCount = useMemo(() => {
    if (containerWidth >= 1200) return 6;
    if (containerWidth >= 1000) return 5;
    if (containerWidth >= 750) return 4;
    if (containerWidth >= 550) return 3;
    return 2;
  }, [containerWidth]);

  return { containerRef, columnsCount, containerWidth };
}

