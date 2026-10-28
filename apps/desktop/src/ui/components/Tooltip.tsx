import React from 'react';
import { Tooltip as HeroUITooltip } from '@heroui/react';

export type TooltipProps = React.ComponentProps<typeof HeroUITooltip>;

/**
 * Tooltip wrapper that defaults disableAnimation to true.
 * This completely prevents the Framer-Motion layout recalculation flicker on desktop
 * while preserving smooth CSS GPU-accelerated entrance animations.
 */
export const Tooltip = ({ disableAnimation = true, ...props }: TooltipProps) => {
  return <HeroUITooltip disableAnimation={disableAnimation} {...props} />;
};
