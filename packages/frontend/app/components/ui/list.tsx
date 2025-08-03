import React from 'react';
import { classnames } from '../utils';

interface ListProps<T> {
  className?: string;
  contentContainerClassName?: string;
  data: T[];
  renderItem: (item: T) => React.ReactNode;
}

export function List<T>(props: ListProps<T>) {
  const { className, contentContainerClassName, data, renderItem } = props;
  return (
    <div className={className}>
      <div
        className={classnames(contentContainerClassName, 'flex flex-col gap-5')}
      >
        {data.map((item, index) => (
          <React.Fragment key={index}>{renderItem(item)}</React.Fragment>
        ))}
      </div>
    </div>
  );
}
