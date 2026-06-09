import { Effect } from 'effect';

import { prismaService } from '../prisma.service';

/**
 * Effect-side wrapper around the existing Prisma client singleton.
 *
 * The singleton is captured at module load. In tests the singleton file is
 * mocked via `vi.mock('../../../common/prisma.service', ...)` so the
 * `succeed` field picks up the mock and the service layer never touches
 * the real client.
 */
export class PrismaService extends Effect.Service<PrismaService>()(
  'PrismaService',
  {
    succeed: prismaService,
  },
) {}
