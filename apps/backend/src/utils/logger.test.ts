import { afterEach, describe, expect, it, vi } from 'vitest';

const mockPinoLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
}));

vi.mock('pino', () => ({
  default: () => mockPinoLogger,
}));

import { logger } from './logger';

describe('logger', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('info calls pinoLogger.info', () => {
    logger.info('test message');

    expect(mockPinoLogger.info).toHaveBeenCalledWith('test message');
  });

  it('info passes additional args to pino', () => {
    logger.info('test message', { extra: 'data' });

    expect(mockPinoLogger.info).toHaveBeenCalledWith('test message', {
      extra: 'data',
    });
  });

  it('warn calls pinoLogger.warn', () => {
    logger.warn('warning message');

    expect(mockPinoLogger.warn).toHaveBeenCalledWith('warning message');
  });

  it('debug calls pinoLogger.debug', () => {
    logger.debug('debug message');

    expect(mockPinoLogger.debug).toHaveBeenCalledWith('debug message');
  });

  it('error calls pinoLogger.error with Error when err is provided', () => {
    const err = new Error('something failed');
    logger.error('error message', err);

    expect(mockPinoLogger.error).toHaveBeenCalledWith(err, 'error message');
  });

  it('error calls pinoLogger.error with string when err is not an Error', () => {
    logger.error('error message', 'string error');

    expect(mockPinoLogger.error).toHaveBeenCalledWith(
      new Error('string error'),
      'error message',
    );
  });

  it('error calls pinoLogger.error without err argument', () => {
    logger.error('error message only');

    expect(mockPinoLogger.error).toHaveBeenCalledWith('error message only');
  });
});
