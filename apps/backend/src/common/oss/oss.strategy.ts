export type OssType = 'article' | 'photo';

export interface OssStrategy {
  getPrivateUrl(key: string, type: OssType): Promise<string>;
  deleteFile(key: string, type: OssType): Promise<void>;
  getArticleUrl(key: string): Promise<string>;
  deleteArticleFile(key: string): Promise<void>;
  getBucket(type: OssType): string;
  getUploadToken(type: OssType): string;
}
