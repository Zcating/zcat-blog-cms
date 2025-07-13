import React from 'react';
import { classnames } from '../utils';
interface GridProps<T> {
  columnClassName?: string;
  rowClassName?: string;
  cols: number;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
}

export function Grid<T>(props: GridProps<T>) {
  const renderEmpty = props.renderEmpty ?? defaultRenderEmpty;

  const cols = props.cols ?? 2;
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
    'flex w-full px-4 gap-5',
    props.columnClassName,
  );

  const rowClassName = classnames('flex-1', props.rowClassName);

  return (
    <div className="flex flex-col gap-5">
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
