import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Route } from './qrcode-generator';

function renderPage() {
  const Page = Route.options.component;
  if (!Page) throw new Error('route has no component');
  return render(<Page />);
}

function inputByPlaceholder(
  container: HTMLElement,
  placeholder: string,
): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>(
    `input[placeholder="${placeholder}"]`,
  );
  if (!input) throw new Error(`no input with placeholder ${placeholder}`);
  return input;
}

function qrForegroundPath(container: HTMLElement) {
  return container.querySelectorAll('svg[role="img"] path')[1];
}

function controlForLabel(container: HTMLElement, text: string) {
  const label = Array.from(container.querySelectorAll('label')).find(
    (node) => node.textContent === text,
  );
  if (!label) throw new Error(`no label ${text}`);
  const id = label.getAttribute('for');
  if (!id) throw new Error(`label ${text} has no htmlFor`);
  const control = Array.from(
    container.querySelectorAll<HTMLElement>('[id]'),
  ).find((node) => node.id === id);
  if (!control) throw new Error(`label ${text} has no control`);
  return control;
}

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('route component: /toolbox/qrcode-generator', () => {
  const consoleErrors: string[] = [];

  beforeEach(() => {
    consoleErrors.length = 0;
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      consoleErrors.push(args.map(String).join(' '));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function unknownHandlerWarnings() {
    return consoleErrors.filter((message) =>
      message.includes('Unknown event handler property'),
    );
  }

  it('renders a QR code without leaking any form prop onto a DOM node', () => {
    const { container } = renderPage();

    expect(container.querySelector('svg[role="img"]')).toBeInTheDocument();
    expect(unknownHandlerWarnings()).toEqual([]);
  });

  it('renders the QR code from the form defaults', () => {
    const { container } = renderPage();

    const paths = container.querySelectorAll('svg[role="img"] path');
    expect(paths).toHaveLength(2);
    expect(paths[0]?.getAttribute('fill')).toBe('#ffffff');
    expect(paths[1]?.getAttribute('d')).toBeTruthy();
  });

  it('gives every form field a real control instead of a bare wrapper', () => {
    const { container } = renderPage();

    for (const label of ['内容', '尺寸 (px)', '前景色', '背景色', '边距']) {
      const tag = controlForLabel(container, label).tagName;
      expect(['INPUT', 'BUTTON']).toContain(tag);
    }
  });

  it('delivers 前景色 to the QR code instead of dropping it on a wrapper', () => {
    const { container } = renderPage();

    fireEvent.change(inputByPlaceholder(container, '#000000'), {
      target: { value: '#ff0000' },
    });

    expect(qrForegroundPath(container)?.getAttribute('fill')).toBe('#ff0000');
    expect(unknownHandlerWarnings()).toEqual([]);
  });

  it('delivers 边距 to the QR code instead of dropping it on a wrapper', () => {
    const { container } = renderPage();
    const checkbox = container.querySelector<HTMLButtonElement>(
      'button[role="checkbox"]',
    );
    if (!checkbox) throw new Error('no checkbox rendered');

    expect(checkbox.getAttribute('data-state')).toBe('checked');
    fireEvent.click(checkbox);
    expect(checkbox.getAttribute('data-state')).toBe('unchecked');
    expect(unknownHandlerWarnings()).toEqual([]);
  });
});
