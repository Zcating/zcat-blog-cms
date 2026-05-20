import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PostExcerptCard } from './post-excerpt-card';

describe('PostExcerptCard', () => {
  it('renders title, excerpt and formatted publish date', () => {
    render(
      <PostExcerptCard
        value={{
          id: '1',
          title: '第一篇文章',
          excerpt: '这里是摘要',
          createdAt: '2026-05-19T12:00:00.000Z',
          updatedAt: '2026-05-19T12:00:00.000Z',
          publishAt: '2026-05-19T12:00:00.000Z',
        }}
      />,
    );

    expect(screen.getByText('第一篇文章')).toBeInTheDocument();
    expect(screen.getByText('这里是摘要')).toBeInTheDocument();
    expect(screen.getByText('2026-05-19')).toBeInTheDocument();
  });
});
