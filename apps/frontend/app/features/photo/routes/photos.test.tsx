import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

// --- mocks ---

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
}

interface ZGridProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  columnClassName?: string;
}

interface ZViewProps {
  children?: React.ReactNode;
  className?: string;
}

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  onMouseOver?: () => void;
  onMouseLeave?: () => void;
}

interface PaginationWorkspaceProps {
  title: string;
  children?: React.ReactNode;
  page: number;
  totalPages: number;
  pageSize: number;
  operation?: React.ReactNode;
}

interface PhotoCardLike {
  name: string;
}

vi.mock('@zcat/ui', () => ({
  ZButton: ({ children, onClick }: ButtonProps) => (
    <button onClick={onClick}>{children}</button>
  ),
  Card: ({ children, className, onMouseOver, onMouseLeave }: CardProps) => (
    <div
      className={className}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  ),
  CardContent: ({ children, className }: ZViewProps) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: ZViewProps) => (
    <div className={className}>{children}</div>
  ),
  ZDialog: { confirm: vi.fn() },
  ZGrid: <T,>({ items, renderItem, columnClassName }: ZGridProps<T>) => (
    <div data-testid="ZGrid" data-column-class={columnClassName}>
      {items.map((item, i) => (
        <div key={i} data-testid="ZGrid-item">
          {renderItem(item)}
        </div>
      ))}
    </div>
  ),
  ZView: ({ children, className }: ZViewProps) => (
    <div className={className}>{children}</div>
  ),
  ZImagePreload: ({ alt }: { alt: string }) => <img alt={alt} />,
  safeNumber: (v: unknown, d: number) => {
    const n = Number(v);
    return Number.isNaN(n) ? d : n;
  },
}));

vi.mock('@cms/core', () => ({
  createConstNumber: () => ({
    label: '',
    type: 'constant',
    valueType: 'number',
  }),
  createImageUpload: (label: string) => ({
    label,
    type: 'imageUpload',
    valueType: 'file',
  }),
  createInput: (label: string) => ({
    label,
    type: 'input',
    valueType: 'string',
  }),
  createSchemaForm: () => () => vi.fn(),
  OssAction: {
    createPhoto: vi.fn(),
    updatePhoto: vi.fn(),
  },
  PaginationWorkspace: ({
    title,
    children,
    page,
    totalPages,
    pageSize,
    operation,
  }: PaginationWorkspaceProps) => (
    <div data-testid="PaginationWorkspace">
      <div>{title}</div>
      <div data-testid="pagination-info">
        {page}/{totalPages} (每页{pageSize}条)
      </div>
      {operation}
      {children}
    </div>
  ),
  PhotoCard: ({ data }: { data: PhotoCardLike }) => (
    <div data-testid="PhotoCard">{data.name}</div>
  ),
  useOptimisticArray: (initialData: any[]) => [initialData, vi.fn(), vi.fn()],
}));

vi.mock('@cms/api', () => ({
  PhotosApi: {
    getPhotos: vi.fn(),
    deletePhoto: vi.fn(),
  },
}));

// --- import after mocks ---

import Photos from './photos';

function createMockRouteProps(
  paginationOverrides: Record<string, unknown> = {},
) {
  return {
    loaderData: {
      pagination: {
        data: [],
        page: 1,
        pageSize: 20,
        totalPages: 0,
        ...paginationOverrides,
      },
    },
    params: {},
    matches: [],
    actionData: undefined,
    errors: undefined,
  };
}

const mockPhotos = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `照片 ${i + 1}`,
  url: `https://example.com/photos/${i + 1}.jpg`,
  thumbnailUrl: `https://example.com/photos/thumbnails/${i + 1}.jpg`,
  albumId: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

describe('Photos 页面组件', () => {
  it('应该在没有照片时显示空状态', () => {
    render(<Photos {...(createMockRouteProps() as any)} />);
    expect(screen.getByText('照片')).toBeInTheDocument();
    expect(screen.getByText('暂无照片')).toBeInTheDocument();
  });

  it('应该在有照片时渲染照片列表', () => {
    render(
      <Photos
        {...(createMockRouteProps({
          data: mockPhotos.slice(0, 20),
          page: 1,
          pageSize: 20,
          totalPages: 2,
        }) as any)}
      />,
    );
    expect(screen.getByText('照片')).toBeInTheDocument();
    expect(screen.getByTestId('ZGrid')).toBeInTheDocument();
    expect(screen.getByText('照片 1')).toBeInTheDocument();
    expect(screen.getByText('照片 20')).toBeInTheDocument();
    expect(screen.queryByText('暂无照片')).not.toBeInTheDocument();
  });

  it('应该在第二页显示正确的分页信息', () => {
    render(
      <Photos
        {...(createMockRouteProps({
          data: mockPhotos.slice(20, 25),
          page: 2,
          pageSize: 20,
          totalPages: 2,
        }) as any)}
      />,
    );
    expect(screen.getByText('照片 21')).toBeInTheDocument();
    expect(screen.getByText('照片 25')).toBeInTheDocument();
    expect(screen.getByText('照片 21')).toBeInTheDocument();
  });

  it('应该有新增按钮', () => {
    render(<Photos {...(createMockRouteProps() as any)} />);
    expect(screen.getByText('新增')).toBeInTheDocument();
  });
});
