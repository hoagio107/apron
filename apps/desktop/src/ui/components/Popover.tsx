import React from 'react';
import { Popover as HeroUIPopover } from '@heroui/react';

export type PopoverProps = React.ComponentProps<typeof HeroUIPopover>;

/**
 * Popover wrapper that defaults disableAnimation to true.
 * This completely prevents the Framer-Motion layout recalculation flicker on desktop
 * while preserving smooth CSS GPU-accelerated entrance animations.
 */
export const Popover = ({ disableAnimation = true, ...props }: PopoverProps) => {
  return <HeroUIPopover disableAnimation={disableAnimation} {...props} />;
};
