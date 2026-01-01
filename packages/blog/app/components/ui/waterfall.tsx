import { cva } from "class-variance-authority";
import React from "react";
import { cn } from "../utils";
import { useGroups } from "../hooks/use-groups";
import { View } from "./view";

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

interface WaterfallProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  data: T[];
  columns: number;
  columnGap?: WaterfallGap;
  rowGap?: WaterfallGap;
  renderItem: (item: T, index: number) => React.ReactNode;
}
export function Waterfall<T>(props: WaterfallProps<T>) {
  const { className, data, columns, columnGap, rowGap, renderItem, ...rest } =
    props;
  const groups = useWaterfallGroup(data, columns);
  return (
    <View className={cn(className, waterfallGap({ gap: columnGap }))} {...rest}>
      {groups.map((group, index) => (
        <View
          key={index}
          className={cn("flex flex-col flex-1", waterfallGap({ gap: rowGap }))}
        >
          {group.map((item, index) => (
            <View key={index} className="">
              {renderItem(item, index)}
            </View>
          ))}
        </View>
      ))}
    </View>
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
