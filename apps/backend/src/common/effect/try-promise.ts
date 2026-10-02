import { Effect } from 'effect'

/**
 * Wrapper around `Effect.tryPromise` that preserves the original error
 * instead of wrapping it in an `UnknownException`. The explicit return
 * type is required so that `Effect.gen`'s R-channel inference sees
 * `never` inside generator scope (a `as Effect.Effect<...>` cast hides
 * it and collapses R to `unknown`).
 */
export const tryPromise = <A>(
  f: () => Promise<A>,
): Effect.Effect<A, Error, never> =>
  Effect.tryPromise({ try: f, catch: (e) => e as Error })