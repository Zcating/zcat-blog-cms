import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ZSelect } from './z-select';

const options = [
  { value: 'a', label: '选项A' },
  { value: 'b', label: '选项B' },
];

describe('ZSelect', () => {
  it('renders options', () => {
    render(<ZSelect options={options} />);

    expect(screen.getByText('选项A')).toBeInTheDocument();
    expect(screen.getByText('选项B')).toBeInTheDocument();
  });

  it('renders placeholder text', () => {
    render(<ZSelect options={options} placeholder="请选择" />);

    expect(screen.getByText('请选择')).toBeInTheDocument();
  });
});
