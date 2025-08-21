import { cva } from "class-variance-authority";
import React from "react";
import { cn } from "../utils";
import { useGroups } from "../hooks/use-groups";

const waterfallGap = cva("flex gap-4", {
  variants: {
    gap: {
      sm: "gap-4",
      md: "gap-8",
      lg: "gap-12",
      xl: "gap-16",
      "2xl": "gap-24",
      "3xl": "gap-32",
      "4xl": "gap-40",
    },
  },
});
type WaterfallGap = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

interface WaterfallProps<T> {
  className?: string;
  data: T[];
  columns: number;
  columnGap?: WaterfallGap;
  rowGap?: WaterfallGap;
  renderItem: (item: T, index: number) => React.ReactNode;
}
export function Waterfall<T>(props: WaterfallProps<T>) {
  const groups = useWaterfallGroup(props.data, props.columns);
  return (
    <div
      className={cn(props.className, waterfallGap({ gap: props.columnGap }))}
    >
      {groups.map((group, index) => (
        <div
          key={index}
          className={cn(
            "flex flex-col flex-1",
            waterfallGap({ gap: props.rowGap }),
          )}
        >
          {group.map((item, index) => (
            <div key={index} className="">
              {props.renderItem(item, index)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function useWaterfallGroup<T>(data: T[], columns: number) {
  return React.useMemo(() => {
    return data.reduce((acc, cur, index) => {
      const accIndex = index % columns;
      if (acc[accIndex] === undefined) {
        acc[accIndex] = [];
      }
      acc[accIndex].push(cur);
      return acc;
    }, [] as T[][]);
  }, [data, columns]);
}
