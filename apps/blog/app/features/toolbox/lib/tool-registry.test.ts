import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { TOOL_REGISTRY } from './tool-registry';

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
