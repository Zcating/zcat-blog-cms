/**
 * Pins the public URL contract of the documentation site.
 *
 * Only the two entry points the site advertises are asserted: `/` and
 * `/:component`. Both are nested under a single layout, so a migration that
 * drops either path, or renames the dynamic segment, fails here even if every
 * component still compiles.
 */

import { describe, expect, it } from 'vitest';

import routeConfig from './routes';

interface RouteEntry {
  index?: boolean;
  path?: string;
  children?: RouteEntry[];
}

const [layoutRoute] = routeConfig as unknown as RouteEntry[];

describe('route table', () => {
  it('nests both entry points under a single layout route', () => {
    expect(routeConfig).toHaveLength(1);
    expect(layoutRoute.children).toHaveLength(2);
  });

  it('serves the home page at /', () => {
    expect(layoutRoute.children?.some((entry) => entry.index)).toBe(true);
  });

  it('serves documents at the dynamic /:component segment', () => {
    expect(layoutRoute.children?.map((entry) => entry.path)).toContain(
      '/:component',
    );
  });
});
