/**
 * Tests for the Phase 3b user-info page.
 *
 * Public behavior seam (what the page is responsible for):
 *   - Reads the current user from the canonical
 *     `userInfoQueryOptions()` cache key (`['users', 'current']`).
 *   - Renders display + edit modes with the same fields and
 *     validation behaviour as the legacy implementation.
 *   - On save, calls the protected `updateCurrentUser` server
 *     function and invalidates the user-info query on success.
 *   - Shows a pending indicator while the mutation is in flight
 *     and surfaces an error message on failure (no silent retry).
 *
 * The page MUST NOT call any of the legacy `UserApi` / `OssAction`
 * surfaces; those are being retired. Only the `@cms/server/users`
 * server function is mocked here so the test pins the migration
 * contract.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { FormHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { userInfoQueryOptions, updateCurrentUser } from '@cms/server/users';

import UserInfo from './user-info';
import type { UserInfo as UserInfoType } from '@cms/server/users/users-helpers';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUpdateCurrentUser = vi.fn();

vi.mock('@cms/server/users', async () => {
  const actual =
    await vi.importActual<typeof import('@cms/server/users')>(
      '@cms/server/users',
    );
  return {
    ...actual,
    updateCurrentUser: (input: unknown) => mockUpdateCurrentUser(input),
  };
});

interface MockFormApi {
  instance: {
    reset: (values?: unknown) => void;
    handleSubmit: (fn: (values: unknown) => void) => () => void;
  };
  submit: (values?: unknown) => void;
}

type MockFormProps = FormHTMLAttributes<HTMLFormElement> & {
  form: MockFormApi;
  children: ReactNode;
};

type MockFormItemProps = HTMLAttributes<HTMLDivElement> & {
  name: string;
  label?: string;
  children?: ReactNode;
};

interface MockFormComponent {
  (props: MockFormProps): React.JSX.Element;
  useForm: () => MockFormApi;
  Item: (props: MockFormItemProps) => React.JSX.Element;
}

vi.mock('@zcat/ui', () => ({
  ZAvatar: ({ src, alt }: { src?: string; alt?: string }) => (
    <img data-testid="avatar" src={src} alt={alt} />
  ),
  ZInput: (props: Record<string, unknown>) => (
    <input data-testid="z-input" {...props} />
  ),
  ZTextarea: (props: Record<string, unknown>) => (
    <textarea data-testid="textarea" {...props} />
  ),
  ZImageUpload: (props: Record<string, unknown>) => (
    <div data-testid="image-upload" {...props} />
  ),
  Label: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <label className={className}>{children}</label>,
  Button: ({
    children,
    onClick,
    variant,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    disabled?: boolean;
  }) => (
    <button data-variant={variant} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
  createZForm: () => {
    const STUB_VALUES = {
      name: 'UpdatedAdmin',
      contact: { email: 'admin@test.com', github: 'admin' },
      occupation: 'Developer',
      avatar: '',
      aboutMe: 'About me',
      abstract: 'Abstract',
    };
    const FormComponent = Object.assign(
      ({ children, ...props }: MockFormProps) => (
        <form {...props}>{children}</form>
      ),
      {
        useForm: ({
          onSubmit,
        }: {
          onSubmit: (values: unknown) => void;
        }): MockFormApi => {
          return {
            instance: {
              reset: vi.fn(),
              handleSubmit: (fn: (values: unknown) => void) => () =>
                fn(STUB_VALUES),
            },
            // Mirror real behaviour: `form.submit` IS the
            // caller-supplied `onSubmit` (see create-z-form.tsx).
            submit: (values: unknown) => onSubmit(values),
          };
        },
        Item: ({ name, label, children, ...props }: MockFormItemProps) => (
          <div data-testid={`form-item-${name}`} {...props}>
            {label && <label>{label}</label>}
            {children}
          </div>
        ),
      },
    ) as MockFormComponent;
    return FormComponent;
  },
  useWatch: () => {},
  safeObjectURL: (url: string) => url,
}));

vi.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loading-spinner">loading</div>,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEED_USER: UserInfoType = {
  name: 'Admin',
  contact: { email: 'admin@test.com', github: 'admin' },
  occupation: 'Developer',
  avatar: '',
  aboutMe: 'About me',
  abstract: 'Abstract',
};

function renderPage(overrides: Partial<UserInfoType> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(userInfoQueryOptions().queryKey, {
    ...SEED_USER,
    ...overrides,
  });

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <UserInfo />
    </QueryClientProvider>,
  );

  return { ...utils, queryClient };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UserInfo page (Phase 3b)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads user data from the userInfoQueryOptions cache', () => {
    renderPage();

    expect(screen.getByText('个人资料')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('About me')).toBeInTheDocument();
    expect(screen.getByText('Abstract')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '编辑' })).toBeInTheDocument();
  });

  it('renders an empty/loading state when the query has no data', () => {
    // No seeded data; render inside a fresh QueryClient so the
    // page starts with a pending query.
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    // Provide a suspended-like state: keep the query pending by
    // not seeding it. The page should render the title and edit
    // affordance but no row values until data arrives.
    render(
      <QueryClientProvider client={queryClient}>
        <UserInfo />
      </QueryClientProvider>,
    );

    expect(screen.getByText('个人资料')).toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('switches to edit mode and shows the edit form', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: '编辑' }));

    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
    expect(screen.getByTestId('form-item-name')).toBeInTheDocument();
    expect(screen.getByTestId('form-item-contact.email')).toBeInTheDocument();
    expect(screen.getByTestId('form-item-contact.github')).toBeInTheDocument();
    expect(screen.getByTestId('form-item-occupation')).toBeInTheDocument();
    expect(screen.getByTestId('form-item-aboutMe')).toBeInTheDocument();
    expect(screen.getByTestId('form-item-abstract')).toBeInTheDocument();
  });

  it('returns to display mode on cancel', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: '编辑' }));
    fireEvent.click(screen.getByRole('button', { name: '取消' }));

    expect(screen.getByRole('button', { name: '编辑' })).toBeInTheDocument();
    expect(screen.queryByTestId('form-item-name')).not.toBeInTheDocument();
  });

  it('calls updateCurrentUser and updates the user query cache on save', async () => {
    const updated: UserInfoType = {
      ...SEED_USER,
      name: 'UpdatedAdmin',
    };
    mockUpdateCurrentUser.mockResolvedValueOnce(updated);

    const { queryClient } = renderPage();

    fireEvent.click(screen.getByRole('button', { name: '编辑' }));
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(mockUpdateCurrentUser).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(queryClient.getQueryData(userInfoQueryOptions().queryKey)).toEqual(
        updated,
      );
    });
  });

  it('does not retry the mutation on failure and surfaces an error message', async () => {
    mockUpdateCurrentUser.mockRejectedValueOnce(new Error('boom'));

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: '编辑' }));
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(mockUpdateCurrentUser).toHaveBeenCalledTimes(1);
    });

    // Mutation must NOT auto-retry.
    await waitFor(() => {
      expect(screen.getByText(/保存失败|更新失败|boom/)).toBeInTheDocument();
    });
  });

  it('exposes the canonical query key so consumers can subscribe', () => {
    // The page must NOT alter the cache key used by
    // `userInfoQueryOptions()`; the loader / `_cms` beforeLoad
    // also writes to this key. This guards against an accidental
    // rename in the future.
    const { queryClient } = renderPage();
    const cached = queryClient.getQueryCache().find({
      queryKey: ['users', 'current'],
    });
    expect(cached).toBeDefined();
  });
});
