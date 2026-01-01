import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import React from "react";
import { View } from "../ui";
import { composeRefs } from "../utils";

export interface StaggerRevealProps
  extends React.HTMLAttributes<HTMLDivElement> {
  selector: string;
  duration?: number;
  ease?: string;
  stagger?: number;
  dependencies?: unknown[];
}

const DEFAULT_DURATION = 0.55;
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
    ...rest
  } = props;

  const scopeRef = React.useRef<HTMLDivElement | null>(null);
  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>(selector);
      if (items.length === 0) {
        return;
      }

      gsap.to(items, {
        opacity: 1,
        x: 0,
        duration: duration ?? DEFAULT_DURATION,
        ease: ease ?? DEFAULT_EASE,
        stagger: stagger ?? DEFAULT_STAGGER,
        overwrite: "auto",
      });
    },
    {
      scope: scopeRef,
      dependencies: dependencies,
      revertOnUpdate: true,
    },
  );

  return <View ref={composeRefs(ref, scopeRef)} {...rest} />;
});
