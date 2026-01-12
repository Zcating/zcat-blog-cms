import React from 'react';

export function useGroups<T>(items: T[], cols: number) {
  const groups = React.useMemo(() => {
    const groups = [];
    for (let i = 0; i < items.length; i += cols) {
      groups.push(items.slice(i, i + cols));
    }
    return groups;
  }, [items, cols]);

  return groups;
}
