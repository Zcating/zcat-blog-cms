import { ZButton, ZView } from '@zcat/ui';

import { ArticleApi } from '@blog/apis';
import { PostContentView } from '@blog/features';

import type { Route } from '../index/+types/post-board.id';

export function meta(args: Route.MetaArgs) {
  const article = args.loaderData.article;
  const SITE = 'https://blog.zcat.example';
  const url = `${SITE}/post-board/${article.id}`;
  return [
    { title: article.title },
    { name: 'description', content: article.excerpt },
    { property: 'og:type', content: 'article' },
    { property: 'og:title', content: article.title },
    { property: 'og:description', content: article.excerpt },
    { property: 'og:url', content: url },
    ...(article.cover ? [{ property: 'og:image', content: article.cover }] : []),
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: article.title },
    { name: 'twitter:description', content: article.excerpt },
    ...(article.cover ? [{ name: 'twitter:image', content: article.cover }] : []),
    { tagName: 'link', rel: 'canonical', href: url },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;
  const article = await ArticleApi.getArticleDetail(id);
  if (!article) {
    throw new Response('文章不存在', { status: 404 });
  }

  // JSON-LD: Article
  const SITE = 'https://blog.zcat.example';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishAt,
    dateModified: article.updatedAt,
    image: article.cover ? [article.cover] : undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE}/post-board/${article.id}`,
    },
  };

  return {
    article,
    jsonLd,
  };
}

export function ErrorBoundary() {
  return (
    <ZView className="container mx-auto py-12 text-center space-y-4">
      <h1 className="text-3xl font-bold">文章不存在</h1>
      <p className="text-muted-foreground">您访问的文章可能已被删除或暂时不可用。</p>
      <ZButton onClick={() => (window.location.href = '/post-board')}>返回文章列表</ZButton>
    </ZView>
  );
}

export default function PostBoardDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const article = loaderData.article;
  return (
    <ZView>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(loaderData.jsonLd) }}
      />
      <PostContentView value={article} />
    </ZView>
  );
}
