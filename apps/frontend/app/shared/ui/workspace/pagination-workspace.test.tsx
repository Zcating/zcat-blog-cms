import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import { PaginationWorkspace } from './pagination-workspace';

interface ZViewProps {
  children?: React.ReactNode;
  className?: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface ZSelectProps {
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  className?: string;
}

interface ZPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

vi.mock('@zcat/ui', () => ({
  ZView: ({ children, className }: ZViewProps) => (
    <div className={className}>{children}</div>
  ),
  ZSelect: ({ value, options, onValueChange, className }: ZSelectProps) => (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={className}
      data-testid="page-size-select"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
  ZPagination: ({ page, totalPages, onPageChange }: ZPaginationProps) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Prev
      </button>
      <span>
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </div>
  ),
}));

const mockOnPageChange = vi.fn();
const mockOnPageSizeChange = vi.fn();

vi.mock('@cms/core/hooks', () => ({
  usePaginationAction: () => ({
    onPageChange: mockOnPageChange,
    onPageSizeChange: mockOnPageSizeChange,
  }),
  PAGE_SIZE_OPTIONS: [
    { value: '10', label: '每页 10 条' },
    { value: '20', label: '每页 20 条' },
    { value: '50', label: '每页 50 条' },
  ],
}));

describe('PaginationWorkspace', () => {
  it('应该渲染标题和子节点', () => {
    render(
      <PaginationWorkspace
        title="文章列表"
        page={1}
        pageSize={10}
        totalPages={5}
      >
        <span>文章内容</span>
      </PaginationWorkspace>,
    );
    expect(screen.getByText('文章列表')).toBeInTheDocument();
    expect(screen.getByText('文章内容')).toBeInTheDocument();
  });

  it('应该渲染分页控件和每页条数选择', () => {
    render(
      <PaginationWorkspace title="Title" page={1} pageSize={10} totalPages={5}>
        content
      </PaginationWorkspace>,
    );
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByTestId('page-size-select')).toBeInTheDocument();
  });

  it('应该显示正确的分页信息', () => {
    render(
      <PaginationWorkspace title="Title" page={2} pageSize={20} totalPages={10}>
        content
      </PaginationWorkspace>,
    );
    expect(screen.getByText('2 / 10')).toBeInTheDocument();
  });

  it('应该渲染可选的 description', () => {
    render(
      <PaginationWorkspace
        title="Title"
        page={1}
        pageSize={10}
        totalPages={5}
        description="这是描述"
      >
        content
      </PaginationWorkspace>,
    );
    expect(screen.getByText('这是描述')).toBeInTheDocument();
  });
});
