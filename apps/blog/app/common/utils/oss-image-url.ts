export const OSS_IMAGE_PROXY_PATH = '/api/oss/image';

export function toSameOriginOssImage(url: string): string {
  if (!url) {
    return url;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return url;
  }
  const path = `${parsed.pathname}${parsed.search}`;
  return `${OSS_IMAGE_PROXY_PATH}?path=${encodeURIComponent(path)}`;
}
