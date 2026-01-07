import React from 'react';
import { classnames } from '../utils';
import { tv } from 'tailwind-variants';

const gridTv = tv({
  variants: {
    gap: {
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
  },
  defaultVariants: {
    gap: 'md',
  },
});

interface GridProps<T> {
  columnClassName?: string;
  rowClassName?: string;
  className?: string;
  columns: number;
  gap?: 'sm' | 'lg' | 'md' | 'xs' | 'xl';
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
}

export function Grid<T>(props: GridProps<T>) {
  const renderEmpty = props.renderEmpty ?? defaultRenderEmpty;

  const cols = props.columns ?? 2;
  const groups = useGroups(props.items, cols);
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

  const columnClassName = classnames(
    'flex w-full',
    gridTv({ gap: props.gap }),
    props.columnClassName,
  );

  const rowClassName = classnames('flex-1', props.rowClassName);

  const className = classnames(
    'flex flex-col',
    props.className,
    gridTv({ gap: props.gap }),
  );

  return (
    <div className={className}>
      {props.items.length === 0 && renderEmpty()}
      {groups.map((items, index) => (
        <div key={`col-${index}`} className={columnClassName}>
          {items.map((item, index) => (
            <div key={`row-${index}`} className={rowClassName}>
              {props.renderItem(item)}
            </div>
          ))}
          {filling(items).map((item, index) => (
            <div key={`filling-${index}`} className={rowClassName} />
          ))}
        </div>
      ))}
    </div>
  );
}

function useGroups<T>(items: T[], cols: number) {
  const groups = React.useMemo(() => {
    const groups = [];
    for (let i = 0; i < items.length; i += cols) {
      groups.push(items.slice(i, i + cols));
    }
    return groups;
  }, [items, cols]);

  return groups;
}

function defaultRenderEmpty() {
  return (
    <div className="w-full h-[500px] flex items-center justify-center">
      <div>暂无数据</div>
    </div>
  );
}
