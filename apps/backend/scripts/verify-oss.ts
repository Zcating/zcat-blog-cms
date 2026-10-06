import { randomBytes } from 'node:crypto';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ACCESS_KEY_ID_ENV = 'OSS_ACCESS_KEY';
const ACCESS_KEY_SECRET_ENV = 'OSS_SECRET_KEY';
const BUCKET_ENV = 'OSS_BUCKET';
const ENDPOINT_ENV = 'OSS_ENDPOINT';
const DEFAULT_BUCKET = 'zcating-cms-oss';
const DEFAULT_ENDPOINT = 'https://s3.oss-cn-guangzhou.aliyuncs.com';
const DEFAULT_REGION = 'oss-cn-guangzhou';
const FALLBACK_REGION_CANDIDATE = 'us-east-1';
const PROBE_PREFIX = 'verify-oss-probe';
const PRESIGN_TTL_SECONDS = 60;
const DISCOVERY_TTL_SECONDS = 30;
const DISCOVERY_MAX_ATTEMPTS = 1;
const VERIFICATION_MAX_ATTEMPTS = 1;
const VERIFICATION_CAP = 3;
const CONTENT_TYPE = 'text/plain; charset=utf-8';
const SIGNATURE_REJECTED_CODES = new Set([
  'SignatureDoesNotMatch',
  'InvalidAccessKeyId',
  'AuthorizationHeaderMalformed',
  'InvalidRequest',
  'InvalidArgument',
]);
const UNREACHABLE_CODES = new Set([
  'ENOTFOUND',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ETIMEDOUT',
  'EPROTO',
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
]);

type Addressing = 'virtual-hosted' | 'path-style';
type Step = 'presign-put' | 'presign-get' | 'roundtrip' | 'delete-then-404';
type Cell = 'ok' | 'fail' | 'skip';
type Verdict = 'signable' | 'signature-rejected' | 'unreachable' | 'unknown';
type Credentials = { accessKeyId: string; secretAccessKey: string };
type ErrorShape = {
  name: string;
  code: string;
  requestId: string;
  status: number;
};
type Target = { host: string; forcePathStyle: boolean };
type Row = {
  host: string;
  addressing: Addressing;
  cells: Record<Step, Cell>;
  result: 'PASS' | 'FAIL';
  failure: (ErrorShape & { step: Step }) | undefined;
};
type DiscoveryRow = {
  region: string;
  target: Target;
  verdict: Verdict;
  code: string;
  requestId: string;
};
type Verification = { discovery: DiscoveryRow; row: Row };

const DISCOVERY_HEADERS = [
  'region-candidate',
  'endpoint-host',
  'addressing',
  'verdict',
  'Code',
  'x-oss-request-id',
];
const VERIFICATION_HEADERS = [
  'region-candidate',
  'endpoint-host',
  'addressing',
  'presign-PUT',
  'presign-GET',
  'roundtrip',
  'delete-then-404',
  'result',
];

class ProbeError extends Error {
  readonly errorName: string;
  readonly errorCode: string;
  readonly requestId: string;
  readonly status: number;

  constructor(
    step: Step,
    errorName: string,
    errorCode: string,
    requestId: string,
    status = 0,
  ) {
    super(`${step} failed with ${errorName}`);
    this.name = 'ProbeError';
    this.errorName = errorName;
    this.errorCode = errorCode;
    this.requestId = requestId;
    this.status = status;
  }
}

function readEnv(name: string, fallback: string): string {
  const raw = process.env[name];
  if (raw === undefined) {
    return fallback;
  }
  const trimmed = raw.trim();
  return trimmed === '' ? fallback : trimmed;
}

function requireCredentials(): Credentials | null {
  const accessKeyId = readEnv(ACCESS_KEY_ID_ENV, '');
  const secretAccessKey = readEnv(ACCESS_KEY_SECRET_ENV, '');
  const missing: string[] = [];
  if (accessKeyId === '') {
    missing.push(ACCESS_KEY_ID_ENV);
  }
  if (secretAccessKey === '') {
    missing.push(ACCESS_KEY_SECRET_ENV);
  }
  if (missing.length > 0) {
    console.error(
      `missing required environment variable(s): ${missing.join(', ')}`,
    );
    console.error(
      `export ${ACCESS_KEY_ID_ENV} and ${ACCESS_KEY_SECRET_ENV} before running this script`,
    );
    return null;
  }
  return { accessKeyId, secretAccessKey };
}

function stripOssPrefix(region: string): string {
  return region.startsWith('oss-') ? region.slice('oss-'.length) : region;
}

function hostOfEndpoint(endpoint: string): string {
  try {
    return new URL(endpoint).host;
  } catch {
    return new URL(DEFAULT_ENDPOINT).host;
  }
}

function regionFromHost(host: string): string {
  return (
    host.split('.').find((label) => label.startsWith('oss-')) ?? DEFAULT_REGION
  );
}

function buildRegionCandidates(host: string): string[] {
  const region = regionFromHost(host);
  const candidates: string[] = [];
  for (const candidate of [
    region,
    stripOssPrefix(region),
    FALLBACK_REGION_CANDIDATE,
  ]) {
    if (candidate !== '' && !candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  }
  return candidates;
}

function buildTargets(host: string): Target[] {
  const hosts = host.startsWith('s3.')
    ? [host, host.slice('s3.'.length)]
    : [host, `s3.${host}`];
  const targets: Target[] = [];
  for (const candidate of hosts) {
    targets.push({ host: candidate, forcePathStyle: false });
    targets.push({ host: candidate, forcePathStyle: true });
  }
  return targets;
}

function addressingOf(target: Target): Addressing {
  return target.forcePathStyle ? 'path-style' : 'virtual-hosted';
}

function probeKey(): string {
  return `${PROBE_PREFIX}/${randomBytes(12).toString('hex')}.txt`;
}

function extractTag(body: string, tag: string): string {
  const matched = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i').exec(body);
  return matched?.[1]?.trim() ?? '';
}

function requestIdOf(response: Response, body: string): string {
  const fromHeader =
    response.headers.get('x-oss-request-id') ??
    response.headers.get('x-amz-request-id');
  if (fromHeader !== null && fromHeader !== '') {
    return fromHeader;
  }
  return extractTag(body, 'RequestId');
}

function shapeOf(error: unknown): ErrorShape {
  if (error instanceof ProbeError) {
    return {
      name: error.errorName,
      code: error.errorCode,
      requestId: error.requestId,
      status: error.status,
    };
  }
  if (error instanceof Error) {
    const enriched = error as Error & {
      Code?: unknown;
      cause?: unknown;
      $metadata?: {
        requestId?: unknown;
        httpHeaders?: Record<string, string | undefined>;
      };
    };
    const cause =
      typeof enriched.cause === 'object' && enriched.cause !== null
        ? (enriched.cause as { name?: unknown; code?: unknown })
        : undefined;
    const causeCode = typeof cause?.code === 'string' ? cause.code : '';
    const causeName = typeof cause?.name === 'string' ? cause.name : '';
    const code =
      typeof enriched.Code === 'string' && enriched.Code !== ''
        ? enriched.Code
        : causeCode;
    const headers = enriched.$metadata?.httpHeaders ?? {};
    const requestId =
      headers['x-oss-request-id'] ??
      headers['x-amz-request-id'] ??
      (typeof enriched.$metadata?.requestId === 'string'
        ? enriched.$metadata.requestId
        : '') ??
      '';
    const name = error.name === '' ? 'Error' : error.name;
    const suffix =
      causeName !== '' && causeName !== 'Error' && causeName !== name
        ? `(${causeName})`
        : '';
    const status =
      typeof enriched.$metadata === 'object' &&
      enriched.$metadata !== null &&
      'statusCode' in enriched.$metadata &&
      typeof (enriched.$metadata as { statusCode?: unknown }).statusCode ===
        'number'
        ? (enriched.$metadata as { statusCode: number }).statusCode
        : 0;
    return { name: `${name}${suffix}`, code, requestId, status };
  }
  return { name: 'UnknownError', code: '', requestId: '', status: 0 };
}

function isUnreachableCode(code: string): boolean {
  return UNREACHABLE_CODES.has(code) || code.startsWith('CERT_');
}

function classify(shape: ErrorShape): Verdict {
  if (isUnreachableCode(shape.code)) {
    return 'unreachable';
  }
  if (shape.status === 400 || SIGNATURE_REJECTED_CODES.has(shape.code)) {
    return 'signature-rejected';
  }
  if (shape.status === 404 || shape.status === 403) {
    return 'signable';
  }
  if (shape.code === 'NoSuchKey' || shape.code === 'AccessDenied') {
    return 'signable';
  }
  return 'unknown';
}

async function readOk(response: Response, step: Step): Promise<Buffer> {
  const body = Buffer.from(await response.arrayBuffer());
  if (response.ok) {
    return body;
  }
  const text = body.toString('utf8');
  throw new ProbeError(
    step,
    `HttpStatus${response.status}`,
    extractTag(text, 'Code'),
    requestIdOf(response, text),
    response.status,
  );
}

async function expectGone(response: Response, step: Step): Promise<void> {
  const body = Buffer.from(await response.arrayBuffer());
  if (response.status === 404) {
    return;
  }
  const text = body.toString('utf8');
  const code = extractTag(text, 'Code');
  if (code === 'NoSuchKey') {
    return;
  }
  throw new ProbeError(
    step,
    `HttpStatus${response.status}`,
    code,
    requestIdOf(response, text),
    response.status,
  );
}

async function probeCombination(
  region: string,
  target: Target,
  bucket: string,
  credentials: Credentials,
  key: string,
): Promise<DiscoveryRow> {
  const client = new S3Client({
    region,
    endpoint: `https://${target.host}`,
    forcePathStyle: target.forcePathStyle,
    credentials,
    maxAttempts: DISCOVERY_MAX_ATTEMPTS,
  });
  try {
    const url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: DISCOVERY_TTL_SECONDS },
    );
    await readOk(await fetch(url), 'presign-get');
    return { region, target, verdict: 'signable', code: '', requestId: '' };
  } catch (error) {
    const shape = shapeOf(error);
    return {
      region,
      target,
      verdict: classify(shape),
      code: shape.code,
      requestId: shape.requestId,
    };
  } finally {
    client.destroy();
  }
}

async function runTarget(
  target: Target,
  bucket: string,
  region: string,
  credentials: Credentials,
  key: string,
): Promise<Row> {
  const cells: Record<Step, Cell> = {
    'presign-put': 'skip',
    'presign-get': 'skip',
    roundtrip: 'skip',
    'delete-then-404': 'skip',
  };
  const addressing: Addressing = addressingOf(target);
  const client = new S3Client({
    region,
    endpoint: `https://${target.host}`,
    forcePathStyle: target.forcePathStyle,
    credentials,
    maxAttempts: VERIFICATION_MAX_ATTEMPTS,
  });
  const payload = Buffer.from(randomBytes(24).toString('hex'), 'utf8');
  let step: Step = 'presign-put';
  let getUrl: string;
  let failure: (ErrorShape & { step: Step }) | undefined;
  let deleted = false;
  try {
    const putUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: CONTENT_TYPE,
      }),
      { expiresIn: PRESIGN_TTL_SECONDS },
    );
    await readOk(
      await fetch(putUrl, {
        method: 'PUT',
        body: payload,
        headers: { 'content-type': CONTENT_TYPE },
      }),
      'presign-put',
    );
    cells['presign-put'] = 'ok';

    step = 'presign-get';
    getUrl = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: PRESIGN_TTL_SECONDS },
    );
    const downloaded = await readOk(await fetch(getUrl), 'presign-get');
    cells['presign-get'] = 'ok';

    step = 'roundtrip';
    if (Buffer.compare(downloaded, payload) !== 0) {
      throw new ProbeError('roundtrip', 'PayloadMismatch', '', '');
    }
    cells.roundtrip = 'ok';

    step = 'delete-then-404';
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    deleted = true;
    await expectGone(await fetch(getUrl), 'delete-then-404');
    cells['delete-then-404'] = 'ok';
  } catch (error) {
    cells[step] = 'fail';
    failure = { step, ...shapeOf(error) };
  } finally {
    if (!deleted) {
      try {
        await client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: key }),
        );
        deleted = true;
      } catch (error) {
        void error;
      }
    }
    client.destroy();
  }
  const result = Object.values(cells).every((cell) => cell === 'ok')
    ? 'PASS'
    : 'FAIL';
  return { host: target.host, addressing, cells, result, failure };
}

function pad(value: string, width: number): string {
  return value.length >= width
    ? value
    : value + ' '.repeat(width - value.length);
}

function printTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((cells) => cells[index].length)),
  );
  const line = (cells: string[]): string =>
    cells
      .map((cell, index) => pad(cell, widths[index]))
      .join('  ')
      .trimEnd();
  console.log(line(headers));
  console.log(widths.map((width) => '-'.repeat(width)).join('  '));
  for (const cells of rows) {
    console.log(line(cells));
  }
}

function discoveryCells(row: DiscoveryRow): string[] {
  return [
    row.region,
    row.target.host,
    addressingOf(row.target),
    row.verdict,
    row.code === '' ? '-' : row.code,
    row.requestId === '' ? '-' : row.requestId,
  ];
}

function verificationCells(verification: Verification): string[] {
  const row = verification.row;
  return [
    verification.discovery.region,
    row.host,
    row.addressing,
    row.cells['presign-put'],
    row.cells['presign-get'],
    row.cells.roundtrip,
    row.cells['delete-then-404'],
    row.result,
  ];
}

function tripleOf(verification: Verification): string {
  return `${verification.discovery.region} + ${verification.row.host} + ${verification.row.addressing}`;
}

function tripleOfDiscovery(row: DiscoveryRow): string {
  return `${row.region} + ${row.target.host} + ${addressingOf(row.target)}`;
}

function dominantVerdict(rows: DiscoveryRow[]): Verdict {
  const order: Verdict[] = [
    'signature-rejected',
    'unreachable',
    'unknown',
    'signable',
  ];
  const counts = new Map<Verdict, number>();
  for (const row of rows) {
    counts.set(row.verdict, (counts.get(row.verdict) ?? 0) + 1);
  }
  let best: Verdict = 'unknown';
  let bestCount = -1;
  for (const verdict of order) {
    const count = counts.get(verdict) ?? 0;
    if (count > bestCount) {
      best = verdict;
      bestCount = count;
    }
  }
  return best;
}

function verdictCounts(rows: DiscoveryRow[]): string {
  const counts = new Map<Verdict, number>();
  for (const row of rows) {
    counts.set(row.verdict, (counts.get(row.verdict) ?? 0) + 1);
  }
  return (
    ['signable', 'signature-rejected', 'unreachable', 'unknown'] as Verdict[]
  )
    .filter((verdict) => (counts.get(verdict) ?? 0) > 0)
    .map((verdict) => `${verdict}=${counts.get(verdict) ?? 0}/${rows.length}`)
    .join(', ');
}

function printVerdict(
  discovery: DiscoveryRow[],
  verifications: Verification[],
  skipped: number,
): void {
  const passing = verifications.filter(
    (verification) => verification.row.result === 'PASS',
  );
  if (passing.length > 0) {
    console.log(
      `verdict: configure ${passing.map(tripleOf).join(', ')}; signature round trip viable (${passing.length}/${verifications.length} verified PASS)`,
    );
    return;
  }
  const signable = discovery.filter((row) => row.verdict === 'signable');
  if (signable.length > 0) {
    console.log(
      `verdict: ${verifications.map(tripleOf).join(', ')} signed but verification FAILED (${verifications.length} of ${signable.length} signable attempted, ${skipped} skipped); signature round trip not viable`,
    );
    return;
  }
  console.log(
    `verdict: no signable combination (${verdictCounts(discovery)}); dominant verdict: ${dominantVerdict(discovery)}; signing config undetermined`,
  );
}

async function main(): Promise<void> {
  const credentials = requireCredentials();
  if (credentials === null) {
    process.exit(1);
  }
  const bucket = readEnv(BUCKET_ENV, DEFAULT_BUCKET);
  const endpointHost = hostOfEndpoint(readEnv(ENDPOINT_ENV, DEFAULT_ENDPOINT));
  const targets = buildTargets(endpointHost);
  const regionCandidates = buildRegionCandidates(endpointHost);

  const discovery: DiscoveryRow[] = [];
  for (const candidate of regionCandidates) {
    for (const target of targets) {
      console.log(
        `probing ${candidate} + ${target.host} + ${addressingOf(target)} ...`,
      );
      discovery.push(
        await probeCombination(
          candidate,
          target,
          bucket,
          credentials,
          probeKey(),
        ),
      );
    }
  }

  console.log('');
  console.log('discovery');
  printTable(DISCOVERY_HEADERS, discovery.map(discoveryCells));

  const signable = discovery.filter((row) => row.verdict === 'signable');
  const selected = signable.slice(0, VERIFICATION_CAP);
  const skipped = signable.length - selected.length;
  if (skipped > 0) {
    console.log('');
    console.log(
      `signable combinations found: ${signable.length}; verifying the first ${VERIFICATION_CAP} and skipping ${skipped} (all signable rows are listed in the discovery table above)`,
    );
  }

  const verifications: Verification[] = [];
  console.log('');
  console.log('verification');
  for (const entry of selected) {
    console.log(`verifying ${tripleOfDiscovery(entry)} ...`);
    const row = await runTarget(
      entry.target,
      bucket,
      entry.region,
      credentials,
      probeKey(),
    );
    verifications.push({ discovery: entry, row });
  }

  if (verifications.length === 0) {
    console.log('(nothing to verify; no combination was signable)');
  } else {
    printTable(VERIFICATION_HEADERS, verifications.map(verificationCells));
    const failed = verifications.filter(
      (verification) => verification.row.result === 'FAIL',
    );
    if (failed.length > 0) {
      console.log('');
      console.log('failures:');
      for (const verification of failed) {
        const shape = verification.row.failure;
        console.log(
          `  ${tripleOf(verification)} step=${shape?.step ?? 'unknown'} name=${shape?.name || 'UnknownError'} Code=${shape?.code || '-'} x-oss-request-id=${shape?.requestId || '-'}`,
        );
      }
    }
  }

  console.log('');
  printVerdict(discovery, verifications, skipped);
  process.exit(
    verifications.some((verification) => verification.row.result === 'PASS')
      ? 0
      : 1,
  );
}

void main();
