import { extendVariants, Button as HeroButton } from "@heroui/react";

export const Button = extendVariants(HeroButton, {
  variants: {
    weight: {
      semibold: "font-semibold",
    },
    variant: {
      solid: "border-0 border-none !border-none",
      bordered: "border-0 border-none !border-none",
      flat: "border-0 border-none !border-none",
      faded: "border-0 border-none !border-none",
      light: "border-0 border-none !border-none",
      ghost: "border-0 border-none !border-none",
      shadow: "border-0 border-none !border-none",
    }
  },
  compoundVariants: [
    {
      variant: "flat",
      color: "primary",
      class: "dark:bg-primary/20 dark:text-emerald-400 dark:hover:bg-primary/30",
    },
    {
      variant: "flat",
      color: "success",
      class: "dark:bg-success/20 dark:text-emerald-400 dark:hover:bg-success/30",
    },
    {
      variant: "flat",
      color: "secondary",
      class: "dark:bg-secondary/20 dark:text-purple-300 dark:hover:bg-secondary/30",
    },
    {
      variant: "flat",
      color: "warning",
      class: "dark:bg-warning/20 dark:text-amber-300 dark:hover:bg-warning/30",
    },
    {
      variant: "flat",
      color: "danger",
      class: "dark:bg-danger/20 dark:text-rose-400 dark:hover:bg-danger/30",
    },
  ],
  defaultVariants: {
    weight: "semibold",
    variant: "solid",
  }
});

export type ButtonProps = React.ComponentProps<typeof Button>;
