import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ZGrid } from './z-grid';

describe('ZGrid', () => {
  const items = ['A', 'B', 'C', 'D'];

  it('renders all items via renderItem', () => {
    render(
      <ZGrid
        cols={2}
        items={items}
        renderItem={(item) => <span>{item}</span>}
      />,
    );

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('renders empty state when items is empty', () => {
    render(
      <ZGrid cols={2} items={[]} renderItem={(item) => <span>{item}</span>} />,
    );

    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  it('renders custom empty state', () => {
    render(
      <ZGrid
        cols={2}
        items={[]}
        renderItem={(item) => <span>{item}</span>}
        renderEmpty={() => <div>自定义空状态</div>}
      />,
    );

    expect(screen.getByText('自定义空状态')).toBeInTheDocument();
  });
});
