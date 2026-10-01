import { afterEach, describe, expect, it, vi } from 'vitest';

import { config } from './common/config.service';

const stubbedClient = vi.hoisted(() => ({
  bucketExists: vi.fn(async (): Promise<boolean> => true),
  makeBucket: vi.fn(async (): Promise<void> => undefined),
  setBucketPolicy: vi.fn(async (): Promise<void> => undefined),
  getBucketPolicy: vi.fn(async (): Promise<string> => ''),
}));

vi.mock('minio', () => ({
  Client: class {
    bucketExists = stubbedClient.bucketExists;
    makeBucket = stubbedClient.makeBucket;
    setBucketPolicy = stubbedClient.setBucketPolicy;
    getBucketPolicy = stubbedClient.getBucketPolicy;
  },
}));

import {
  bootstrapOss,
  buildPublicReadPolicy,
  main,
  provisionBucket,
  type OssBucketClient,
} from './bootstrap-oss';

const BUCKET = 'pictures';
const PUBLIC_READ_ARN = 'arn:aws:s3:::pictures/*';

function createFakeStorage(exists: boolean) {
  const state: { exists: boolean; policy: string | null } = {
    exists,
    policy: null,
  };
  const storage = {
    bucketExists: vi.fn(async () => state.exists),
    makeBucket: vi.fn(async () => {
      if (state.exists) {
        throw Object.assign(
          new Error(
            'The bucket you are attempting to create exists and is owned by you',
          ),
          { code: 'BucketAlreadyOwnedByYou' },
        );
      }
      state.exists = true;
    }),
    setBucketPolicy: vi.fn(async (_bucket: string, policy: string) => {
      state.policy = policy;
    }),
    getBucketPolicy: vi.fn(async () => {
      if (state.policy === null) {
        throw new Error('The bucket policy does not exist');
      }
      return state.policy;
    }),
    setBucketACL: vi.fn(async () => undefined),
  };
  return { state, storage };
}

function asClient(
  storage: ReturnType<typeof createFakeStorage>['storage'],
): OssBucketClient {
  return storage as unknown as OssBucketClient;
}

const noSleep = async () => undefined;

function captureConsole(): { lines: string[]; output: () => string } {
  const lines: string[] = [];
  vi.spyOn(console, 'log').mockImplementation((line) => {
    lines.push(String(line));
  });
  vi.spyOn(console, 'error').mockImplementation((line) => {
    lines.push(String(line));
  });
  return { lines, output: () => lines.join('\n') };
}

afterEach(() => {
  vi.restoreAllMocks();
  stubbedClient.bucketExists.mockReset();
  stubbedClient.bucketExists.mockResolvedValue(true);
  stubbedClient.makeBucket.mockReset();
  stubbedClient.setBucketPolicy.mockReset();
  stubbedClient.getBucketPolicy.mockReset();
  stubbedClient.getBucketPolicy.mockResolvedValue(
    buildPublicReadPolicy(BUCKET),
  );
});

describe('buildPublicReadPolicy', () => {
  it('grants anonymous s3:GetObject on this bucket and nothing broader', () => {
    expect(JSON.parse(buildPublicReadPolicy(BUCKET))).toEqual({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [PUBLIC_READ_ARN],
        },
      ],
    });
  });

  it('scopes the resource to the configured bucket, so one bucket cannot open another', () => {
    const document = JSON.parse(buildPublicReadPolicy('photos-2026'));

    expect(document.Statement[0].Resource).toEqual([
      'arn:aws:s3:::photos-2026/*',
    ]);
  });
});

describe('provisionBucket', () => {
  it('creates the bucket and confirms the public read policy landed', async () => {
    const { storage } = createFakeStorage(false);

    await provisionBucket(asClient(storage), BUCKET);

    expect(storage.bucketExists).toHaveBeenCalledWith(BUCKET);
    expect(storage.makeBucket).toHaveBeenCalledWith(BUCKET);
    expect(storage.getBucketPolicy).toHaveBeenCalledWith(BUCKET);
    expect(await storage.getBucketPolicy()).toBe(buildPublicReadPolicy(BUCKET));
  });

  it('never calls makeBucket for a bucket that already exists, so a repeat run cannot depend on an error code', async () => {
    const { storage } = createFakeStorage(true);

    await provisionBucket(asClient(storage), BUCKET);

    expect(storage.makeBucket).not.toHaveBeenCalled();
  });

  it('succeeds on a second run without creating the bucket again', async () => {
    const { storage } = createFakeStorage(false);
    const client = asClient(storage);

    await provisionBucket(client, BUCKET);
    await provisionBucket(client, BUCKET);

    expect(storage.makeBucket).toHaveBeenCalledTimes(1);
    expect(storage.setBucketPolicy).toHaveBeenCalledTimes(2);
  });

  it('never calls a bucket ACL, which the object store marks unsupported', async () => {
    const { storage } = createFakeStorage(false);

    await provisionBucket(asClient(storage), BUCKET);

    expect(storage.setBucketACL).not.toHaveBeenCalled();
  });

  it('fails when the policy that comes back does not grant public read', async () => {
    const { storage } = createFakeStorage(false);
    storage.getBucketPolicy.mockResolvedValue(
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: ['arn:aws:s3:::some-other-bucket/*'],
          },
        ],
      }),
    );

    await expect(provisionBucket(asClient(storage), BUCKET)).rejects.toThrow(
      /public read/i,
    );
  });

  it('fails when the policy that comes back is not even valid JSON', async () => {
    const { storage } = createFakeStorage(false);
    storage.getBucketPolicy.mockResolvedValue('not json at all');

    await expect(provisionBucket(asClient(storage), BUCKET)).rejects.toThrow(
      /public read/i,
    );
  });
});

describe('bootstrapOss', () => {
  it('retries with a growing delay until the object store answers', async () => {
    const { storage } = createFakeStorage(false);
    storage.bucketExists.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    storage.bucketExists.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const delays: number[] = [];

    await bootstrapOss({
      client: asClient(storage),
      bucket: BUCKET,
      target: 'http://rustfs:9000',
      sleep: async (ms) => {
        delays.push(ms);
      },
    });

    expect(storage.bucketExists).toHaveBeenCalledTimes(3);
    expect(delays).toEqual([1000, 2000]);
  });

  it('caps the delay so a long wait never becomes a long stall between attempts', async () => {
    const { storage } = createFakeStorage(false);
    storage.bucketExists.mockRejectedValue(new Error('ECONNREFUSED'));
    const delays: number[] = [];

    await expect(
      bootstrapOss({
        client: asClient(storage),
        bucket: BUCKET,
        target: 'http://rustfs:9000',
        attempts: 5,
        initialDelayMs: 1000,
        maxDelayMs: 3000,
        sleep: async (ms) => {
          delays.push(ms);
        },
      }),
    ).rejects.toThrow(/rustfs:9000/);

    expect(delays).toEqual([1000, 2000, 3000, 3000]);
  });

  it('gives up after a bounded number of attempts and names what it was waiting for', async () => {
    const { storage } = createFakeStorage(false);
    storage.bucketExists.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(
      bootstrapOss({
        client: asClient(storage),
        bucket: BUCKET,
        target: 'http://rustfs:9000',
        attempts: 3,
        sleep: noSleep,
      }),
    ).rejects.toThrow(/rustfs:9000/);

    expect(storage.bucketExists).toHaveBeenCalledTimes(3);
  });

  it('names the bucket it was provisioning in the failure message', async () => {
    const { storage } = createFakeStorage(false);
    storage.bucketExists.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(
      bootstrapOss({
        client: asClient(storage),
        bucket: BUCKET,
        target: 'http://rustfs:9000',
        attempts: 1,
        sleep: noSleep,
      }),
    ).rejects.toThrow(new RegExp(BUCKET));
  });

  it('reports each retry with the reason, so an operator can tell a slow start from a bad credential', async () => {
    const { storage } = createFakeStorage(false);
    storage.bucketExists.mockRejectedValue(new Error('InvalidAccessKeyId'));
    const logged = captureConsole();

    await expect(
      bootstrapOss({
        client: asClient(storage),
        bucket: BUCKET,
        target: 'http://rustfs:9000',
        attempts: 2,
        sleep: noSleep,
      }),
    ).rejects.toThrow(/InvalidAccessKeyId/);

    expect(logged.output()).toContain('InvalidAccessKeyId');
  });
});

describe('main', () => {
  it('refuses to run with an empty bucket name instead of provisioning nothing', async () => {
    await expect(main({ bucket: '', sleep: noSleep })).rejects.toThrow(
      /OSS_BUCKET/,
    );

    expect(stubbedClient.bucketExists).not.toHaveBeenCalled();
  });

  it('provisions the configured bucket with the public read policy', async () => {
    captureConsole();
    stubbedClient.bucketExists.mockResolvedValue(false);

    await main({ sleep: noSleep });

    expect(stubbedClient.makeBucket).toHaveBeenCalledWith(config.ossBucket);
    expect(stubbedClient.setBucketPolicy).toHaveBeenCalledWith(
      config.ossBucket,
      buildPublicReadPolicy('pictures'),
    );
  });

  it('never writes the configured access key or secret key to its output', async () => {
    stubbedClient.bucketExists.mockRejectedValue(
      new Error('InvalidAccessKeyId'),
    );
    const logged = captureConsole();

    await expect(main({ attempts: 2, sleep: noSleep })).rejects.toThrow(
      /InvalidAccessKeyId/,
    );

    expect(logged.lines.length).toBeGreaterThan(0);
    expect(logged.output()).not.toContain(config.ossAccessKey);
    expect(logged.output()).not.toContain(config.ossSecretKey);
  });
});
