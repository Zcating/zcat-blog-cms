export const APP_PORT = Number(process.env.E2E_APP_PORT ?? 13000);
export const APP_URL = `http://127.0.0.1:${APP_PORT}`;

export const MOCK_BACKEND_PORT = Number(
  process.env.E2E_MOCK_BACKEND_PORT ?? 19090,
);
export const MOCK_BACKEND_URL = `http://127.0.0.1:${MOCK_BACKEND_PORT}`;
export const MOCK_BACKEND_API_URL = `${MOCK_BACKEND_URL}/api`;

export const MOCK_BUCKET_PATH = '/mock-bucket/';

export function mockObjectUrl(key: string): string {
  return `${MOCK_BACKEND_URL}${MOCK_BUCKET_PATH}${key}?x-oss-signature=e2e-mock&x-oss-expires=900`;
}
