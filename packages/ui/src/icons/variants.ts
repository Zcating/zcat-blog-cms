import { tv } from "tailwind-variants";

export const iconVariants = tv({
  base: "size-6",
  variants: {
    size: {
      xs: "size-2",
      sm: "size-4",
      md: "size-6",
      lg: "size-8",
      xl: "size-10",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface IconProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
}
