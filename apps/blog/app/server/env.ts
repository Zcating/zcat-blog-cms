export class EnvUrlMissingError extends Error {
  readonly code: string;
  readonly name: string;

  constructor(name: string, message: string) {
    super(message);
    this.name = name;
    this.code = name;
  }
}

export const BackendUrlMissingError = EnvUrlMissingError;
export const BlogSiteUrlMissingError = EnvUrlMissingError;

function requireEnvUrl(
  variable: 'BACKEND_API_URL' | 'BLOG_SITE_URL',
  errorName: string,
  purpose: string,
): string {
  const trimmed = process.env[variable]?.trim() ?? '';
  if (trimmed.length === 0) {
    throw new EnvUrlMissingError(
      errorName,
      `${variable} environment variable is required ${purpose}`,
    );
  }
  return trimmed.replace(/\/+$/, '');
}

export function resolveBackendApiUrl(): string {
  return requireEnvUrl(
    'BACKEND_API_URL',
    'BackendUrlMissingError',
    'for blog server functions',
  );
}

export function resolveBlogSiteUrl(): string {
  return requireEnvUrl(
    'BLOG_SITE_URL',
    'BlogSiteUrlMissingError',
    'by the blog robots, feed and sitemap routes',
  );
}
