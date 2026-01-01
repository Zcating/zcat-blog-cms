import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import React from "react";
import { View } from "../ui";
import { composeRefs } from "../utils";

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

function transformFrom(direction: StaggerRevealDirection): string {
  return `${DIRECTION_MAP[direction]}(${NEGATIVE_MAP[direction]})`;
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
    ...rest
  } = props;

  const scopeRef = React.useRef<HTMLDivElement | null>(null);
  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>(selector);
      items.forEach((item) => {
        item.style.transform = transformFrom(direction);
        item.style.opacity = "0";
      });
      if (items.length === 0) {
        return;
      }

      gsap.to(items, {
        opacity: 1,
        x: 0,
        translateX: 0,
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

  return <View ref={composeRefs(ref, scopeRef)} {...rest} />;
});
