import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ZCollapsible } from './z-collapsible';

describe('ZCollapsible', () => {
  it('renders trigger and content', () => {
    render(
      <ZCollapsible trigger={<span>展开</span>}>
        <p>内容区域</p>
      </ZCollapsible>,
    );

    expect(screen.getByText('展开')).toBeInTheDocument();
    expect(screen.getByText('内容区域')).toBeInTheDocument();
  });

  it('starts closed by default', () => {
    render(
      <ZCollapsible trigger={<span>展开</span>}>
        <p>内容</p>
      </ZCollapsible>,
    );

    const collapsible = screen.getByText('展开').closest('[data-state]');
    expect(collapsible?.getAttribute('data-state')).toBe('closed');
  });

  it('starts open when defaultOpen is true', () => {
    render(
      <ZCollapsible defaultOpen trigger={<span>展开</span>}>
        <p>内容</p>
      </ZCollapsible>,
    );

    const collapsible = screen.getByText('展开').closest('[data-state]');
    expect(collapsible?.getAttribute('data-state')).toBe('open');
  });

  it('toggles state on trigger click in uncontrolled mode', async () => {
    render(
      <ZCollapsible trigger={<span>展开</span>}>
        <p>内容</p>
      </ZCollapsible>,
    );

    const trigger = screen.getByText('展开');
    await userEvent.click(trigger);

    const collapsible = trigger.closest('[data-state]');
    expect(collapsible?.getAttribute('data-state')).toBe('open');
  });

  it('calls onOpenChange in controlled mode', async () => {
    const onOpenChange = vi.fn();
    render(
      <ZCollapsible
        open={false}
        onOpenChange={onOpenChange}
        trigger={<span>展开</span>}
      >
        <p>内容</p>
      </ZCollapsible>,
    );

    await userEvent.click(screen.getByText('展开'));

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
