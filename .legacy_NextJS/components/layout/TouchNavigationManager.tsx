
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Quản lý các thao tác vuốt chạm trên thiết bị di động.
 * - Pull to Refresh: Kéo từ đỉnh trang để tải lại.
 * - Edge Swipe: Vuốt từ cạnh trái sang phải để lùi trang (router.back).
 */

export function TouchNavigationManager({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  
  const touchStart = useRef({ x: 0, y: 0 });
  const isPulling = useRef(false);
  const isSwiping = useRef(false);

  const PULL_THRESHOLD = 80;
  const SWIPE_THRESHOLD = 100;
  const EDGE_WIDTH = 30; // Khoảng cách từ cạnh trái để bắt đầu vuốt lùi

  useEffect(() => {
    const handleStart = (e: TouchEvent) => {
      if (isRefreshing) return;
      
      const touch = e.touches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY };
      
      // Kiểm tra vuốt từ cạnh trái (Back gesture)
      if (touch.clientX < EDGE_WIDTH) {
        isSwiping.current = true;
      } else {
        isSwiping.current = false;
      }
      
      // Kiểm tra kéo từ trên cùng (Pull to refresh)
      if (window.scrollY === 0) {
        isPulling.current = true;
      } else {
        isPulling.current = false;
      }
    };

    const handleMove = (e: TouchEvent) => {
      if (isRefreshing) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;

      // Xử lý Vuốt lùi (Edge Swipe)
      if (isSwiping.current && deltaX > 0 && Math.abs(deltaY) < Math.abs(deltaX)) {
        const progress = Math.min(deltaX, SWIPE_THRESHOLD + 20);
        setSwipeProgress(progress);
        // Ngăn chặn hành vi mặc định của trình duyệt nếu chúng ta đang xử lý vuốt
        if (deltaX > 10) e.preventDefault();
      }

      // Xử lý Kéo tải lại (Pull to Refresh)
      if (isPulling.current && deltaY > 0 && Math.abs(deltaX) < Math.abs(deltaY)) {
        const distance = Math.min(deltaY * 0.4, PULL_THRESHOLD + 20);
        setPullDistance(distance);
        if (deltaY > 10) e.preventDefault();
      }
    };

    const handleEnd = () => {
      if (isSwiping.current) {
        if (swipeProgress >= SWIPE_THRESHOLD) {
          router.back();
        }
        setSwipeProgress(0);
        isSwiping.current = false;
      }

      if (isPulling.current) {
        if (pullDistance >= PULL_THRESHOLD) {
          setIsRefreshing(true);
          window.location.reload();
        }
        setPullDistance(0);
        isPulling.current = false;
      }
    };

    window.addEventListener('touchstart', handleStart, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('touchstart', handleStart);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [pullDistance, swipeProgress, isRefreshing, router]);

  return (
    <div className="relative min-h-screen">
      {/* Pull to Refresh Indicator */}
      <div 
        className="fixed top-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none transition-transform duration-150 ease-out"
        style={{ transform: `translateY(${pullDistance - 50}px)`, opacity: pullDistance / 40 }}
      >
        <div className="bg-white dark:bg-gray-800 p-2.5 rounded-full shadow-xl border border-orange-100 dark:border-gray-700">
          <RefreshCw className={cn("w-5 h-5 text-orange-500", isRefreshing && "animate-spin")} />
        </div>
      </div>

      {/* Swipe Back Indicator */}
      <div 
        className="fixed left-0 top-1/2 -translate-y-1/2 z-[9999] pointer-events-none transition-all duration-150 ease-out"
        style={{ 
          transform: `translateX(${swipeProgress - 60}px)`, 
          opacity: Math.min(swipeProgress / 60, 1),
          scale: 0.8 + (swipeProgress / SWIPE_THRESHOLD) * 0.4
        }}
      >
        <div className="bg-orange-500/90 backdrop-blur-md p-4 rounded-r-3xl shadow-2xl border-y border-r border-white/20">
          <ArrowLeft className="w-6 h-6 text-white" />
        </div>
      </div>

      {children}
    </div>
  );
}
