import { useState, useEffect } from 'react';

export function useKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) return;

    // Lưu lại chiều cao ban đầu của màn hình
    // Dùng screen.availHeight hoặc window.innerHeight lúc chưa bật bàn phím
    let initialHeight = window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      
      // Cập nhật lại initialHeight nếu màn hình xoay ngang/dọc
      if (currentHeight > initialHeight) {
        initialHeight = currentHeight;
      }

      // Nếu chiều cao viewport bị giảm hơn 150px thì chắc chắn là bàn phím ảo bật lên
      const isKeyboard = currentHeight < initialHeight - 150;
      setIsKeyboardOpen(isKeyboard);
      
      if (isKeyboard) {
        setKeyboardHeight(initialHeight - currentHeight);
        // Thêm class global để tự động ẩn các thanh bottom nav
        document.body.classList.add('keyboard-open');
      } else {
        setKeyboardHeight(0);
        document.body.classList.remove('keyboard-open');
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    
    // Kích hoạt thử 1 lần lúc mount
    handleResize();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
      document.body.classList.remove('keyboard-open');
    };
  }, []);

  return { isKeyboardOpen, keyboardHeight };
}
