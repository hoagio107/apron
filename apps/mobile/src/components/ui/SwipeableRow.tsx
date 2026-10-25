import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface SwipeAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  color?: 'danger' | 'warning' | 'primary' | 'success' | 'default';
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}

const colorStyles: Record<string, string> = {
  danger: 'bg-danger text-danger-foreground hover:bg-danger/90 active:scale-95',
  warning: 'bg-warning text-warning-foreground hover:bg-warning/90 active:scale-95',
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95',
  success: 'bg-success text-success-foreground hover:bg-success/90 active:scale-95',
  default: 'bg-default-200 text-default-700 hover:bg-default-300 active:scale-95',
};

const ACTION_BUTTON_WIDTH = 48; // px (40px button + 8px gap)
const SWIPE_THRESHOLD_RATIO = 0.4; // 40% của tổng chiều rộng nút để snap mở

export function SwipeableRow({
  children,
  actions,
  className = '',
  contentClassName = '',
  disabled = false,
}: SwipeableRowProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentTranslateRef = useRef(0);
  const isHorizontalDragRef = useRef<boolean | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const totalActionWidth = actions.length * ACTION_BUTTON_WIDTH;

  const close = useCallback(() => {
    setTranslateX(0);
    currentTranslateRef.current = 0;
    setIsOpen(false);
  }, []);

  // Lắng nghe sự kiện để đóng hàng này khi hàng khác mở
  const id = useRef(Math.random().toString(36).slice(2)).current;
  useEffect(() => {
    const handleOtherOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      if (customEvent.detail?.id !== id && isOpen) {
        close();
      }
    };
    window.addEventListener('swipeable-row-opened', handleOtherOpen);
    return () => window.removeEventListener('swipeable-row-opened', handleOtherOpen);
  }, [id, isOpen, close]);

  // Pointer drag events
  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || actions.length === 0) return;
    // Bỏ qua nếu bấm trực tiếp vào vùng các nút hành động
    if (actionsRef.current?.contains(e.target as Node)) {
      return;
    }
    // Chỉ kích hoạt với chuột trái hoặc cảm ứng
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    isHorizontalDragRef.current = null;
    pointerIdRef.current = e.pointerId;
    setIsDragging(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;

    const diffX = e.clientX - startXRef.current;
    const diffY = e.clientY - startYRef.current;

    // Phân định hướng vuốt: ngang hay dọc (cuộn trang)
    if (isHorizontalDragRef.current === null) {
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);
      if (absX > 6 || absY > 6) {
        if (absX > absY) {
          isHorizontalDragRef.current = true;
          setIsDragging(true);
          try {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          } catch {
            // ignore if unsupported
          }
        } else {
          isHorizontalDragRef.current = false;
          return;
        }
      } else {
        return;
      }
    }

    if (!isHorizontalDragRef.current) return;

    // Tính toán vị trí trượt mượt mà
    const baseOffset = isOpen ? -totalActionWidth : 0;
    let nextX = baseOffset + diffX;

    // Chặn không cho kéo sang phải quá mức (chỉ trượt sang trái để hiện action)
    if (nextX > 0) {
      nextX = nextX * 0.15; // resistance
    } else if (nextX < -totalActionWidth) {
      const overDrag = -totalActionWidth - nextX;
      nextX = -totalActionWidth - overDrag * 0.25; // resistance
    }

    currentTranslateRef.current = nextX;
    setTranslateX(nextX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;

    if (isHorizontalDragRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDragging(false);

      const threshold = totalActionWidth * SWIPE_THRESHOLD_RATIO;
      const targetOffset = isOpen ? -totalActionWidth : 0;
      const moved = currentTranslateRef.current - targetOffset;

      if (!isOpen && moved < -threshold) {
        // Kéo đủ để mở
        setTranslateX(-totalActionWidth);
        currentTranslateRef.current = -totalActionWidth;
        setIsOpen(true);
        // Thông báo đóng các row khác
        window.dispatchEvent(
          new CustomEvent('swipeable-row-opened', { detail: { id } })
        );
      } else if (isOpen && moved > threshold) {
        // Kéo sang phải đủ để đóng
        close();
      } else {
        // Trở về trạng thái trước đó
        setTranslateX(isOpen ? -totalActionWidth : 0);
        currentTranslateRef.current = isOpen ? -totalActionWidth : 0;
      }
    }

    isHorizontalDragRef.current = null;
  };

  // Ngăn chặn click vào item khi vừa kết thúc thao tác kéo vuốt
  const handleClickCapture = (e: React.MouseEvent) => {
    if (currentTranslateRef.current !== 0 && !isOpen) {
      e.stopPropagation();
      e.preventDefault();
    } else if (isOpen && currentTranslateRef.current === -totalActionWidth) {
      // Khi đang mở mà click vào thân content -> đóng lại thay vì mở chi tiết
      e.stopPropagation();
      e.preventDefault();
      close();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none touch-pan-y ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Lớp nút hành động ẩn ở phía sau (bên phải) */}
      <div
        ref={actionsRef}
        className="absolute inset-y-0 right-0 flex items-center justify-end gap-1.5 pr-2 z-0"
        style={{ width: totalActionWidth }}
      >
        {actions.map((act) => (
          <button
            key={act.key}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              act.onClick(e);
              close();
            }}
            aria-label={act.label}
            title={act.label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform cursor-pointer shrink-0 ${
              colorStyles[act.color || 'default']
            } ${act.className || ''}`}
          >
            {act.icon}
          </button>
        ))}
      </div>

      {/* Lớp nội dung chính trượt ở phía trên */}
      <div
        onClickCapture={handleClickCapture}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`relative z-10 w-full ${contentClassName || 'bg-content1'} transition-[background-color]`}
      >
        {children}
      </div>
    </div>
  );
}
