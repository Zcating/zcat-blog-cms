import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { navigateMock, notificationErrorMock, subscribeErrorEventMock } =
  vi.hoisted(() => ({
    navigateMock: vi.fn(),
    notificationErrorMock: vi.fn(),
    subscribeErrorEventMock: vi.fn(),
  }));

vi.mock('@zcat/ui', () => ({
  ZNotification: {
    error: notificationErrorMock,
  },
}));

vi.mock('./api', () => ({
  HttpClient: {
    subscribeErrorEvent: subscribeErrorEventMock,
  },
}));

vi.mock('./api/context/request-context', () => ({
  initServerStorage: vi.fn(),
  runWithRequest: vi.fn(),
}));

vi.mock('./auth/auth-middleware', () => ({
  authMiddleware: vi.fn(),
}));

vi.mock('react-router', () => ({
  isRouteErrorResponse: vi.fn(() => false),
  Links: () => null,
  Meta: () => null,
  Outlet: () => null,
  Scripts: () => null,
  ScrollRestoration: () => null,
  useNavigate: () => navigateMock,
}));

import { Layout } from './root';

describe('Root Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('在 Unauthorized 时跳转登录，普通错误仅提示', () => {
    let errorHandler: ((error: Error) => void) | undefined;
    subscribeErrorEventMock.mockImplementation((callback) => {
      errorHandler = callback;
      return vi.fn();
    });
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const useEffectSpy = vi
      .spyOn(React, 'useEffect')
      .mockImplementation((effect: React.EffectCallback) => {
        effect();
      });

    Layout({ children: <div>content</div> });

    expect(subscribeErrorEventMock).toHaveBeenCalledOnce();

    errorHandler?.(new Error('Unauthorized'));
    expect(navigateMock).toHaveBeenCalledWith('/login');
    expect(notificationErrorMock).not.toHaveBeenCalled();

    vi.clearAllMocks();

    errorHandler?.(new Error('Request failed'));
    expect(navigateMock).not.toHaveBeenCalled();
    expect(notificationErrorMock).toHaveBeenCalledWith('Request failed');

    useEffectSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});
