/**
 * Tests for the ArticleListPage feature component.
 *
 * Scope:
 *   1. List page component reads from the Query cache (no `useLoaderData`).
 *   2. Optimistic delete calls `deleteArticle`, removes the row from
 *      the local cache, and rolls back on error.
 *
 * The only mocked boundary is `@cms/server/articles`. The Query
 * client is real, the component is real, and the cache is asserted
 * directly via `queryClient.getQueryData`.
 */

import {
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { articlesListQueryOptions, deleteArticle } from '@cms/server/articles';

import { ArticleListPage } from './article-list';

const mockDelete = vi.fn();
const zDialogConfirm = vi.fn();

vi.mock('@cms/server/articles', async () => {
  const actual = await vi.importActual<typeof import('@cms/server/articles')>(
    '@cms/server/articles',
  );
  return {
    ...actual,
    deleteArticle: (...args: unknown[]) => mockDelete(...args),
  };
});

vi.mock('@cms/core/ui/workspace', () => ({
  PaginationWorkspace: ({
    title,
    page,
    pageSize,
    totalPages,
    operation,
    children,
  }: {
    title: string;
    page: number;
    pageSize: number;
    totalPages: number;
    operation?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div data-testid="pagination-workspace">
      <h1>{title}</h1>
      <div data-testid="pagination-info">
        {page}/{totalPages} (每页{pageSize}条)
      </div>
      {operation}
      {children}
    </div>
  ),
  Workspace: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('@zcat/ui', async () => {
  const actual = await vi.importActual<typeof import('@zcat/ui')>('@zcat/ui');
  return {
    ...actual,
    ZDialog: {
      confirm: (...args: unknown[]) => zDialogConfirm(...args),
    },
  };
});

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function seedList(queryClient: QueryClient) {
  queryClient.setQueryData(
    articlesListQueryOptions({ page: 1, pageSize: 10 }).queryKey,
    {
      data: [
        {
          id: 1,
          title: 'First Article',
          excerpt: 'first excerpt',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-02T00:00:00.000Z'),
          createByUserId: 1,
          publishAt: new Date('2024-01-03T00:00:00.000Z'),
        },
        {
          id: 2,
          title: 'Second Article',
          excerpt: 'second excerpt',
          createdAt: new Date('2024-02-01T00:00:00.000Z'),
          updatedAt: new Date('2024-02-02T00:00:00.000Z'),
          createByUserId: 1,
          publishAt: new Date('2024-02-03T00:00:00.000Z'),
        },
      ],
      totalPages: 1,
      page: 1,
      pageSize: 10,
      total: 2,
    },
  );
}

function renderList(queryClient: QueryClient = makeQueryClient()) {
  seedList(queryClient);

  const Capture = () => {
    useSuspenseQuery(articlesListQueryOptions({ page: 1, pageSize: 10 }));
    return null;
  };

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <Capture />
        <ArticleListPage
          page={1}
          pageSize={10}
          search={{ page: 1, pageSize: 10 }}
        />
      </QueryClientProvider>,
    ),
  };
}

beforeEach(() => {
  mockDelete.mockReset();
  zDialogConfirm.mockReset();
  zDialogConfirm.mockResolvedValue(true);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('ArticleListPage', () => {
  it('renders the list read from the Query cache', () => {
    renderList();

    expect(screen.getByText('First Article')).toBeInTheDocument();
    expect(screen.getByText('Second Article')).toBeInTheDocument();
    expect(screen.getByText('文章列表')).toBeInTheDocument();
    expect(screen.getByText('first excerpt')).toBeInTheDocument();
  });

  it('renders the empty state when the paginated list has no rows', () => {
    const queryClient = makeQueryClient();
    queryClient.setQueryData(
      articlesListQueryOptions({ page: 1, pageSize: 10 }).queryKey,
      {
        data: [],
        totalPages: 0,
        page: 1,
        pageSize: 10,
        total: 0,
      },
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ArticleListPage
          page={1}
          pageSize={10}
          search={{ page: 1, pageSize: 10 }}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText('暂无文章')).toBeInTheDocument();
  });

  it('optimistically removes the article on delete success', async () => {
    mockDelete.mockResolvedValueOnce(undefined);

    const { queryClient } = renderList();

    const options = articlesListQueryOptions({ page: 1, pageSize: 10 });

    await act(async () => {
      const buttons = screen.getAllByRole('button', { name: '删除' });
      (buttons[0] as HTMLButtonElement).click();
    });

    await waitFor(() => {
      const cacheAfter = queryClient.getQueryData(options.queryKey) as
        | { data: { id: number }[] }
        | undefined;
      expect(cacheAfter?.data.length).toBe(1);
      expect(cacheAfter?.data[0]?.id).toBe(2);
    });

    expect(mockDelete).toHaveBeenCalledWith({ data: { id: 1 } });
  });

  it('rolls back the optimistic delete when the mutation fails', async () => {
    mockDelete.mockRejectedValueOnce(new Error('网络异常'));

    const { queryClient } = renderList();

    const options = articlesListQueryOptions({ page: 1, pageSize: 10 });

    await act(async () => {
      const buttons = screen.getAllByRole('button', { name: '删除' });
      (buttons[0] as HTMLButtonElement).click();
    });

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith({ data: { id: 1 } });
    });

    await waitFor(() => {
      const cache = queryClient.getQueryData(options.queryKey) as
        | { data: { id: number }[] }
        | undefined;
      expect(cache?.data.length).toBe(2);
    });
  });
});
