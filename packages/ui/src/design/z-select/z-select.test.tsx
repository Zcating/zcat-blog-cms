import { render, screen } from '@testing-library/react';
import type React from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';

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

describe('ZSelect 公共 props', () => {
  it('只提供值级变更通道', () => {
    expectTypeOf<React.ComponentProps<typeof ZSelect>>().not.toHaveProperty(
      'onChange',
    );
    expectTypeOf<React.ComponentProps<typeof ZSelect>>().toHaveProperty(
      'onValueChange',
    );
  });
});
