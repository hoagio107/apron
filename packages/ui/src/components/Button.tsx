import { extendVariants, Button as HeroButton } from "@heroui/react";

export const Button = extendVariants(HeroButton, {
  base: "data-[hover=true]:opacity-100",
  variants: {
    weight: {
      semibold: "font-semibold",
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
  }
});

export type ButtonProps = React.ComponentProps<typeof Button>;
