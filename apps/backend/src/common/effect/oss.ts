import { Effect } from 'effect';

import { ossService } from '../oss.service';

/**
 * Effect-side wrapper around the existing OSS service singleton.
 *
 * In tests the underlying `oss.service` module is replaced with a mock
 * via `vi.mock('../../../common/oss.service', ...)`; this service picks
 * up the mock at module load.
 */
export class OssService extends Effect.Service<OssService>()('OssService', {
  succeed: ossService,
}) {}
