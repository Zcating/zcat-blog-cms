/**
 * Browser-direct OSS upload pipeline for article Markdown images.
 *
 * The legacy `OssAction.uploadArticleImagesContent` hid the upload
 * steps inside `@cms/shared/modules/oss`. Phase 3b splits that
 * responsibility between the server lane (typed contracts only) and
 * this client lane (browser-only operations that touch the DOM):
 *
 *   1. Walk the markdown body for `![alt](blob:...)` references and
 *      extract each `blob:` URL in order.
 *   2. For each URL, fetch the blob, get a presigned URL from
 *      `getSystemSettingUploadUrlServerFn`, and `PUT` the bytes
 *      directly from the browser to that presigned URL — never
 *      streaming the bytes through the CMS server.
 *   3. Hand the resolved OSS keys to `uploadArticleImages` so the
 *      backend can resolve them into public CDN URLs and return
 *      the URL list the editor uses to rewrite the markdown.
 *
 * The image-extraction regex, the markdown rewrite, and the
 * `blob:` -> OSS-key mapping all live in this lane so the editor
 * component can stay declarative.
 */

import {
  getSystemSettingUploadUrlServerFn,
  type UploadConfigResult,
} from '@cms/server/system-setting';
import { uploadArticleImages } from '@cms/server/articles';

import { CommonRegex } from '@cms/core/utils/common-regex';

/**
 * Walk the markdown body and return every `![alt](url)` URL whose
 * scheme is `blob:` — i.e. every image the user just pasted and
 * that still lives in the browser.
 */
export function extractBlobImageUrls(markdown: string): string[] {
  const matches = markdown.matchAll(CommonRegex.MARKDOWN_IMAGE_REGEX);
  const result: string[] = [];
  for (const match of matches) {
    const url = match[2] ?? '';
    if (url.startsWith('blob:')) result.push(url);
  }
  return result;
}

/**
 * Rewrite the markdown body, replacing each `blob:` URL in order
 * with the corresponding resolved OSS key. Non-blob URLs are left
 * untouched so existing CDN images survive the round-trip.
 *
 * The arrays MUST be positionally aligned: the i-th blob URL in
 * the markdown is replaced by the i-th key in `keys`. The caller
 * is responsible for keeping them in sync (see
 * `uploadArticleMarkdownImages`).
 */
export function rewriteArticleMarkdownImages(
  markdown: string,
  keys: string[],
): string {
  if (!keys.length) return markdown;

  const blobUrls = extractBlobImageUrls(markdown);
  const lookup = new Map<string, string>();
  blobUrls.forEach((url, index) => {
    if (index < keys.length) lookup.set(url, keys[index] as string);
  });

  return markdown.replace(
    CommonRegex.MARKDOWN_IMAGE_REGEX,
    (match: string, alt: string, url: string) => {
      const replacement = lookup.get(url);
      return replacement ? `![${alt}](${replacement})` : match;
    },
  );
}

async function fetchBlobFromUrl(blobUrl: string): Promise<Blob> {
  const response = await fetch(blobUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch blob ${blobUrl}: ${response.status}`);
  }
  return response.blob();
}

async function uploadBlobToPresignedUrl(blobUrl: string): Promise<string> {
  const blob = await fetchBlobFromUrl(blobUrl);

  // The image key is deterministic but unique: timestamp + a
  // short random suffix. The backend's `upload-images` endpoint
  // expects the bare key (not the presigned URL), and that key is
  // what the editor uses to rewrite the markdown.
  const extension = blob.type.split('/').pop() || 'png';
  const filename = `${Date.now()}-${Math.floor(Math.random() * 10 ** 7)}`;
  const key = `articles/${filename}.${extension}`;

  const { presignedUrl } = await getSystemSettingUploadUrlServerFn({
    data: { key },
  });

  const put = await fetch(presignedUrl, {
    method: 'PUT',
    body: blob,
  });
  if (!put.ok) {
    throw new Error(
      `Failed to upload ${key} to ${presignedUrl}: ${put.status}`,
    );
  }
  return key;
}

/**
 * Public entry point. Walks the markdown body, uploads each
 * `blob:` image directly to OSS, then forwards the resolved keys
 * to `uploadArticleImages` so the backend can hand back the
 * canonical CDN URL list.
 *
 * Returns the OSS keys (not the resolved CDN URLs) — the editor
 * rewrites the markdown using the keys first, then `createArticle` /
 * `updateArticle` accepts the rewritten markdown. The backend's
 * `uploadArticleImages` is the source of truth for what CDN URL
 * each key maps to.
 */
export async function uploadArticleMarkdownImages(
  blobUrls: string[],
): Promise<string[]> {
  const keys: string[] = [];
  for (const url of blobUrls) {
    const key = await uploadBlobToPresignedUrl(url);
    keys.push(key);
  }
  // Forward the keys to the backend so the public URL list is
  // consistent with the backend's view. The editor does not
  // currently use the public URL list, but we keep the symmetry
  // with the legacy pipeline so a future caller can use it.
  await uploadArticleImages({ data: { images: keys } });
  return keys;
}

// Type-only re-export so consumers don't have to import
// `@cms/server/system-setting` directly when shaping tests.
export type { UploadConfigResult };
