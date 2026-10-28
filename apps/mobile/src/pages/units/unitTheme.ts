import { Scale, Droplet, Hash, Package } from 'lucide-react';

export function getUnitTheme(category: string) {
  switch (category) {
    case 'Khối lượng':
      return {
        icon: Scale,
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-transparent'
      };
    case 'Thể tích':
      return {
        icon: Droplet,
        bg: 'bg-sky-500/10 dark:bg-sky-500/20',
        text: 'text-sky-600 dark:text-sky-400',
        border: 'border-transparent'
      };
    case 'Số lượng / Đếm':
      return {
        icon: Hash,
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-transparent'
      };
    default:
      return {
        icon: Package,
        bg: 'bg-purple-500/10 dark:bg-purple-500/20',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-transparent'
      };
  }
}

