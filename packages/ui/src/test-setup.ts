import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Keep wrapper tests focused on @zcat/ui behavior, not Radix internals.
vi.mock('@zcat/ui/shadcn', async () => {
  const actual = await vi.importActual('@zcat/ui/shadcn');
  const MockAvatar = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >(({ children, ...props }, ref) =>
    React.createElement('div', { ref, ...props }, children),
  );
  MockAvatar.displayName = 'MockAvatar';

  const MockAvatarImage = React.forwardRef<
    HTMLImageElement,
    React.ImgHTMLAttributes<HTMLImageElement>
  >(({ ...props }, ref) => React.createElement('img', { ref, ...props }));
  MockAvatarImage.displayName = 'MockAvatarImage';

  const MockAvatarFallback = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement>
  >(({ children, ...props }, ref) =>
    React.createElement('span', { ref, ...props }, children),
  );
  MockAvatarFallback.displayName = 'MockAvatarFallback';

  const MockTextarea = React.forwardRef<
    HTMLTextAreaElement,
    React.TextareaHTMLAttributes<HTMLTextAreaElement>
  >(({ ...props }, ref) => React.createElement('textarea', { ref, ...props }));
  MockTextarea.displayName = 'MockTextarea';

  return {
    ...actual,
    Avatar: MockAvatar,
    AvatarImage: MockAvatarImage,
    AvatarFallback: MockAvatarFallback,
    Textarea: MockTextarea,
  };
});

vi.mock('@zcat/ui/shadcn/ui/button', () => {
  const MockButton = React.forwardRef<
    HTMLButtonElement,
    React.ComponentProps<'button'>
  >(({ children, asChild: _asChild, ...props }, ref) =>
    React.createElement('button', { ref, type: 'button', ...props }, children),
  );
  MockButton.displayName = 'MockButton';

  return {
    Button: MockButton,
    buttonVariants: vi.fn(() => ''),
  };
});

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

vi.mock('@zcat/ui/shadcn/ui/input', () => {
  const MockInput = React.forwardRef<
    HTMLInputElement,
    React.ComponentProps<'input'>
  >(({ ...props }, ref) => React.createElement('input', { ref, ...props }));
  MockInput.displayName = 'MockInput';

  return { Input: MockInput };
});

/** Checkbox context to wire checked state + change handler */
interface CheckboxCtx {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}
const CheckboxCtx_ = React.createContext<CheckboxCtx>({});

vi.mock('@zcat/ui/shadcn/ui/checkbox', () => {
  const MockCheckbox = React.forwardRef<
    HTMLButtonElement,
    { checked?: boolean; onCheckedChange?: (checked: boolean) => void }
  >(({ checked, onCheckedChange, children, ...props }, ref) =>
    React.createElement(
      CheckboxCtx_.Provider,
      { value: { checked, onCheckedChange } },
      React.createElement('button', {
        ref,
        type: 'button',
        'data-state': checked ? 'checked' : 'unchecked',
        onClick: () => onCheckedChange?.(!checked),
        ...props,
      }),
    ),
  );
  MockCheckbox.displayName = 'MockCheckbox';

  return { Checkbox: MockCheckbox };
});

/** Collapsible context to wire open state + change handler from parent to trigger */
interface CollapsibleCtx {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
const CollapsibleCtx_ = React.createContext<CollapsibleCtx>({});

vi.mock('@zcat/ui/shadcn/ui/collapsible', () => {
  const Collapsible = ({
    children,
    open,
    onOpenChange,
    ...props
  }: {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) =>
    React.createElement(
      CollapsibleCtx_.Provider,
      { value: { open, onOpenChange } },
      React.createElement(
        'div',
        { 'data-state': open ? 'open' : 'closed', ...props },
        children,
      ),
    );

  const CollapsibleTrigger = ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLButtonElement>) => {
    const ctx = React.useContext(CollapsibleCtx_);
    return React.createElement(
      'button',
      {
        type: 'button',
        onClick: () => ctx.onOpenChange?.(!ctx.open),
        ...props,
      },
      children,
    );
  };

  const CollapsibleContent = ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) =>
    React.createElement('div', props, children);

  return { Collapsible, CollapsibleTrigger, CollapsibleContent };
});

/** Toggle-group context to wire value + change handler */
interface TGCtx {
  value?: string;
  onValueChange?: (value: string) => void;
}
const TGCtx_ = React.createContext<TGCtx>({});

vi.mock('@zcat/ui/shadcn/ui/toggle-group', () => {
  const ToggleGroup = ({
    children,
    value,
    onValueChange,
    ...props
  }: {
    children?: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
  }) =>
    React.createElement(
      TGCtx_.Provider,
      { value: { value, onValueChange } },
      React.createElement(
        'div',
        { 'data-slot': 'toggle-group', ...props },
        children,
      ),
    );

  const ToggleGroupItem = ({
    children,
    value: itemValue,
    ...props
  }: {
    children?: React.ReactNode;
    value?: string;
  }) => {
    const ctx = React.useContext(TGCtx_);
    const isSelected = ctx.value === itemValue;
    return React.createElement(
      'button',
      {
        type: 'button',
        'data-state': isSelected ? 'on' : 'off',
        onClick: () => ctx.onValueChange?.(itemValue ?? ''),
        ...props,
      },
      children,
    );
  };

  return { ToggleGroup, ToggleGroupItem };
});

// Mock GSAP animation library used by FoldAnimation
vi.mock('gsap', () => ({
  gsap: {
    to: vi.fn(),
    from: vi.fn(),
    fromTo: vi.fn(),
    set: vi.fn(),
    registerPlugin: vi.fn(),
  },
  default: {},
}));

vi.mock('gsap/MotionPathPlugin', () => ({
  MotionPathPlugin: {},
}));

vi.mock('@gsap/react', () => ({
  useGSAP: ({ scope }: { scope?: React.RefObject<HTMLElement> }) => {
    // Intentionally empty — animation logic is not exercised in unit tests.
  },
}));

vi.mock('@zcat/ui/shadcn/ui/select', () => ({
  Select: ({ children, ...props }: any) =>
    React.createElement('div', { 'data-slot': 'select', ...props }, children),
  SelectTrigger: ({ children, ...props }: any) =>
    React.createElement(
      'button',
      { type: 'button', 'data-slot': 'select-trigger', ...props },
      children,
    ),
  SelectValue: ({ placeholder }: { placeholder?: string }) =>
    placeholder ? React.createElement('span', null, placeholder) : null,
  SelectContent: ({ children, ...props }: any) =>
    React.createElement(
      'div',
      { 'data-slot': 'select-content', ...props },
      children,
    ),
  SelectGroup: ({ children, ...props }: any) =>
    React.createElement(
      'div',
      { 'data-slot': 'select-group', ...props },
      children,
    ),
  SelectItem: ({ children, value, ...props }: any) =>
    React.createElement(
      'button',
      { 'data-slot': 'select-item', 'data-value': value, ...props },
      children,
    ),
}));

vi.mock('@zcat/ui/shadcn/ui/navigation-menu', () => {
  const MockNavigationMenuLink = React.forwardRef<
    HTMLAnchorElement,
    {
      asChild?: boolean;
      children?: React.ReactNode;
    } & React.AnchorHTMLAttributes<HTMLAnchorElement>
  >(({ asChild: _asChild, children, ...props }, ref) =>
    React.createElement('a', { ref, ...props }, children),
  );
  MockNavigationMenuLink.displayName = 'MockNavigationMenuLink';

  return {
    NavigationMenu: ({ children, ...props }: any) =>
      React.createElement(
        'nav',
        { 'data-slot': 'navigation-menu', ...props },
        children,
      ),
    NavigationMenuList: ({ children, ...props }: any) =>
      React.createElement(
        'ul',
        { 'data-slot': 'navigation-menu-list', ...props },
        children,
      ),
    NavigationMenuItem: ({ children, ...props }: any) =>
      React.createElement(
        'li',
        { 'data-slot': 'navigation-menu-item', ...props },
        children,
      ),
    NavigationMenuLink: MockNavigationMenuLink,
  };
});

// window.matchMedia polyfill for hooks that depend on viewport size
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
