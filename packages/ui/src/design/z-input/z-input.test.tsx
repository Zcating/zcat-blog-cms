import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import zod from 'zod';

import { createZForm } from '../z-form/create-z-form';
import { ZInput } from './z-input';

const forwarded = vi.hoisted(() => ({
  props: [] as Record<string, unknown>[],
}));

vi.mock('@zcat/ui/shadcn/ui/input', async () => {
  const React = await import('react');
  const Input = React.forwardRef<
    HTMLInputElement,
    React.ComponentProps<'input'>
  >(({ ...props }, ref) => {
    forwarded.props.push(props);
    return React.createElement('input', { ref, ...props });
  });
  Input.displayName = 'MockInput';

  return { Input };
});

function lastForwardedProps(): Record<string, unknown> {
  return forwarded.props.at(-1) ?? {};
}

describe('ZInput', () => {
  it('renders with placeholder', () => {
    render(<ZInput placeholder="请输入" />);

    expect(screen.getByPlaceholderText('请输入')).toBeInTheDocument();
  });

  it('displays the given value', () => {
    render(<ZInput value="hello" readOnly />);

    expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
  });

  it('calls onValueChange on user input', async () => {
    const onChange = vi.fn();
    render(<ZInput onValueChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox'), 'a');

    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('forwards additional html attributes', () => {
    render(<ZInput data-testid="input" disabled />);

    expect(screen.getByTestId('input')).toBeDisabled();
  });
});

const UserForm = createZForm({ username: zod.string() });

function UserFormHarness() {
  const form = UserForm.useForm({
    onSubmit: () => {},
    defaultValues: { username: '' },
  });

  return (
    <UserForm form={form}>
      <UserForm.Item label="用户名" name="username">
        <ZInput data-testid="username" />
      </UserForm.Item>
      <output data-testid="value">{form.instance.watch('username')}</output>
    </UserForm>
  );
}

describe('ZInput 表单字段容器内的值级变更通道', () => {
  it('每次按键都通过值级通道上报，表单值同步跟随', async () => {
    render(<UserFormHarness />);

    const input = screen.getByTestId('username');
    await userEvent.type(input, 'a');
    expect(screen.getByTestId('value')).toHaveTextContent('a');
    await userEvent.type(input, 'b');
    expect(screen.getByTestId('value')).toHaveTextContent('ab');
    await userEvent.type(input, 'c');
    expect(screen.getByTestId('value')).toHaveTextContent('abc');
  });

  it('字段容器注入的 DOM 事件级通道不会接管上报，值级通道仍然收到值', async () => {
    const onValueChange = vi.fn();
    const domChannel = vi.fn();
    const injected = {
      onChange: domChannel,
    } as unknown as React.ComponentProps<typeof ZInput>;
    render(
      <ZInput
        data-testid="input"
        onValueChange={onValueChange}
        {...injected}
      />,
    );

    await userEvent.type(screen.getByTestId('input'), 'a');

    expect(onValueChange).toHaveBeenCalledWith('a');
    expect(domChannel).not.toHaveBeenCalled();
  });

  it('注入的 DOM 事件级 onInput 不会被转发，值级通道仍然收到值', async () => {
    const onValueChange = vi.fn();
    const domChannel = vi.fn();
    const injected = {
      onInput: domChannel,
    } as unknown as React.ComponentProps<typeof ZInput>;
    render(
      <ZInput
        data-testid="input"
        onValueChange={onValueChange}
        {...injected}
      />,
    );

    await userEvent.type(screen.getByTestId('input'), 'a');

    expect(onValueChange).toHaveBeenCalledWith('a');
    expect(domChannel).not.toHaveBeenCalled();
  });
});

describe('ZInput 转发的 props', () => {
  it('表单字段容器注入的 props 到达元素，但 DOM 事件级通道被剔除', () => {
    render(<UserFormHarness />);

    const props = lastForwardedProps();
    expect(Object.keys(props)).toContain('onBlur');
    expect(Object.keys(props)).toContain('name');
    expect(Object.keys(props)).not.toContain('onInput');
    expect(typeof props.onChange).toBe('function');
  });

  it('调用方运行时注入的 onChange 不是元素上的 change 通道', () => {
    const onValueChange = vi.fn();
    const domChannel = vi.fn();
    render(
      <ZInput
        data-testid="input"
        onValueChange={onValueChange}
        {...({ onChange: domChannel } as unknown as React.ComponentProps<
          typeof ZInput
        >)}
      />,
    );

    const props = lastForwardedProps();
    expect(Object.keys(props)).not.toContain('onInput');
    expect(props.onChange).not.toBe(domChannel);

    (props.onChange as (event: { target: { value: string } }) => void)({
      target: { value: 'z' },
    });
    expect(onValueChange).toHaveBeenCalledWith('z');
    expect(domChannel).not.toHaveBeenCalled();
  });
});

describe('ZInput 公共 props', () => {
  it('不提供 DOM 事件级变更通道', () => {
    expectTypeOf<React.ComponentProps<typeof ZInput>>().not.toHaveProperty(
      'onChange',
    );
    expectTypeOf<React.ComponentProps<typeof ZInput>>().not.toHaveProperty(
      'onInput',
    );
    expectTypeOf<React.ComponentProps<typeof ZInput>>().toHaveProperty(
      'onValueChange',
    );
  });

  it('保留焦点通道 onBlur', () => {
    expectTypeOf<React.ComponentProps<typeof ZInput>>().toHaveProperty(
      'onBlur',
    );
  });
});
