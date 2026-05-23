import { describe, expect, it } from 'vitest';

import { MENU_OPTIONS } from './options';

describe('MENU_OPTIONS', () => {
  it('contains all expected navigation items', () => {
    const titles = MENU_OPTIONS.map((o) => o.title);
    expect(titles).toContain('首页');
    expect(titles).toContain('文章');
    expect(titles).toContain('相册');
    expect(titles).toContain('工具箱');
    expect(titles).toContain('AI 聊天');
    expect(titles).toContain('关于');
  });

  it('home option points to root path', () => {
    const home = MENU_OPTIONS.find((o) => o.to === '/');
    expect(home).toBeDefined();
  });
});
