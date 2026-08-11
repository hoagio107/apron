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
      return { icon: Leaf, bg: 'bg-success-50', text: 'text-success-600' };
    case CATEGORIES.MEAT_SEAFOOD:
      return { icon: Beef, bg: 'bg-danger-50', text: 'text-danger-600' };
    case CATEGORIES.DAIRY_EGGS:
      return { icon: Milk, bg: 'bg-warning-50', text: 'text-warning-600' };
    case CATEGORIES.SPICES_SAUCES:
      return { icon: Droplet, bg: 'bg-primary-50', text: 'text-primary-600' };
    case CATEGORIES.GRAINS_CARBS:
      return { icon: Wheat, bg: 'bg-secondary-50', text: 'text-secondary-600' };
    default:
      return { icon: Beaker, bg: 'bg-default-100', text: 'text-default-500' };
  }
}
