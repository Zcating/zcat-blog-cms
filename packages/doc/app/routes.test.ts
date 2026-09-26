/**
 * Pins the public URL contract of the documentation site.
 *
 * Only the two entry points the site advertises are asserted: `/` and
 * `/:component`. Both are nested under a single layout, so a migration that
 * drops either path, or renames the dynamic segment, fails here even if every
 * component still compiles.
 */

import { createRouter } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import { routeTree } from './routeTree.gen';

const router = createRouter({ routeTree });

describe('route table', () => {
  it('nests both entry points under a single layout route', () => {
    const [matchedRoutes] = router.getMatchedRoutes('/button');

    expect(router.routeTree.children).toHaveLength(1);
    expect(matchedRoutes.map((route) => route.id)).toEqual([
      '__root__',
      '/_layout',
      '/_layout/$component',
    ]);
  });

  it('serves the home page at /', () => {
    const [matchedRoutes] = router.getMatchedRoutes('/');

    expect(matchedRoutes.at(-1)?.id).toBe('/_layout/');
  });

  it('serves documents at the dynamic /:component segment', () => {
    const [, params, foundRoute] = router.getMatchedRoutes('/z-sidebar');

    expect(foundRoute?.id).toBe('/_layout/$component');
    expect(params).toEqual({ component: 'z-sidebar' });
  });
});
