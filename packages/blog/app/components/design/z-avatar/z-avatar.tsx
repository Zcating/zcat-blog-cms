import * as Shadcn from "@blog/components/ui/avatar";
import type React from "react";
import { tv } from "tailwind-variants";

interface ZAvatarProps {
  size?: "sm" | "md" | "lg";
  src?: string;
  fallback?: React.ReactNode;
}

const avatar = tv({
  base: "w-32 h-32",
  variants: {
    size: {
      sm: "w-24 h-24",
      md: "w-32 h-32",
      lg: "w-40 h-40",
    },
  },
});

export function ZAvatar(props: ZAvatarProps) {
  return (
    <Shadcn.Avatar className={avatar({ size: props.size })}>
      <Shadcn.AvatarImage src={props.src} />
      <Shadcn.AvatarFallback>{props.fallback}</Shadcn.AvatarFallback>
    </Shadcn.Avatar>
  );
}
