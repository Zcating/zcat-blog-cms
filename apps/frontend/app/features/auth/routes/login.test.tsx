import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loginMock, navigateMock } = vi.hoisted(() => ({
  loginMock: vi.fn().mockResolvedValue({ code: '0000', message: '登录成功' }),
  navigateMock: vi.fn(),
}));

vi.mock('@cms/server/auth', () => ({
  login: loginMock,
}));

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  );

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import LoginPage from './login';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits username and password then navigates to dashboard', async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('用户名'), {
      target: { value: 'admin' },
    });
    fireEvent.change(screen.getByLabelText('密码'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        data: { username: 'admin', password: '123456' },
      });
    });

    expect(navigateMock).toHaveBeenCalledWith({ to: '/dashboard' });
  });
});
