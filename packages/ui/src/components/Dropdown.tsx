import React from 'react';
import { Dropdown as HeroUIDropdown } from '@heroui/react';

export type DropdownProps = React.ComponentProps<typeof HeroUIDropdown>;

/**
 * Dropdown wrapper that defaults disableAnimation to true to prevent
 * Framer-Motion layout flickering.
 */
export const Dropdown = ({ disableAnimation = true, ...props }: DropdownProps) => {
  return <HeroUIDropdown disableAnimation={disableAnimation} {...props} />;
};
