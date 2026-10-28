import { render, screen } from '@testing-library/react';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  );
  return {
    ...actual,
    Link: ({
      children,
      to,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

import { TOOL_REGISTRY } from '../lib';
import { ToolboxHomePage } from './toolbox-home';

const EXPECTED_TOOLS = [
  { name: 'Markdown 转 HTML', path: '/toolbox/markdown-to-html' },
  { name: 'JSON 查看器', path: '/toolbox/json-viewer' },
  { name: 'IP 查询', path: '/toolbox/ip-lookup' },
  { name: 'Hash 计算', path: '/toolbox/hash' },
  { name: 'AES 加解密', path: '/toolbox/aes-crypto' },
  { name: 'RSA 加解密', path: '/toolbox/rsa-crypto' },
  { name: '图片和 Base64 互转', path: '/toolbox/base64-to-image' },
  { name: '二维码生成', path: '/toolbox/qrcode-generator' },
  { name: '身份证生成', path: '/toolbox/id-card-generator' },
];

const ROUTE_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../routes/toolbox',
);

describe('TOOL_REGISTRY', () => {
  it('lists every toolbox tool once, in display order', () => {
    expect(
      TOOL_REGISTRY.map((tool) => ({ name: tool.name, path: tool.path })),
    ).toEqual(EXPECTED_TOOLS);
  });

  it('gives every tool a distinct one-sentence description', () => {
    const descriptions = TOOL_REGISTRY.map((tool) => tool.description);

    expect(new Set(descriptions).size).toBe(TOOL_REGISTRY.length);
    for (const description of descriptions) {
      expect(description.split('。').filter(Boolean)).toHaveLength(1);
    }
  });

  it('points every path at an existing toolbox route file', () => {
    for (const tool of TOOL_REGISTRY) {
      const routeFile = resolve(
        ROUTE_DIR,
        `${tool.path.replace('/toolbox/', '')}.tsx`,
      );

      expect(
        existsSync(routeFile),
        `${tool.path} 没有对应的路由文件 ${routeFile}`,
      ).toBe(true);
    }
  });
});

describe('ToolboxHomePage', () => {
  it('renders one card per registered tool, in registry order', () => {
    render(<ToolboxHomePage />);

    const links = screen.getAllByRole('link');

    expect(links).toHaveLength(EXPECTED_TOOLS.length);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      TOOL_REGISTRY.map((tool) => tool.path),
    );
    expect(screen.getAllByText('立即使用')).toHaveLength(EXPECTED_TOOLS.length);
  });

  it('links every card to its own toolbox path', () => {
    render(<ToolboxHomePage />);

    for (const tool of TOOL_REGISTRY) {
      expect(screen.getByText(tool.name).closest('a')).toHaveAttribute(
        'href',
        tool.path,
      );
    }
  });

  it('renders no page heading', () => {
    render(<ToolboxHomePage />);

    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });
});
