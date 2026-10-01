import { pathToFileURL } from 'node:url';

import { Client } from 'minio';

import { config } from './common/config.service';

const LOG_PREFIX = '[bootstrap-oss]';
const DEFAULT_ATTEMPTS = 30;
const DEFAULT_INITIAL_DELAY_MS = 1_000;
const DEFAULT_MAX_DELAY_MS = 10_000;

export interface OssBucketClient {
  bucketExists(bucket: string): Promise<boolean>;
  makeBucket(bucket: string): Promise<void>;
  setBucketPolicy(bucket: string, policy: string): Promise<void>;
  getBucketPolicy(bucket: string): Promise<string>;
}

export interface RetryPolicy {
  readonly attempts?: number;
  readonly initialDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
}

export interface BootstrapOptions extends RetryPolicy {
  readonly client: OssBucketClient;
  readonly bucket: string;
  readonly target: string;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function mentions(value: unknown, needle: string): boolean {
  return Array.isArray(value) ? value.includes(needle) : value === needle;
}

function allowsEveryone(principal: unknown): boolean {
  if (principal === '*') return true;
  if (typeof principal !== 'object' || principal === null) return false;
  return mentions((principal as { AWS?: unknown }).AWS, '*');
}

function grantsPublicRead(policy: string, bucket: string): boolean {
  let document: { Statement?: unknown };
  try {
    document = JSON.parse(policy) as { Statement?: unknown };
  } catch {
    return false;
  }
  const statements = Array.isArray(document.Statement)
    ? document.Statement
    : [];
  const resource = `arn:aws:s3:::${bucket}/*`;
  return statements.some((entry) => {
    const statement = entry as {
      Effect?: string;
      Principal?: unknown;
      Action?: unknown;
      Resource?: unknown;
    };
    return (
      statement.Effect === 'Allow' &&
      allowsEveryone(statement.Principal) &&
      mentions(statement.Action, 's3:GetObject') &&
      mentions(statement.Resource, resource)
    );
  });
}

export function buildPublicReadPolicy(bucket: string): string {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });
}

export async function provisionBucket(
  client: OssBucketClient,
  bucket: string,
): Promise<void> {
  // 先探测再建桶，两个方向都会踩坑，且都看不见：删掉探测直接 makeBucket，在 RustFS 上照样"成功"
  // （它对重复建桶返回 200 而非 409），问题不会暴露，直到换到会返回 409 的服务端；反过来改写成
  // "捕获 BucketAlreadyOwnedByYou 即视为已就绪"同样不成立——RustFS 永不抛出该错误码，该分支永不触发。
  // 实测依据见 docs/adr/0010-object-storage-rustfs-for-license.md。
  if (!(await client.bucketExists(bucket))) {
    await client.makeBucket(bucket);
  }
  await client.setBucketPolicy(bucket, buildPublicReadPolicy(bucket));
  const applied = await client.getBucketPolicy(bucket);
  if (!grantsPublicRead(applied, bucket)) {
    throw new Error(
      `the policy stored on "${bucket}" does not grant public read: ${applied}`,
    );
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWithBackoff(
  task: () => Promise<void>,
  policy: Required<RetryPolicy>,
): Promise<void> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      if (attempt >= policy.attempts) {
        throw new Error(`${attempt} attempts: ${messageOf(error)}`, {
          cause: error,
        });
      }
      const delayMs = Math.min(
        policy.initialDelayMs * 2 ** (attempt - 1),
        policy.maxDelayMs,
      );
      console.error(
        `${LOG_PREFIX} attempt ${attempt} of ${policy.attempts} failed (${messageOf(error)}), retrying in ${delayMs}ms`,
      );
      await policy.sleep(delayMs);
    }
  }
}

export async function bootstrapOss(options: BootstrapOptions): Promise<void> {
  const policy: Required<RetryPolicy> = {
    attempts: options.attempts ?? DEFAULT_ATTEMPTS,
    initialDelayMs: options.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS,
    maxDelayMs: options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS,
    sleep: options.sleep ?? wait,
  };
  console.log(
    `${LOG_PREFIX} waiting for object storage at ${options.target} to serve bucket "${options.bucket}"`,
  );
  try {
    await retryWithBackoff(
      () => provisionBucket(options.client, options.bucket),
      policy,
    );
  } catch (error) {
    throw new Error(
      `object storage at ${options.target} did not serve bucket "${options.bucket}" after ${policy.attempts} attempts: ${messageOf(error)}`,
      { cause: error },
    );
  }
  console.log(
    `${LOG_PREFIX} bucket "${options.bucket}" exists and grants anonymous read`,
  );
}

function createBootstrapClient(): Client {
  return new Client({
    endPoint: config.ossEndpoint,
    port: config.ossPort,
    useSSL: config.ossUseSsl,
    accessKey: config.ossAccessKey,
    secretKey: config.ossSecretKey,
  });
}

export async function main(
  overrides: Partial<BootstrapOptions> = {},
): Promise<void> {
  const bucket = overrides.bucket ?? config.ossBucket;
  if (bucket === '') {
    throw new Error(
      'OSS_BUCKET is empty, so the bootstrap has no bucket to provision',
    );
  }
  await bootstrapOss({
    client: overrides.client ?? createBootstrapClient(),
    bucket,
    target:
      overrides.target ??
      `${config.ossUseSsl ? 'https' : 'http'}://${config.ossEndpoint}:${config.ossPort}`,
    attempts: overrides.attempts,
    initialDelayMs: overrides.initialDelayMs,
    maxDelayMs: overrides.maxDelayMs,
    sleep: overrides.sleep,
  });
}

const entry = process.argv[1];
if (entry !== undefined && import.meta.url === pathToFileURL(entry).href) {
  main().then(
    () => {
      process.exit(0);
    },
    (error: unknown) => {
      console.error(`${LOG_PREFIX} ${messageOf(error)}`);
      process.exit(1);
    },
  );
}
