import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockStatistic = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('../../../common/prisma.service', () => ({
  prismaService: { statistic: mockStatistic },
}));

import { logger } from '@backend/utils';
import { errorHandler } from '../../../middleware/error-handler';
import blogRoutes from './blog.route';

const createApp = () => {
  const app = new Hono();
  app.onError(errorHandler);
  app.route('/', blogRoutes);
  return app;
};

const browserPayload = {
  pagePath: '/posts/checksum-contract',
  pageTitle: 'Checksum Contract',
  referrer: '',
  browser: 'Chrome 120.0.0.0',
  os: 'macOS',
  device: 'Desktop',
  deviceId: 'fp-contract',
};

const browserDataHash = 'f2db8c88cc7b5676ba28117960984b3e';

const postVisit = (app: Hono, body: unknown, dataHash: string) =>
  app.request('/visitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Data-Hash': dataHash },
    body: JSON.stringify(body),
  });

describe('POST /visitor payload checksum', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('persists the visit when Data-Hash is the md5 of the seven browser fields', async () => {
    mockStatistic.create.mockResolvedValue({ id: 1 });

    const res = await postVisit(createApp(), browserPayload, browserDataHash);

    expect((await res.json()).code).toBe('0000');
    expect(mockStatistic.create).toHaveBeenCalledWith({
      data: {
        pagePath: '/posts/checksum-contract',
        pageTitle: 'Checksum Contract',
        browser: 'Chrome 120.0.0.0',
        os: 'macOS',
        device: 'Desktop',
        deviceId: 'fp-contract',
        ip: 'unknown',
        referrer: '',
      },
    });
  });

  it('does not persist the visit when the payload no longer matches Data-Hash', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

    const res = await postVisit(
      createApp(),
      { ...browserPayload, pagePath: '/posts/tampered' },
      browserDataHash,
    );

    expect((await res.json()).code).toBe('0000');
    expect(mockStatistic.create).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'payload_checksum_mismatch' }),
      expect.any(String),
    );
  });
});
