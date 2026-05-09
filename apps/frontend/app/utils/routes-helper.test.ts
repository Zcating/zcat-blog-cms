import { describe, it, expect } from 'vitest';

import { expandRoutes } from './routes-helper';

describe('expandRoutes', () => {
  it('展开单个路由', () => {
    const routes = {
      list: {
        path: 'articles',
        module: 'features/article/routes/articles.tsx',
      },
    };
    const result = expandRoutes(routes);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('articles');
  });

  it('展开多个路由', () => {
    const routes = {
      list: {
        path: 'articles',
        module: 'features/article/routes/articles.tsx',
      },
      detail: {
        path: 'articles/:id',
        module: 'features/article/routes/articles.id.tsx',
      },
    };
    const result = expandRoutes(routes);
    expect(result).toHaveLength(2);
    expect(result[0].path).toBe('articles');
    expect(result[1].path).toBe('articles/:id');
  });

  it('支持空对象', () => {
    const result = expandRoutes({});
    expect(result).toHaveLength(0);
  });

  it('保持路由顺序', () => {
    const routes = {
      second: { path: 'second', module: 'second.tsx' },
      first: { path: 'first', module: 'first.tsx' },
      third: { path: 'third', module: 'third.tsx' },
    };
    const result = expandRoutes(routes);
    expect(result.map((r) => r.path)).toEqual(['second', 'first', 'third']);
  });
});
