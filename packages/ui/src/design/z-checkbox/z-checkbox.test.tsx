import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

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
