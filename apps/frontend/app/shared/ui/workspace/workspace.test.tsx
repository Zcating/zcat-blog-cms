import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Workspace } from './workspace';

describe('Workspace', () => {
  it('应该渲染标题', () => {
    render(<Workspace title="测试标题">content</Workspace>);
    expect(screen.getByText('测试标题')).toBeInTheDocument();
  });

  it('应该渲染 children', () => {
    render(
      <Workspace title="Title">
        <span>child content</span>
      </Workspace>,
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('应该渲染 description（当提供时）', () => {
    render(
      <Workspace title="Title" description="描述文字">
        content
      </Workspace>,
    );
    expect(screen.getByText('描述文字')).toBeInTheDocument();
  });

  it('不应该渲染 description（当未提供时）', () => {
    render(<Workspace title="Title">content</Workspace>);
    expect(screen.queryByText('描述文字')).not.toBeInTheDocument();
  });

  it('应该渲染 operation（当提供时）', () => {
    render(
      <Workspace title="Title" operation={<button>操作按钮</button>}>
        content
      </Workspace>,
    );
    expect(screen.getByText('操作按钮')).toBeInTheDocument();
  });

  it('不应该渲染 operation（当未提供时）', () => {
    render(<Workspace title="Title">content</Workspace>);
    expect(screen.queryByText('操作按钮')).not.toBeInTheDocument();
  });

  it('应该同时渲染 description 和 operation', () => {
    render(
      <Workspace title="Title" description="描述" operation={<span>操作</span>}>
        content
      </Workspace>,
    );
    expect(screen.getByText('描述')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
