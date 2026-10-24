import { Leaf, Beef, Milk, Droplet, Wheat, Beaker, type LucideIcon } from 'lucide-react';
import { CATEGORIES } from '@apron/core';

export interface CategoryTheme {
  icon: LucideIcon;
  bg: string;
  text: string;
}

export function getCategoryTheme(group?: string): CategoryTheme {
  switch (group) {
    case CATEGORIES.VEGGIES:
      return { icon: Leaf, bg: 'bg-success-50 dark:bg-success-500/20', text: 'text-success-600 dark:text-success-400' };
    case CATEGORIES.MEAT_SEAFOOD:
      return { icon: Beef, bg: 'bg-danger-50 dark:bg-danger-500/20', text: 'text-danger-600 dark:text-danger-400' };
    case CATEGORIES.DAIRY_EGGS:
      return { icon: Milk, bg: 'bg-warning-50 dark:bg-warning-500/20', text: 'text-warning-600 dark:text-warning-400' };
    case CATEGORIES.SPICES_SAUCES:
      return { icon: Droplet, bg: 'bg-primary-50 dark:bg-primary-500/20', text: 'text-primary-600 dark:text-primary-400' };
    case CATEGORIES.GRAINS_CARBS:
      return { icon: Wheat, bg: 'bg-secondary-50 dark:bg-secondary-500/20', text: 'text-secondary-600 dark:text-secondary-400' };
    default:
      return { icon: Beaker, bg: 'bg-default-100 dark:bg-default-100', text: 'text-default-500 dark:text-default-400' };
  }
}
