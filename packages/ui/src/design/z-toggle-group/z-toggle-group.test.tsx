import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ZToggleGroup } from './z-toggle-group';

const options = [
  { value: 'a', label: '选项A' },
  { value: 'b', label: '选项B' },
  { value: 'c', label: '选项C' },
];

describe('ZToggleGroup', () => {
  it('renders all options', () => {
    render(<ZToggleGroup type="single" options={options} />);

    expect(screen.getByText('选项A')).toBeInTheDocument();
    expect(screen.getByText('选项B')).toBeInTheDocument();
    expect(screen.getByText('选项C')).toBeInTheDocument();
  });

  it('highlights the selected value', () => {
    render(<ZToggleGroup type="single" options={options} value="b" />);

    const btnB = screen.getByText('选项B');
    expect(btnB.getAttribute('data-state')).toBe('on');
  });

  it('calls onValueChange when an option is clicked', async () => {
    const onChange = vi.fn();
    render(
      <ZToggleGroup type="single" options={options} onValueChange={onChange} />,
    );

    await userEvent.click(screen.getByText('选项A'));

    expect(onChange).toHaveBeenCalledWith('a');
  });
});
