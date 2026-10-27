import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { toast } from '@/ui';

interface SwipeState {
  isActive: boolean;
  direction: 'left' | 'right'; // 'right' = kéo từ mép trái sang phải; 'left' = vuốt sang trái (từ mép phải hoặc trên trang)
  distance: number;
  y: number;
  isReadyToTrigger: boolean;
}

const TRIGGER_THRESHOLD = 50; // pixels kéo để kích hoạt quay lại
const EDGE_ZONE_WIDTH = 45;   // pixels tính từ mép màn hình

export function SwipeBackHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastBackPressRef = useRef<number>(0);

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isActive: false,
    direction: 'right',
    distance: 0,
    y: 0,
    isReadyToTrigger: false
  });

  const touchStartRef = useRef<{ x: number; y: number; time: number; isEdgeLeft: boolean; isEdgeRight: boolean; isInteractive: boolean } | null>(null);
  const lockAxisRef = useRef<'horizontal' | 'vertical' | null>(null);
  const currentDirectionRef = useRef<'left' | 'right' | null>(null);
  const hasVibratedRef = useRef(false);

  // Điều hướng quay lại thông minh
  const handleGoBack = useCallback(() => {
    // Nếu có lịch sử trong React Router / Browser stack
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
      return;
    }

    // Fallback thông minh theo đường dẫn hiện tại khi mở link trực tiếp hoặc reload
    const path = location.pathname;
    if (path.startsWith('/recipes/')) {
      navigate('/recipes');
    } else if (path.startsWith('/courses/')) {
      navigate('/courses');
    } else if (path.startsWith('/tips/')) {
      navigate('/tips');
    } else if (path !== '/') {
      navigate('/');
    }
  }, [location.pathname, navigate]);

  // Lắng nghe phím Back vật lý / cử chỉ vuốt cạnh điện thoại của Android qua Capacitor
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: PluginListenerHandle | null = null;

    const setupListener = async () => {
      listenerHandle = await CapApp.addListener('backButton', () => {
        // 1. Nếu có modal, drawer, dialog hoặc popover đang mở -> đóng modal trước
        const hasOpenOverlay = document.querySelector(
          '[data-overlay-container="true"] [role="dialog"], [role="dialog"][data-open="true"], [data-slot="backdrop"]'
        );
        if (hasOpenOverlay) {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          return;
        }

        // 2. Nếu đang ở trang con -> quay lại trang trước
        if (location.pathname !== '/') {
          handleGoBack();
          return;
        }

        // 3. Nếu đang ở trang chủ '/' -> nhấn 2 lần trong 2 giây để thoát
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          CapApp.exitApp();
        } else {
          lastBackPressRef.current = now;
          toast.info('Nhấn lần nữa để thoát ứng dụng');
        }
      });
    };

    setupListener();

    return () => {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
    };
  }, [location.pathname, handleGoBack]);

  useEffect(() => {
    // Không kích hoạt cử chỉ web touch back khi đang ở trang chủ '/'
    if (location.pathname === '/') {
      return;
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const target = e.target as HTMLElement | null;

      // Kiểm tra vùng tương tác đặc biệt cần né
      const isInput = target?.closest('input, textarea, select, [contenteditable="true"], .tiptap, [data-no-swipe-back]') !== null;
      const isSwipeableRow = target?.closest('[data-swipeable-row="true"]') !== null;
      const isHorizontalScroll = target?.closest('.overflow-x-auto, .overflow-x-scroll') !== null;

      const isEdgeLeft = touch.clientX <= EDGE_ZONE_WIDTH;
      const isEdgeRight = touch.clientX >= window.innerWidth - EDGE_ZONE_WIDTH;

      // Nếu chạm vào phần tử tương tác hoặc swipeable row ở giữa màn hình -> bỏ qua
      if ((isInput || isSwipeableRow || isHorizontalScroll) && !isEdgeLeft && !isEdgeRight) {
        touchStartRef.current = null;
        return;
      }

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        isEdgeLeft,
        isEdgeRight,
        isInteractive: isInput || isSwipeableRow || isHorizontalScroll
      };

      lockAxisRef.current = null;
      currentDirectionRef.current = null;
      hasVibratedRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const diffX = touch.clientX - touchStartRef.current.x;
      const diffY = touch.clientY - touchStartRef.current.y;

      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);

      // Phân định hướng vuốt: ngang hay dọc (cuộn trang)
      if (lockAxisRef.current === null) {
        if (absX < 8 && absY < 8) return;

        if (absY >= absX) {
          // Người dùng đang cuộn dọc -> khóa không kích hoạt swipe back
          lockAxisRef.current = 'vertical';
          return;
        } else {
          // Vuốt ngang
          lockAxisRef.current = 'horizontal';

          // Xác định hướng vuốt hợp lệ:
          // 1. Kéo từ mép trái sang phải (iOS & Android edge back)
          if (touchStartRef.current.isEdgeLeft && diffX > 0) {
            currentDirectionRef.current = 'right';
          }
          // 2. Vuốt sang trái: từ mép phải kéo sang trái (Android edge back) HOẶC vuốt sang trái trên trang sub-page
          else if (diffX < 0 && (touchStartRef.current.isEdgeRight || (!touchStartRef.current.isInteractive && absX > 15))) {
            currentDirectionRef.current = 'left';
          }
          // 3. Vuốt sang phải trên sub-page (nếu không nằm trong phần tử tương tác)
          else if (diffX > 0 && !touchStartRef.current.isInteractive && absX > 15) {
            currentDirectionRef.current = 'right';
          } else {
            lockAxisRef.current = 'vertical';
            return;
          }
        }
      }

      if (lockAxisRef.current !== 'horizontal' || !currentDirectionRef.current) return;

      const direction = currentDirectionRef.current;
      // Tính quãng đường kéo theo hướng tương ứng
      const dragDistance = direction === 'right' ? Math.max(0, diffX) : Math.max(0, -diffX);

      if (dragDistance > 5) {
        const isReady = dragDistance >= TRIGGER_THRESHOLD;

        // Rung nhẹ khi vừa đạt ngưỡng kích hoạt
        if (isReady && !hasVibratedRef.current) {
          try {
            navigator.vibrate?.(15);
          } catch {
            // ignore
          }
          hasVibratedRef.current = true;
        } else if (!isReady && hasVibratedRef.current) {
          hasVibratedRef.current = false;
        }

        setSwipeState({
          isActive: true,
          direction,
          distance: Math.min(dragDistance, 100),
          y: touch.clientY,
          isReadyToTrigger: isReady
        });
      }
    };

    const onTouchEnd = () => {
      if (touchStartRef.current && lockAxisRef.current === 'horizontal') {
        if (swipeState.isReadyToTrigger) {
          try {
            navigator.vibrate?.(20);
          } catch {
            // ignore
          }
          handleGoBack();
        }
      }

      touchStartRef.current = null;
      lockAxisRef.current = null;
      currentDirectionRef.current = null;
      hasVibratedRef.current = false;

      setSwipeState({
        isActive: false,
        direction: 'right',
        distance: 0,
        y: 0,
        isReadyToTrigger: false
      });
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [location.pathname, swipeState.isReadyToTrigger, handleGoBack]);

  const pillRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!swipeState.isActive) return;
    const clampedY = Math.max(80, Math.min(window.innerHeight - 100, swipeState.y));
    const isPullingRight = swipeState.direction === 'right';
    const width = Math.max(34, Math.min(56, 26 + swipeState.distance * 0.45));

    if (pillRef.current) {
      pillRef.current.style.top = `${clampedY}px`;
      pillRef.current.style.transform = 'translateY(-50%)';
      pillRef.current.style.width = `${width}px`;
      pillRef.current.style.height = '48px';
      pillRef.current.style.paddingLeft = isPullingRight ? '8px' : '4px';
      pillRef.current.style.paddingRight = isPullingRight ? '4px' : '8px';
    }
    if (badgeRef.current) {
      badgeRef.current.style.top = `${clampedY}px`;
      badgeRef.current.style.transform = 'translateY(-50%)';
    }
  }, [swipeState]);

  if (!swipeState.isActive) return null;

  const isPullingRight = swipeState.direction === 'right';

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none">
      {/* Chỉ báo cử chỉ Back dạng pill nổi bật theo phong cách Android/iOS */}
      <div
        ref={pillRef}
        className={`absolute flex items-center justify-center transition-all duration-75 ${
          isPullingRight ? 'left-0 rounded-r-full' : 'right-0 rounded-l-full'
        } ${
          swipeState.isReadyToTrigger
            ? 'bg-primary text-white shadow-lg shadow-primary/40 scale-105'
            : 'bg-content1/90 backdrop-blur-md text-foreground border border-divider shadow-md'
        }`}
      >
        <ChevronLeft
          className={`w-6 h-6 transition-all duration-150 ${
            swipeState.isReadyToTrigger ? 'scale-125 stroke-[2.5]' : 'scale-100 opacity-70'
          }`}
        />
      </div>

      {/* Badge phụ hiển thị chữ "Quay lại" khi đã kéo đủ ngưỡng */}
      {swipeState.isReadyToTrigger && (
        <div
          ref={badgeRef}
          className={`absolute text-xs font-semibold px-2.5 py-1 rounded-full bg-primary text-white shadow-md transition-all duration-150 animate-in fade-in zoom-in-90 ${
            isPullingRight ? 'left-16' : 'right-16'
          }`}
        >
          Quay lại
        </div>
      )}
    </div>
  );
}
