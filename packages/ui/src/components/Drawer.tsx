import React from 'react';
import { Drawer as HeroUIDrawer } from '@heroui/react';

export type DrawerProps = React.ComponentProps<typeof HeroUIDrawer>;

/**
 * Drawer wrapper that defaults disableAnimation to true and shouldBlockScroll to false
 * to prevent Framer-Motion LazyMotion layout flickering and scroll-lock reflows.
 */
export const Drawer = ({
  disableAnimation = true,
  shouldBlockScroll = false,
  placement = 'right',
  ...props
}: DrawerProps) => {
  return (
    <HeroUIDrawer
      disableAnimation={disableAnimation}
      shouldBlockScroll={shouldBlockScroll}
      placement={placement}
      data-drawer-placement={placement}
      {...props}
    />
  );
};

