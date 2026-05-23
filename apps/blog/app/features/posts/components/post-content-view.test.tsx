import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PostContentView } from './post-content-view';

vi.mock('@zcat/ui', () => ({
  ZView: ({ children, className }: any) => (
    <div className={className} data-testid="zview">
      {children}
    </div>
  ),
  ZMarkdown: ({ content }: any) => (
    <div data-testid="zmarkdown">{content}</div>
  ),
}));

vi.mock('@blog/common', () => ({
  stringDateFormat: (d: string) => d?.substring(0, 10) ?? '',
}));

describe('PostContentView', () => {
  it('renders title, publish date and content', () => {
    render(
      <PostContentView
        value={{
          id: '1',
          title: 'Test Article',
          excerpt: 'excerpt',
          content: '# Hello',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          publishAt: '2026-01-15T00:00:00.000Z',
        }}
      />,
    );

    expect(screen.getByText('Test Article')).toBeInTheDocument();
    expect(screen.getByText('2026-01-15')).toBeInTheDocument();
    expect(screen.getByTestId('zmarkdown')).toHaveTextContent('# Hello');
  });
});
