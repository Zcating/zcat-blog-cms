import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@zcat/ui', () => ({
  ZView: ({ children, className }: any) => <div className={className}>{children}</div>,
  ZMarkdown: ({ content }: any) => <div>{content}</div>,
  ZImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

vi.mock('react-router', () => ({ Link: ({ children }: any) => <a>{children}</a> }));

import PostBoardDetailPage from './post-board.id';

describe('PostBoardDetailPage', () => {
  it('renders article detail when loaded', () => {
    render(
      <PostBoardDetailPage
        loaderData={{
          article: { id: '1', title: 'My Post', content: '# Hello', excerpt: 'excerpt', publishAt: '2026-01-01T00:00:00.000Z', createdAt: '', updatedAt: '' },
        }}
      />,
    );
    expect(screen.getByText('My Post')).toBeInTheDocument();
  });
});
