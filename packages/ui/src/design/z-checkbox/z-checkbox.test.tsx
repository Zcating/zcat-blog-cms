import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import zod from 'zod';

import { createZForm } from '../z-form/create-z-form';
import { ZCheckbox } from './z-checkbox';

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

function TermsFormHarness() {
  const form = TermsForm.useForm({
    onSubmit: () => {},
    defaultValues: { agreed: false },
  });

  return (
    <TermsForm form={form}>
      <TermsForm.Item label="同意条款" name="agreed">
        <ZCheckbox data-testid="agreed" />
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
});

describe('ZCheckbox 公共 props', () => {
  it('不提供 DOM 事件级变更通道', () => {
    expectTypeOf<React.ComponentProps<typeof ZCheckbox>>().not.toHaveProperty(
      'onChange',
    );
    expectTypeOf<React.ComponentProps<typeof ZCheckbox>>().toHaveProperty(
      'onValueChange',
    );
  });
});
