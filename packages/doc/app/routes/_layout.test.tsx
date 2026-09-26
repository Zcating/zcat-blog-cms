/**
 * Pins the sidebar against `DOCUMENT_CONFIGURES`.
 *
 * The sidebar and the `/:component` loader read the same registry, so the
 * registry is the single source of truth for both. A migration that keeps the
 * routes but drops, duplicates or retargets a sidebar entry would leave every
 * page reachable by URL while breaking navigation, which no route-table
 * assertion can see. Scoped to `data-slot="sidebar-content"` so document
 * bodies cannot contribute links of their own.
 */

import { render, screen, waitFor } from '@testing-library/react';
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import { DOCUMENT_CONFIGURES } from '../docs';
import { routeTree } from '../routeTree.gen';

const CONFIGURED_URLS = Object.values(DOCUMENT_CONFIGURES).map(
  (configure) => `/${configure.to}`,
);

function renderSidebar() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/button'] }),
  });
  render(<RouterProvider router={router} />);
  return router;
}

async function sidebarLinks() {
  await screen.findByRole('link', { name: '@zcat/ui 文档' });
  const content = document.querySelector('[data-slot="sidebar-content"]');
  if (!content) {
    throw new Error('sidebar content region is missing');
  }
  return Array.from(content.querySelectorAll('a')).map((anchor) => ({
    href: anchor.getAttribute('href'),
    label: anchor.textContent,
  }));
}

describe('sidebar', () => {
  it('links every configured component to its own document URL', async () => {
    renderSidebar();

    const hrefs = (await sidebarLinks()).map((link) => link.href).sort();

    expect(hrefs).toEqual([...CONFIGURED_URLS].sort());
  });

  it('lists each configured component exactly once, with a label', async () => {
    renderSidebar();

    const links = await sidebarLinks();

    expect(new Set(links.map((link) => link.href)).size).toBe(links.length);
    for (const link of links) {
      expect(link.label?.trim()).toBeTruthy();
    }
  });

  it('routes every sidebar href back to the document route', async () => {
    const router = renderSidebar();
    const hrefs = (await sidebarLinks()).map((link) => link.href ?? '');

    for (const href of hrefs) {
      const [, , foundRoute] = router.getMatchedRoutes(href);
      expect(foundRoute?.id).toBe('/_layout/$component');
    }
  });

  it('keeps the document chrome mounted on a document URL', async () => {
    const router = renderSidebar();

    await waitFor(() => {
      expect(router.state.matches.map((match) => match.routeId)).toEqual([
        '__root__',
        '/_layout',
        '/_layout/$component',
      ]);
    });
    expect(screen.getByRole('link', { name: '@zcat/ui 文档' })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
