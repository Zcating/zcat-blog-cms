/*
 * `PUT` the bytes directly from the browser to the presigned URL —
 * never stream the bytes through the CMS server.
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
 * with the corresponding resolved URL. Non-blob URLs are left
 * untouched so existing CDN images survive the round-trip.
 *
 * The arrays MUST be positionally aligned: the i-th blob URL in
 * the markdown is replaced by the i-th URL in `resolvedUrls`. The
 * caller is responsible for keeping them in sync (see
 * `uploadArticleMarkdownImages`).
 */
export function rewriteArticleMarkdownImages(
  markdown: string,
  resolvedUrls: string[],
): string {
  if (!resolvedUrls.length) return markdown;

  const blobUrls = extractBlobImageUrls(markdown);
  const lookup = new Map<string, string>();
  blobUrls.forEach((url, index) => {
    if (index < resolvedUrls.length) {
      lookup.set(url, resolvedUrls[index] as string);
    }
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
  // expects the bare key (not the presigned URL), and it maps that
  // key to the public URL the editor splices into the markdown.
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
 * Returns the backend-resolved URLs (not the raw OSS keys) — the
 * editor rewrites the markdown with them before `createArticle` /
 * `updateArticle` accepts it, so the persisted body must contain
 * URLs the browser can load. `uploadArticleImages` is the source of
 * truth for what public URL each key maps to.
 */
export async function uploadArticleMarkdownImages(
  blobUrls: string[],
): Promise<string[]> {
  const keys: string[] = [];
  for (const url of blobUrls) {
    const key = await uploadBlobToPresignedUrl(url);
    keys.push(key);
  }
  return uploadArticleImages({ data: { images: keys } });
}

export type { UploadConfigResult };
