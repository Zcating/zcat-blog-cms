import { describe, expect, it } from 'vitest';

import { createRouter, type AnyRoute } from '@tanstack/react-router';

import { routeTree } from '../../routeTree.gen';

function findRouteById(id: string): AnyRoute {
  let found: AnyRoute | undefined;
  const walk = (route: AnyRoute) => {
    if (route.id === id) found = route;
    for (const child of route.children ?? []) walk(child);
  };
  walk(routeTree);
  if (!found) throw new Error(`no route with id ${id}`);
  return found;
}

describe('the about page', () => {
  it('resolves at /about through the _blog layout route', () => {
    const [, , found] = createRouter({ routeTree }).getMatchedRoutes('/about');

    expect(found?.id).toBe('/_blog/about');
    expect(found?.fullPath).toBe('/about');
  });

  it('declares its own head meta', () => {
    const head = findRouteById('/_blog/about').options.head?.({} as never) as
      | { meta?: Array<Record<string, string>> }
      | undefined;

    expect(head?.meta).toContainEqual({ title: '关于' });
  });
});
