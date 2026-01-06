import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import React from "react";
import { View } from "../ui";
import { cn, composeRefs } from "../utils";

const DIRECTION_MAP = {
  left: "translateX",
  right: "translateX",
  top: "translateY",
  bottom: "translateY",
} as const;

const NEGATIVE_MAP = {
  left: "-100%",
  right: "100%",
  top: "-100%",
  bottom: "100%",
} as const;

type StaggerRevealDirection = keyof typeof DIRECTION_MAP;

function translateValueFrom(
  direction: StaggerRevealDirection,
): "translateX" | "translateY" {
  return DIRECTION_MAP[direction];
}

function transformValueFrom(direction: StaggerRevealDirection): string {
  return `${translateValueFrom(direction)}(${NEGATIVE_MAP[direction]})`;
}

export interface StaggerRevealProps
  extends React.HTMLAttributes<HTMLDivElement> {
  selector: string;
  duration?: number;
  ease?: string;
  stagger?: number;
  dependencies?: unknown[];
  direction?: StaggerRevealDirection;
}

const DEFAULT_DURATION = 0.85;
const DEFAULT_EASE = "power2.out";
const DEFAULT_STAGGER = 0.06;

export const StaggerReveal = React.forwardRef<
  HTMLDivElement,
  StaggerRevealProps
>(function StaggerReveal(props, ref) {
  const {
    selector,
    duration,
    ease,
    stagger,
    dependencies = [],
    direction = "left",
    className,
    ...rest
  } = props;

  const scopeRef = React.useRef<HTMLDivElement | null>(null);
  useGSAP(() => {
    const scope = scopeRef.current;
    if (!scope) {
      return;
    }
    gsap.to(scope, {
      opacity: 1,
    });
  }, []);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>(selector);
      if (items.length === 0) {
        return;
      }

      // 初始化 transform
      items.forEach((item) => {
        item.style.transform = transformValueFrom(direction);
        item.style.opacity = "0";
      });

      gsap.to(items, {
        opacity: 1,
        [translateValueFrom(direction)]: 0,
        duration: duration ?? DEFAULT_DURATION,
        ease: ease ?? DEFAULT_EASE,
        stagger: stagger ?? DEFAULT_STAGGER,
        overwrite: "auto",
      });
    },
    {
      scope: scopeRef,
      dependencies: [...dependencies],
      revertOnUpdate: true,
    },
  );

  return (
    <View
      ref={composeRefs(ref, scopeRef)}
      className={cn("opacity-0", className)}
      {...rest}
    />
  );
});
