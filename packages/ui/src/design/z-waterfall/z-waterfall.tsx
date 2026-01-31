import { cva } from 'class-variance-authority';
import React from 'react';

import { useScreenSize } from '@zcat/ui/hooks';
import { cn } from '@zcat/ui/shadcn';
import { isNumber } from '@zcat/ui/utils';

import { ZView } from '../z-view';

type WaterfallSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type WaterfallColumnCountConfig = {
  [key in WaterfallSize]?: number;
};

const waterfallGap = cva('flex gap-4 w-full', {
  variants: {
    gap: {
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-8',
      xl: 'gap-12',
    },
  },
});

export interface ZWaterfallProps<
  T,
> extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  data: T[];
  columnCountConfig: WaterfallColumnCountConfig;
  columnCount?: number;
  columnGap?: WaterfallSize;
  rowGap?: WaterfallSize;
  renderItem: (item: T, index: number) => React.ReactNode;
}

interface ZWaterfallComponent extends React.ForwardRefExoticComponent<
  ZWaterfallProps<any> & React.RefAttributes<HTMLDivElement>
> {
  <T>(
    props: ZWaterfallProps<T> & React.RefAttributes<HTMLDivElement>,
  ): React.ReactNode;
}

export const ZWaterfall = React.forwardRef<
  HTMLDivElement,
  ZWaterfallProps<any>
>((props, ref) => {
  const {
    className,
    data,
    columnCountConfig,
    columnCount = 3,
    columnGap,
    rowGap,
    renderItem,
    ...rest
  } = props;
  const groups = useWaterfallGroup(data, columnCount, columnCountConfig);
  return (
    <ZView
      ref={ref}
      className={cn(className, waterfallGap({ gap: columnGap }))}
      {...rest}
    >
      {groups.map((group, index) => (
        <ZView
          key={index}
          className={cn('flex flex-col flex-1', waterfallGap({ gap: rowGap }))}
        >
          {group.map((item, index) => (
            <ZView key={index} className="">
              {renderItem(item, index)}
            </ZView>
          ))}
        </ZView>
      ))}
    </ZView>
  );
}) as ZWaterfallComponent;

ZWaterfall.displayName = 'ZWaterfall';

function useWaterfallGroup<T>(
  data: T[],
  columnCount: number,
  columnCountConfig?: WaterfallColumnCountConfig,
) {
  const screenSizeCount = useScreenSize(columnCountConfig);
  return React.useMemo(() => {
    const count = screenSizeCount ?? columnCount;

    return data.reduce((acc, cur, index) => {
      const accIndex = index % count;
      if (acc[accIndex] === undefined) {
        acc[accIndex] = [];
      }
      acc[accIndex].push(cur);
      return acc;
    }, [] as T[][]);
  }, [data, columnCount, screenSizeCount]);
}
