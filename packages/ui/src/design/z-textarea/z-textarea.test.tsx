import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import zod from 'zod';

import { createZForm } from '../z-form/create-z-form';
import { ZTextarea } from './z-textarea';

describe('ZTextarea', () => {
  it('renders with placeholder', () => {
    render(<ZTextarea placeholder="请输入内容" />);

    expect(screen.getByPlaceholderText('请输入内容')).toBeInTheDocument();
  });

  it('displays the given value', () => {
    render(<ZTextarea value="hello" readOnly />);

    expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
  });

  it('calls onValueChange on user input', async () => {
    const onChange = vi.fn();
    render(<ZTextarea onValueChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox'), 'abc');

    expect(onChange).toHaveBeenCalledWith('abc');
  });

  it('forwards disabled attribute', () => {
    render(<ZTextarea data-testid="textarea" disabled />);

    expect(screen.getByTestId('textarea')).toBeDisabled();
  });
});

const RemarkForm = createZForm({ remark: zod.string() });

function RemarkFormHarness() {
  const form = RemarkForm.useForm({
    onSubmit: () => {},
    defaultValues: { remark: '' },
  });

  return (
    <RemarkForm form={form}>
      <RemarkForm.Item label="备注" name="remark">
        <ZTextarea data-testid="remark" />
      </RemarkForm.Item>
      <output data-testid="value">{form.instance.watch('remark')}</output>
    </RemarkForm>
  );
}

describe('ZTextarea 表单字段容器内的值级变更通道', () => {
  it('每次按键都通过值级通道上报，表单值同步跟随', async () => {
    render(<RemarkFormHarness />);

    const textarea = screen.getByTestId('remark');
    await userEvent.type(textarea, 'a');
    expect(screen.getByTestId('value')).toHaveTextContent('a');
    await userEvent.type(textarea, 'b');
    expect(screen.getByTestId('value')).toHaveTextContent('ab');
  });

  it('字段容器注入的 DOM 事件级通道不会接管上报，值级通道仍然收到值', async () => {
    const onValueChange = vi.fn();
    const domChannel = vi.fn();
    const injected = {
      onChange: domChannel,
    } as unknown as React.ComponentProps<typeof ZTextarea>;
    render(
      <ZTextarea
        data-testid="textarea"
        onValueChange={onValueChange}
        {...injected}
      />,
    );

    await userEvent.type(screen.getByTestId('textarea'), 'a');

    expect(onValueChange).toHaveBeenCalledWith('a');
    expect(domChannel).not.toHaveBeenCalled();
  });

  it('注入的 DOM 事件级 onInput 不会被转发，值级通道仍然收到值', async () => {
    const onValueChange = vi.fn();
    const domChannel = vi.fn();
    const injected = {
      onInput: domChannel,
    } as unknown as React.ComponentProps<typeof ZTextarea>;
    render(
      <ZTextarea
        data-testid="textarea"
        onValueChange={onValueChange}
        {...injected}
      />,
    );

    await userEvent.type(screen.getByTestId('textarea'), 'a');

    expect(onValueChange).toHaveBeenCalledWith('a');
    expect(domChannel).not.toHaveBeenCalled();
  });
});

describe('ZTextarea 公共 props', () => {
  it('不提供 DOM 事件级变更通道', () => {
    expectTypeOf<React.ComponentProps<typeof ZTextarea>>().not.toHaveProperty(
      'onChange',
    );
    expectTypeOf<React.ComponentProps<typeof ZTextarea>>().not.toHaveProperty(
      'onInput',
    );
    expectTypeOf<React.ComponentProps<typeof ZTextarea>>().toHaveProperty(
      'onValueChange',
    );
  });

  it('保留焦点通道 onBlur', () => {
    expectTypeOf<React.ComponentProps<typeof ZTextarea>>().toHaveProperty(
      'onBlur',
    );
  });
});
