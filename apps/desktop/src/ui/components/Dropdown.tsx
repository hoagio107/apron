import React from 'react';
import { Dropdown as HeroUIDropdown } from '@heroui/react';

export type DropdownProps = React.ComponentProps<typeof HeroUIDropdown>;

/**
 * Dropdown wrapper that defaults disableAnimation to true.
 * This completely prevents the Framer-Motion layout recalculation flicker on desktop
 * while preserving smooth CSS GPU-accelerated entrance animations.
 */
export const Dropdown = ({ disableAnimation = true, ...props }: DropdownProps) => {
  return <HeroUIDropdown disableAnimation={disableAnimation} {...props} />;
};
