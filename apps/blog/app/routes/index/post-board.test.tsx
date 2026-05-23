import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@zcat/ui', () => ({
  ZView: ({ children, className }: any) => <div className={className}>{children}</div>,
  StaggerReveal: ({ children, className }: any) => <div className={className}>{children}</div>,
  ZPagination: () => <div data-testid="pagination" />,
}));

vi.mock('react-router', () => ({
  Link: ({ to, children, className }: any) => <a href={to} className={className}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

vi.mock('@blog/apis', () => ({ ArticleApi: { getArticleList: vi.fn() } }));
vi.mock('@blog/common', () => ({ safePositiveNumber: (v: any, d: any) => typeof v === 'number' && v > 0 ? v : d }));
vi.mock('@blog/features', () => ({ PostExcerptCard: ({ value }: any) => <div>{value.title}</div> }));

import PostBoardPage from './post-board';

describe('PostBoardPage', () => {
  it('renders article list', () => {
    render(
      <PostBoardPage
        loaderData={{
          pagination: { data: [{ id: '1', title: 'Article 1' }], totalPages: 2, page: 1, pageSize: 10 },
          page: 1,
        }}
      />,
    );
    expect(screen.getByText('Article 1')).toBeInTheDocument();
  });
});
