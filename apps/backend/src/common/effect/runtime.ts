import { Layer, ManagedRuntime } from 'effect';

import { OssService } from './oss';
import { PrismaService } from './prisma';

/**
 * Production application layer. Composes the singletons behind the
 * Effect service tags so that service code can `yield*` dependencies
 * instead of importing them directly.
 */
export const AppLayer = Layer.mergeAll(
  PrismaService.Default,
  OssService.Default,
);

/**
 * Long-lived runtime that holds the AppLayer. Route handlers and
 * middleware call `appRuntime.runPromise(effect)` to run a service
 * program with all dependencies satisfied.
 */
export const appRuntime = ManagedRuntime.make(AppLayer);
