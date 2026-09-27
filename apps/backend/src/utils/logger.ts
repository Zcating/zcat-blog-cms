import pino from 'pino';

import { config } from '../common/config.service';

const isDev = config.nodeEnv !== 'production';

const pinoLogger = pino({
  level: config.logLevel || (isDev ? 'debug' : 'info'),
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        formatters: {
          level(label) {
            return { level: label };
          },
        },
      }),
});

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

/**
 * Thin wrapper around pino that accepts `unknown` error types and ad-hoc
 * object arguments — the same patterns that `console.log` / `console.error`
 * allow — while still delegating to pino for structured output and colors.
 */
export const logger = {
  info(...args: unknown[]): void {
    (pinoLogger.info as (...args: unknown[]) => void)(...args);
  },
  warn(...args: unknown[]): void {
    (pinoLogger.warn as (...args: unknown[]) => void)(...args);
  },
  debug(...args: unknown[]): void {
    (pinoLogger.debug as (...args: unknown[]) => void)(...args);
  },
  error(...args: unknown[]): void {
    const [first, second] = args;
    if (typeof first !== 'string') {
      (pinoLogger.error as (...args: unknown[]) => void)(...args);
      return;
    }
    if (second === undefined) {
      pinoLogger.error(first);
      return;
    }
    pinoLogger.error(toError(second), first);
  },
};
