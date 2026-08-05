import { extendVariants, Button as HeroButton } from "@heroui/react";

export const Button = extendVariants(HeroButton, {
  variants: {
    weight: {
      semibold: "font-semibold",
    }
  },
  defaultVariants: {
    weight: "semibold",
  }
});

export type ButtonProps = React.ComponentProps<typeof Button>;
