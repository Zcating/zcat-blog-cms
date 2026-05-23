import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

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
