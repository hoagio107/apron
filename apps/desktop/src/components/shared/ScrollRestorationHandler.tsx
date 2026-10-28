import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const scrollPositions = new Map<string, number>();

export function getSavedScrollPosition(pathname: string): number {
  return scrollPositions.get(pathname) || 0;
}

export function setSavedScrollPosition(pathname: string, pos: number): void {
  scrollPositions.set(pathname, pos);
}

interface ScrollRestorationHandlerProps {
  containerSelector?: string;
}

/**
 * ScrollRestorationHandler
 * Tự động ghi nhớ và phục hồi vị trí cuộn khi người dùng điều hướng qua lại giữa các trang trong app.
 * Khi Back (POP): Phục hồi chính xác vị trí đã dừng.
 * Khi xem trang mới (PUSH): Đưa lên đầu trang.
 */
export function ScrollRestorationHandler({ containerSelector = '.overflow-y-auto' }: ScrollRestorationHandlerProps) {
  const location = useLocation();
  const navType = useNavigationType();
  const prevPathRef = useRef(location.pathname);

  // Theo dõi và lưu vị trí cuộn liên tục
  useEffect(() => {
    const container = document.querySelector(containerSelector) as HTMLElement | null;
    if (!container) return;

    let timeoutId: any = null;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        scrollPositions.set(location.pathname, container.scrollTop);
      }, 50);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener('scroll', handleScroll);
      scrollPositions.set(location.pathname, container.scrollTop);
    };
  }, [location.pathname, containerSelector]);

  // Phục hồi vị trí cuộn khi route thay đổi
  useEffect(() => {
    const container = document.querySelector(containerSelector) as HTMLElement | null;
    if (!container) return;

    prevPathRef.current = location.pathname;

    if (navType === 'POP') {
      // Người dùng nhấn Back: phục hồi vị trí cũ đã dừng
      const targetScroll = scrollPositions.get(location.pathname) || 0;
      
      requestAnimationFrame(() => {
        container.scrollTop = targetScroll;
      });

      const t1 = setTimeout(() => {
        container.scrollTop = targetScroll;
      }, 50);

      const t2 = setTimeout(() => {
        container.scrollTop = targetScroll;
      }, 150);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (navType === 'PUSH') {
      // Người dùng mở trang mới: đưa về đỉnh
      container.scrollTop = 0;
    }
  }, [location.pathname, navType, containerSelector]);

  return null;
}
