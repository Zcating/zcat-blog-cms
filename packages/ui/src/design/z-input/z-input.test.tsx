import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ZInput } from './z-input';

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
