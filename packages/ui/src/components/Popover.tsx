import React from 'react';
import { Popover as HeroUIPopover } from '@heroui/react';

export type PopoverProps = React.ComponentProps<typeof HeroUIPopover>;

/**
 * Popover wrapper that defaults disableAnimation to true to prevent
 * Framer-Motion layout flickering.
 */
export const Popover = ({ disableAnimation = true, ...props }: PopoverProps) => {
  return <HeroUIPopover disableAnimation={disableAnimation} {...props} />;
};
