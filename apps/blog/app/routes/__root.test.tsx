// @vitest-environment node

/**
 * Regression guard for the TanStack Start SSR boundary: `@zcat/ui` has no
 * `ssr.noExternal` escape hatch under Nitro, so any component or hook that
 * touches a browser global at module-evaluation or render time would throw
 * during SSR and 500 every page. This spec runs in the `node` environment
 * (not jsdom) precisely so an accidental `window`/`document`/`matchMedia`
 * reference fails here instead of in production.
 *
 * Must run in `node` env: jsdom defines `window`/`document`, which would mask
 * exactly the failure this test exists to catch.
 */
import {
  ZButton,
  ZMarkdown,
  ZSidebar,
  ZView,
  useMount,
  useSidebar,
  type ZSidebarOption,
} from '@zcat/ui';
import { renderToString } from 'react-dom/server';

const options: ZSidebarOption[] = [
  { label: 'plain', value: '/a' },
  { label: 'group', children: [{ label: 'child', value: '/a/b' }] },
];

const markdown = [
  '# heading',
  '',
  'paragraph with **bold** and `code`.',
  '',
  '| col | val |',
  '| --- | --- |',
  '| a | 1 |',
].join('\n');

function Probe() {
  useMount(() => {
    throw new Error('useMount callback must never run during SSR');
  });

  return (
    <ZSidebar
      className="h-full w-full"
      options={options}
      currentValue="/a"
      renderItem={(item) => <span>{item.label}</span>}
    >
      <ZView className="p-4">
        <ZButton size="lg">probe-button</ZButton>
        <SidebarStateProbe />
        <ZMarkdown content={markdown} />
      </ZView>
    </ZSidebar>
  );
}

function SidebarStateProbe() {
  const sidebar = useSidebar();
  return <ZView>{`probe-view:${sidebar.state}`}</ZView>;
}

describe('@zcat/ui server rendering', () => {
  it('has no browser globals in scope', () => {
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');
  });

  it('renders ZSidebar, ZView, ZButton and ZMarkdown to HTML', () => {
    const html = renderToString(<Probe />);

    expect(html).toContain('probe-button');
    expect(html).toContain('probe-view:expanded');
    expect(html).toContain('data-slot="markdown"');
    expect(html).toContain('<h1');
    expect(html).toContain('<table');
    expect(html).toContain('child');
  });

  it('does not run useMount callbacks on the server', () => {
    const onMount = vi.fn();
    function MountOnly() {
      useMount(onMount);
      return <ZView>mounted</ZView>;
    }

    expect(renderToString(<MountOnly />)).toContain('mounted');
    expect(onMount).not.toHaveBeenCalled();
  });
});
