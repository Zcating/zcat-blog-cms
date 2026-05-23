import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Keep wrapper tests focused on @zcat/ui behavior, not Radix internals.
vi.mock('@zcat/ui/shadcn', () => ({
  Avatar: React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >(({ children, ...props }, ref) =>
    React.createElement('div', { ref, ...props }, children),
  ),
  AvatarImage: React.forwardRef<
    HTMLImageElement,
    React.ImgHTMLAttributes<HTMLImageElement>
  >(({ ...props }, ref) => React.createElement('img', { ref, ...props })),
  AvatarFallback: React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement>
  >(({ children, ...props }, ref) =>
    React.createElement('span', { ref, ...props }, children),
  ),
}));

vi.mock('@zcat/ui/shadcn/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, React.ComponentProps<'button'>>(
    ({ children, asChild: _asChild, ...props }, ref) =>
      React.createElement(
        'button',
        { ref, type: 'button', ...props },
        children,
      ),
  ),
}));

vi.mock('@zcat/ui/shadcn/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  TooltipTrigger: ({
    children,
  }: {
    asChild?: boolean;
    children: React.ReactElement;
  }) => children,
  TooltipContent: ({
    children,
    align: _align,
    side: _side,
    sideOffset: _sideOffset,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) =>
    React.createElement('div', props, children),
}));
