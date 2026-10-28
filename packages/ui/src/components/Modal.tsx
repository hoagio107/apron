import React from 'react';
import { Modal as HeroUIModal } from '@heroui/react';

export type ModalProps = React.ComponentProps<typeof HeroUIModal>;

/**
 * Modal wrapper that defaults disableAnimation to true and shouldBlockScroll to false
 * to prevent Framer-Motion LazyMotion layout flickering and scroll-lock reflows.
 */
export const Modal = ({
  disableAnimation = true,
  shouldBlockScroll = false,
  ...props
}: ModalProps) => {
  return (
    <HeroUIModal
      disableAnimation={disableAnimation}
      shouldBlockScroll={shouldBlockScroll}
      data-modal="true"
      {...props}
    />
  );
};

