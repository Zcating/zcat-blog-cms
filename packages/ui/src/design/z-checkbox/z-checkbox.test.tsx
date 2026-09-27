import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import zod from 'zod';

import { createZForm } from '../z-form/create-z-form';
import { ZCheckbox } from './z-checkbox';

const forwarded = vi.hoisted(() => ({
  props: [] as Record<string, unknown>[],
}));

vi.mock('@zcat/ui/shadcn/ui/checkbox', async () => {
  const React = await import('react');
  const Checkbox = React.forwardRef<
    HTMLButtonElement,
    {
      checked?: boolean;
      onCheckedChange?: (checked: boolean) => void;
      children?: React.ReactNode;
    }
  >(({ checked, onCheckedChange, children, ...props }, ref) => {
    forwarded.props.push(props);
    return React.createElement(
      'button',
      {
        ref,
        type: 'button',
        'data-state': checked ? 'checked' : 'unchecked',
        onClick: () => onCheckedChange?.(!checked),
        ...props,
      },
      children,
    );
  });
  Checkbox.displayName = 'MockCheckbox';

  return { Checkbox };
});

function lastForwardedProps(): Record<string, unknown> {
  return forwarded.props.at(-1) ?? {};
}

describe('ZCheckbox', () => {
  it('renders unchecked by default', () => {
    render(<ZCheckbox data-testid="cb" />);

    const cb = screen.getByTestId('cb');
    expect(cb).toBeInTheDocument();
  });

  it('renders checked when value is true', () => {
    render(<ZCheckbox value data-testid="cb" />);

    const cb = screen.getByTestId('cb');
    expect(cb.getAttribute('data-state')).toBe('checked');
  });

  it('calls onValueChange with true when clicked from unchecked', async () => {
    const onChange = vi.fn();
    render(<ZCheckbox onValueChange={onChange} data-testid="cb" />);

    await userEvent.click(screen.getByTestId('cb'));

    expect(onChange).toHaveBeenCalledWith(true);
  });
});

const TermsForm = createZForm({ agreed: zod.boolean() });

function TermsFormHarness({
  injected,
}: {
  injected?: Record<string, unknown>;
}) {
  const form = TermsForm.useForm({
    onSubmit: () => {},
    defaultValues: { agreed: false },
  });

  return (
    <TermsForm form={form}>
      <TermsForm.Item label="同意条款" name="agreed">
        <ZCheckbox
          data-testid="agreed"
          {...(injected as unknown as React.ComponentProps<typeof ZCheckbox>)}
        />
      </TermsForm.Item>
      <output data-testid="value">
        {String(form.instance.watch('agreed'))}
      </output>
    </TermsForm>
  );
}

describe('ZCheckbox 表单字段容器内的值级变更通道', () => {
  it('勾选后表单值同步跟随', async () => {
    render(<TermsFormHarness />);

    expect(screen.getByTestId('value')).toHaveTextContent('false');

    await userEvent.click(screen.getByTestId('agreed'));

    expect(screen.getByTestId('value')).toHaveTextContent('true');
  });

  it('注入的 DOM 事件级 onInput 不会被转发，值级通道仍然收到值', async () => {
    const domChannel = vi.fn();
    render(<TermsFormHarness injected={{ onInput: domChannel }} />);

    await userEvent.click(screen.getByTestId('agreed'));
    expect(screen.getByTestId('value')).toHaveTextContent('true');

    fireEvent.input(screen.getByTestId('agreed'));
    expect(domChannel).not.toHaveBeenCalled();
  });
});

describe('ZCheckbox 转发的 props', () => {
  it('表单字段容器注入的 DOM 事件级 onChange 不会进入转发的 props', () => {
    render(<TermsFormHarness />);

    const props = lastForwardedProps();
    expect(Object.keys(props)).toContain('onBlur');
    expect(Object.keys(props)).toContain('name');
    expect(Object.keys(props)).not.toContain('onChange');
    expect(Object.keys(props)).not.toContain('onInput');
  });

  it('调用方运行时注入的 onChange 与 onInput 都不会进入转发的 props', () => {
    const domChannel = vi.fn();
    const injected = {
      onChange: domChannel,
      onInput: domChannel,
    } as unknown as React.ComponentProps<typeof ZCheckbox>;
    render(<ZCheckbox data-testid="cb" {...injected} />);

    const props = lastForwardedProps();
    expect(Object.keys(props)).not.toContain('onChange');
    expect(Object.keys(props)).not.toContain('onInput');
  });
});

describe('ZCheckbox 通道归属', () => {
  it('调用方传入的 checked 不能覆盖组件自己的受控值', () => {
    const injected = {
      checked: true,
    } as unknown as React.ComponentProps<typeof ZCheckbox>;
    render(<ZCheckbox data-testid="cb" value={false} {...injected} />);

    const cb = screen.getByTestId('cb');
    expect(cb.getAttribute('data-state')).toBe('unchecked');
  });

  it('调用方传入的 onCheckedChange 不能覆盖组件自己的值级通道', async () => {
    const onValueChange = vi.fn();
    const domChannel = vi.fn();
    const injected = {
      onCheckedChange: domChannel,
    } as unknown as React.ComponentProps<typeof ZCheckbox>;
    render(
      <ZCheckbox
        data-testid="cb"
        onValueChange={onValueChange}
        {...injected}
      />,
    );

    await userEvent.click(screen.getByTestId('cb'));

    expect(onValueChange).toHaveBeenCalledWith(true);
    expect(domChannel).not.toHaveBeenCalled();
  });

  it('焦点通道 onBlur 仍然透传到 DOM', async () => {
    const onBlur = vi.fn();
    render(<ZCheckbox data-testid="cb" onBlur={onBlur} />);

    await userEvent.click(screen.getByTestId('cb'));
    await userEvent.tab();

    expect(onBlur).toHaveBeenCalled();
  });

  it('运行时传入的 onInput 被剔除，不会落到 DOM 上', () => {
    const domChannel = vi.fn();
    const injected = {
      onInput: domChannel,
    } as unknown as React.ComponentProps<typeof ZCheckbox>;
    render(<ZCheckbox data-testid="cb" {...injected} />);

    fireEvent.input(screen.getByTestId('cb'));

    expect(domChannel).not.toHaveBeenCalled();
  });
});

describe('ZCheckbox 公共 props', () => {
  it('不提供 DOM 事件级变更通道', () => {
    expectTypeOf<React.ComponentProps<typeof ZCheckbox>>().not.toHaveProperty(
      'onChange',
    );
    expectTypeOf<React.ComponentProps<typeof ZCheckbox>>().not.toHaveProperty(
      'onInput',
    );
    expectTypeOf<React.ComponentProps<typeof ZCheckbox>>().toHaveProperty(
      'onValueChange',
    );
  });

  it('保留焦点通道 onBlur', () => {
    expectTypeOf<React.ComponentProps<typeof ZCheckbox>>().toHaveProperty(
      'onBlur',
    );
  });
});
