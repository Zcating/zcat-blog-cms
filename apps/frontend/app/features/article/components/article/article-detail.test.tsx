/**
 * Tests for the ArticleDetailPage feature component.
 *
 * Scope:
 *   1. Detail component reads from the Query cache (no `useLoaderData`).
 *   2. Edit button navigation.
 *   3. Back button navigation.
 *
 * The only mocked boundary is `@cms/server/articles`. The Query
 * client is real, the component is real.
 */

import {
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { articleDetailQueryOptions } from '@cms/server/articles';

import { ArticleDetailPage } from './article-detail';

const navigateMock = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function seedDetail(queryClient: QueryClient, id = 7) {
  queryClient.setQueryData(articleDetailQueryOptions({ id }).queryKey, {
    id,
    title: 'Detail Title',
    excerpt: 'Detail excerpt',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    createByUserId: 1,
    publishAt: new Date('2024-01-03T00:00:00.000Z'),
  });
}

function renderDetail(id = 7, queryClient = makeQueryClient()) {
  seedDetail(queryClient, id);

  const Capture = () => {
    useSuspenseQuery(articleDetailQueryOptions({ id }));
    return null;
  };

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <Capture />
        <ArticleDetailPage articleId={id} />
      </QueryClientProvider>,
    ),
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('ArticleDetailPage', () => {
  it('renders article fields read from the Query cache', () => {
    renderDetail();

    expect(screen.getByText('文章详情')).toBeInTheDocument();
    expect(screen.getByText(/Detail Title/)).toBeInTheDocument();
    expect(screen.getByText(/Detail excerpt/)).toBeInTheDocument();
  });

  it('renders the Markdown content preview placeholder when content is absent', () => {
    renderDetail();

    // Detail schema does not include `content`, so the viewer falls
    // back to a placeholder. The list schema omits content/tags; this
    // is the schema contract asserted by the test.
    expect(screen.getByText('暂无内容')).toBeInTheDocument();
  });

  it('exposes an edit button that routes to the editor', () => {
    renderDetail(7);

    const editBtn = screen.getByRole('button', { name: '编辑' });
    editBtn.click();

    expect(navigateMock).toHaveBeenCalledWith({
      to: '/articles/edit',
      search: { id: 7 },
    });
  });

  it('exposes a back button that routes to the list', () => {
    renderDetail(7);

    const backBtn = screen.getByRole('button', { name: '返回' });
    backBtn.click();

    expect(navigateMock).toHaveBeenCalledWith({ to: '/articles' });
  });
});
