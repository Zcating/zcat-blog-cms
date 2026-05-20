import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loginMock, navigateMock } = vi.hoisted(() => ({
  loginMock: vi.fn().mockResolvedValue(undefined),
  navigateMock: vi.fn(),
}));

vi.mock('@cms/api', () => ({
  AuthApi: {
    login: loginMock,
  },
}));

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router');

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
        username: 'admin',
        password: '123456',
      });
    });

    expect(navigateMock).toHaveBeenCalledWith('/dashboard');
  });
});
