import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockUpdateUserInfo = vi.fn();

let optimisticState: Record<string, unknown> = {};
const setOptimisticMock = vi.fn();
const commitOptimisticMock = vi.fn();

vi.mock('@cms/core', () => ({
  useOptimisticObject: () => [
    optimisticState,
    setOptimisticMock,
    commitOptimisticMock,
  ],
  Workspace: ({
    title,
    operation,
    children,
  }: {
    title: string;
    operation?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div data-testid="workspace">
      <h1>{title}</h1>
      {operation && <div data-testid="workspace-operation">{operation}</div>}
      {children}
    </div>
  ),
  OssAction: {
    updateUserInfo: (...args: unknown[]) => mockUpdateUserInfo(...args),
  },
}));

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
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
  }) => (
    <button data-variant={variant} onClick={onClick}>
      {children}
    </button>
  ),
  createZForm: () => {
    const FormComponent = ({
      children,
      className,
    }: {
      form: Record<string, unknown>;
      children: React.ReactNode;
      className?: string;
    }) => <form className={className}>{children}</form>;
    FormComponent.displayName = 'FormComponent';
    FormComponent.useForm = () => ({
      instance: { reset: vi.fn(), handleSubmit: (fn: () => void) => fn },
      submit: vi.fn(),
    });
    FormComponent.Item = ({
      name,
      label,
      children,
    }: {
      name: string;
      label: string;
      children: React.ReactNode;
    }) => (
      <div data-testid={`form-item-${name}`}>
        <label>{label}</label>
        {children}
      </div>
    );
    FormComponent.Item.displayName = 'FormComponentItem';
    return FormComponent;
  },
  useWatch: () => {},
  safeObjectURL: (url: string) => url,
}));

vi.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loading-spinner">loading</div>,
}));

import UserInfo from './user-info';

interface MockRouteComponentProps {
  loaderData: Record<string, unknown>;
}

const createMockProps = (
  overrides: Record<string, unknown> = {},
): MockRouteComponentProps => ({
  loaderData: {
    userInfo: {
      name: 'Admin',
      contact: { email: 'admin@test.com', github: 'admin' },
      occupation: 'Developer',
      avatar: '',
      aboutMe: 'About me',
      abstract: 'Abstract',
    },
    ...overrides,
  },
});

describe('UserInfo Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    optimisticState = {
      name: 'Admin',
      contact: { email: 'admin@test.com', github: 'admin' },
      occupation: 'Developer',
      avatar: '',
      aboutMe: 'About me',
      abstract: 'Abstract',
    };
  });

  it('renders user info in display mode', () => {
    const props = createMockProps();
    render(<UserInfo {...(props as Route.ComponentProps)} />);

    expect(screen.getByText('个人资料')).toBeDefined();
    expect(screen.getByText('Admin')).toBeDefined();
    expect(screen.getByText('admin@test.com')).toBeDefined();
    expect(screen.getByText('admin')).toBeDefined();
    expect(screen.getByText('Developer')).toBeDefined();
    expect(screen.getByText('About me')).toBeDefined();
    expect(screen.getByText('Abstract')).toBeDefined();
    expect(screen.getByText('编辑')).toBeDefined();
  });

  it('switches to edit mode on edit button click', () => {
    const props = createMockProps();
    render(<UserInfo {...(props as Route.ComponentProps)} />);

    fireEvent.click(screen.getByText('编辑'));

    expect(screen.getByText('保存')).toBeDefined();
    expect(screen.getByText('取消')).toBeDefined();
    expect(screen.getByTestId('form-item-name')).toBeDefined();
    expect(screen.getByTestId('form-item-contact.email')).toBeDefined();
    expect(screen.getByTestId('form-item-contact.github')).toBeDefined();
    expect(screen.getByTestId('form-item-occupation')).toBeDefined();
    expect(screen.getByTestId('form-item-aboutMe')).toBeDefined();
    expect(screen.getByTestId('form-item-abstract')).toBeDefined();
  });

  it('renders save button click', async () => {
    mockUpdateUserInfo.mockResolvedValueOnce({
      name: 'UpdatedName',
      contact: { email: 'admin@test.com', github: 'admin' },
      occupation: 'Developer',
      avatar: '',
      aboutMe: 'About me',
      abstract: 'Abstract',
    });

    const props = createMockProps();
    render(<UserInfo {...(props as Route.ComponentProps)} />);

    expect(screen.getByText('编辑')).toBeDefined();
    fireEvent.click(screen.getByText('编辑'));
    expect(screen.getByText('保存')).toBeDefined();
    fireEvent.click(screen.getByText('保存'));
  });

  it('shows loading spinner while saving', () => {
    optimisticState = { ...optimisticState, loading: true };

    const props = createMockProps();
    render(<UserInfo {...(props as Route.ComponentProps)} />);

    expect(screen.getByTestId('loading-spinner')).toBeDefined();
  });

  it('switches back to display mode on cancel', () => {
    const props = createMockProps();
    render(<UserInfo {...(props as Route.ComponentProps)} />);

    fireEvent.click(screen.getByText('编辑'));
    fireEvent.click(screen.getByText('取消'));

    expect(screen.getByText('编辑')).toBeDefined();
    expect(screen.queryByTestId('form-item-name')).toBeNull();
  });
});
