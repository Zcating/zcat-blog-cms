// @vitest-environment node

/**
 * Regression guard for the TanStack Start SSR boundary: `@zcat/ui` has no
 * `ssr.noExternal` escape hatch under Nitro, so any component or hook that
 * touches a browser global at module-evaluation or render time would throw
 * during SSR and 500 every page. The documentation site renders `ZSidebar`,
 * `ZMarkdown` and the whole `ExecutableCodeBlock` tree on the server, so this
 * spec runs in the `node` environment (not jsdom) precisely so an accidental
 * `window`/`document`/`matchMedia` reference fails here instead of in
 * production.
 *
 * Must run in `node` env: jsdom defines `window`/`document`, which would mask
 * exactly the failure this test exists to catch.
 */
import { ZMarkdown, ZSidebar, ZView, useMount } from '@zcat/ui';
import { renderToString } from 'react-dom/server';

import { ExecutableCodeBlock } from '../features';

import buttonMarkdown from '../docs/button.md?raw';

const options = [{ label: '通用', value: 'button' }];

function Probe() {
  useMount(() => {
    throw new Error('useMount callback must never run during SSR');
  });

  return (
    <ZSidebar
      options={options}
      renderItem={(item) => <span>{item.label}</span>}
    >
      <ZView className="p-4">
        <ZMarkdown content={buttonMarkdown} />
        <ExecutableCodeBlock>{'const a = 1;'}</ExecutableCodeBlock>
      </ZView>
    </ZSidebar>
  );
}

describe('@zcat/ui server rendering', () => {
  it('has no browser globals in scope', () => {
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');
  });

  it('renders the documented layout chrome and markdown to HTML', () => {
    const html = renderToString(<Probe />);

    expect(html).toContain('data-slot="sidebar-content"');
    expect(html).toContain('data-slot="markdown"');
    expect(html).toContain('<h1');
    expect(html).toContain('Button 按钮');
  });

  it('renders the typescript-demo block on the server', () => {
    const html = renderToString(
      <ZView>
        <ExecutableCodeBlock>{'const a = 1;'}</ExecutableCodeBlock>
      </ZView>,
    );

    expect(html).toContain('代码预览（仅展示）');
    expect(html).toContain('typescript');
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
