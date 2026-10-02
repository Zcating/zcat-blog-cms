import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Route } from './ip-lookup';

const DETAILS = {
  ip: '203.0.113.7',
  city: '杭州',
  region: '浙江',
  country_name: '中国',
  org: 'AS4134 CHINANET',
  timezone: 'Asia/Shanghai',
};

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as Response;
}

function skeletons() {
  return document.querySelectorAll('[data-slot="skeleton"]');
}

function renderPage() {
  const Page = Route.options.component;
  if (!Page) throw new Error('route has no component');
  return render(<Page />);
}

describe('route component: /toolbox/ip-lookup', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(jsonResponse(DETAILS));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stays pending for the whole 2s settle delay, then reaches a result state', async () => {
    renderPage();

    expect(skeletons().length).toBeGreaterThan(0);
    expect(screen.queryByText(DETAILS.ip)).not.toBeInTheDocument();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    expect(skeletons().length).toBeGreaterThan(0);
    expect(screen.queryByText(DETAILS.ip)).not.toBeInTheDocument();

    await waitFor(
      () => expect(screen.getByText(DETAILS.ip)).toBeInTheDocument(),
      { timeout: 4000 },
    );

    expect(skeletons()).toHaveLength(0);
    expect(screen.getByText('中国')).toBeInTheDocument();
    expect(screen.getByText('杭州')).toBeInTheDocument();
    expect(screen.getByText('浙江')).toBeInTheDocument();
  });

  it('clears the loading state on the ipify fallback and keeps the degraded copy', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ error: true, reason: 'rate limited' }),
      )
      .mockResolvedValueOnce(jsonResponse({ ip: '198.51.100.9' }));

    renderPage();

    await waitFor(
      () => expect(screen.getByText('198.51.100.9')).toBeInTheDocument(),
      { timeout: 4000 },
    );

    expect(skeletons()).toHaveLength(0);
    expect(
      screen.getByText('获取详细地理位置失败，仅显示 IP'),
    ).toBeInTheDocument();
  });

  it('clears the loading state when both lookups fail', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    renderPage();

    await waitFor(() => expect(skeletons()).toHaveLength(0), {
      timeout: 4000,
    });

    expect(screen.getByText('无法连接到 IP 查询服务')).toBeInTheDocument();
    expect(screen.getByText('--')).toBeInTheDocument();
  });
});
