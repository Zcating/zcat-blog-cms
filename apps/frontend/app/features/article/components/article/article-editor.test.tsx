/**
 * Tests for the ArticleEditorPage feature component.
 *
 * Scope:
 *   1. Editor reads initial article from the Query cache (no `useLoaderData`).
 *   2. Save submits to `createArticle` or `updateArticle` depending on `id`.
 *   3. Validation errors block submission.
 *
 * The only mocked boundary is `@cms/server/articles`. The Query
 * client is real, the component is real.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  articleDetailQueryOptions,
  createArticle,
  updateArticle,
} from '@cms/server/articles';
import { articleTagsListQueryOptions } from '@cms/server/article-tags';

import { ArticleEditorPage } from './article-editor';

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const navigateMock = vi.fn();

vi.mock('@cms/server/articles', async () => {
  const actual = await vi.importActual<typeof import('@cms/server/articles')>(
    '@cms/server/articles',
  );
  return {
    ...actual,
    createArticle: (...args: unknown[]) => mockCreate(...args),
    updateArticle: (...args: unknown[]) => mockUpdate(...args),
  };
});

vi.mock('@cms/server/article-tags', async () => {
  const actual = await vi.importActual<
    typeof import('@cms/server/article-tags')
  >('@cms/server/article-tags');
  return {
    ...actual,
    listArticleTagsServerFn: () => vi.fn(),
  };
});

vi.mock('@cms/core/ui/markdown-editor', () => ({
  // Strip out the real `md-editor-rt` so the test does not pull in
  // its toolbar (which exposes its own "保存" button and confuses
  // the `getByRole('button', { name: '保存' })` queries).
  MarkdownEditor: () => <div data-testid="markdown-editor-stub" />,
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function seedTags(queryClient: QueryClient) {
  queryClient.setQueryData(articleTagsListQueryOptions().queryKey, [
    {
      id: 10,
      name: 'tech',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    },
  ]);
}

function renderEditor(
  options: { id?: number } = {},
  queryClient: QueryClient = makeQueryClient(),
) {
  if (options.id) {
    queryClient.setQueryData(
      articleDetailQueryOptions({ id: options.id }).queryKey,
      {
        id: options.id,
        title: 'Existing',
        excerpt: 'existing excerpt',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        createByUserId: 1,
        publishAt: new Date('2024-01-03T00:00:00.000Z'),
      },
    );
  }
  seedTags(queryClient);

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ArticleEditorPage id={options.id} />
      </QueryClientProvider>,
    ),
  };
}

beforeEach(() => {
  mockCreate.mockReset();
  mockUpdate.mockReset();
  navigateMock.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('ArticleEditorPage', () => {
  it('renders the create form when no id is provided', () => {
    renderEditor();

    expect(screen.getByPlaceholderText('请输入文章标题')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入文章摘要')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
  });

  it('renders the edit form seeded with the existing article when id is provided', () => {
    renderEditor({ id: 7 });

    const titleInput = screen.getByPlaceholderText(
      '请输入文章标题',
    ) as HTMLInputElement;
    expect(titleInput.value).toBe('Existing');
  });

  it('blocks submit when title is empty', async () => {
    renderEditor();

    const titleInput = screen.getByPlaceholderText(
      '请输入文章标题',
    ) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: '' } });
    });

    const submitBtn = screen.getByRole('button', { name: '保存' });
    await act(async () => {
      submitBtn.click();
    });

    await waitFor(() => {
      expect(screen.getByText('文章标题不能为空')).toBeInTheDocument();
    });

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('calls createArticle when saving a new article', async () => {
    mockCreate.mockResolvedValueOnce({
      id: 11,
      title: 'New',
      excerpt: 'new excerpt',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      createByUserId: 1,
      publishAt: new Date('2024-01-03T00:00:00.000Z'),
    });

    renderEditor();

    const titleInput = screen.getByPlaceholderText(
      '请输入文章标题',
    ) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'New Title' } });
    });

    const excerptInput = screen.getByPlaceholderText(
      '请输入文章摘要',
    ) as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(excerptInput, { target: { value: 'New excerpt' } });
    });

    const submitBtn = screen.getByRole('button', { name: '保存' });
    await act(async () => {
      submitBtn.click();
    });

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
  });

  it('calls updateArticle when saving an existing article', async () => {
    mockUpdate.mockResolvedValueOnce({
      id: 7,
      title: 'Updated',
      excerpt: 'existing excerpt',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      createByUserId: 1,
      publishAt: new Date('2024-01-03T00:00:00.000Z'),
    });

    renderEditor({ id: 7 });

    const submitBtn = screen.getByRole('button', { name: '保存' });
    await act(async () => {
      submitBtn.click();
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  it('navigates back to list on cancel', () => {
    renderEditor();

    const cancelBtn = screen.getByRole('button', { name: '取消' });
    cancelBtn.click();

    expect(navigateMock).toHaveBeenCalledWith({ to: '/articles' });
  });
});

// Keeps the import live for tree-shake analysis of the public surface.
void createArticle;
