import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ZButton } from './z-button';

describe('ZButton', () => {
  it('disables the button while loading', () => {
    render(<ZButton loading>提交</ZButton>);

    expect(screen.getByRole('button', { name: '提交' })).toBeDisabled();
  });

  it('renders tooltip content', () => {
    render(<ZButton tooltip="提示内容">按钮</ZButton>);

    expect(screen.getByRole('button', { name: '按钮' })).toBeInTheDocument();
  });
});
