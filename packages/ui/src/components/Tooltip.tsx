import React from 'react';
import { Tooltip as HeroUITooltip } from '@heroui/react';

export type TooltipProps = React.ComponentProps<typeof HeroUITooltip>;

/**
 * Tooltip wrapper that defaults disableAnimation to true to prevent
 * Framer-Motion layout flickering.
 */
export const Tooltip = ({ disableAnimation = true, ...props }: TooltipProps) => {
  return <HeroUITooltip disableAnimation={disableAnimation} {...props} />;
};
