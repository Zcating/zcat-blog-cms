import { createOssStrategy } from './oss/oss.factory';

const strategy = createOssStrategy();

export async function getPrivateUrl(filename: string) {
  return strategy.getPrivateUrl(filename, 'photo');
}

export async function deleteFile(filename: string) {
  try {
    await strategy.deleteFile(filename, 'photo');
    return true;
  } catch {
    return false;
  }
}

export async function getArticleUrl(filename: string) {
  return strategy.getArticleUrl(filename);
}

export async function deleteArticleFile(filename: string) {
  try {
    await strategy.deleteArticleFile(filename);
    return true;
  } catch {
    return false;
  }
}

export function getBucket(type: 'article' | 'photo') {
  return strategy.getBucket(type);
}

export const ossService = {
  getPrivateUrl,
  deleteFile,
  getArticleUrl,
  deleteArticleFile,
  getBucket,
};
