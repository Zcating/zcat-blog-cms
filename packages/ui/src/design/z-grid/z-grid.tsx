import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

import { useGroups } from '@zcat/ui/hooks';
import { cn } from '@zcat/ui/shadcn';

const gridGapTv = cva('gap-4', {
  variants: {
    gap: {
      sm: 'gap-4',
      md: 'gap-8',
      lg: 'gap-12',
      xl: 'gap-16',
      '2xl': 'gap-24',
      '3xl': 'gap-32',
      '4xl': 'gap-40',
    },
  },
});

type GridGap = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

export interface GridProps<T> {
  className?: string;
  columnClassName?: string;
  rowClassName?: string;
  cols: number;
  rowGap?: GridGap;
  columnGap?: GridGap;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
}

export function ZGrid<T>(props: GridProps<T>) {
  const cols = props.cols ?? 2;
  const groups = useGroups(props.items, cols);
  const renderEmpty = props.renderEmpty ?? defaultRenderEmpty;
  const filling = React.useCallback(
    (items: T[]) => {
      const reminder = items.length % cols;
      if (reminder === 0) {
        return [];
      }
      return Array.from({ length: cols - reminder }).fill(null);
    },
    [cols],
  );
  return (
    <div
      className={cn(
        'flex flex-col',
        gridGapTv({ gap: props.rowGap }),
        props.className,
      )}
    >
      {props.items.length === 0 ? renderEmpty() : null}
      {groups.map((items, index) => (
        <div
          key={`col-${index}`}
          className={cn(
            'flex w-full px-4',
            gridGapTv({ gap: props.columnGap }),
            props.columnClassName,
          )}
        >
          {items.map((item, index) => (
            <div
              key={`row-${index}`}
              className={cn('flex-1', props.rowClassName)}
            >
              {props.renderItem(item)}
            </div>
          ))}
          {filling(items).map((item, index) => (
            <div
              key={`filling-${index}`}
              className={cn('flex-1', props.rowClassName)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function defaultRenderEmpty() {
  return (
    <div className="w-full h-[500px] flex items-center justify-center">
      <div>暂无数据</div>
    </div>
  );
}
