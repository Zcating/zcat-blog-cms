import { ZButton, ZView } from '@zcat/ui';
import { createFileRoute, notFound } from '@tanstack/react-router';

import { PostContentView } from '@blog/features';
import { getArticleDetail } from '@blog/server/article';
import { GetArticleDetailInputSchema } from '@blog/server/article/schemas';

const SITE = 'https://blog.zcat.example';

interface PostBoardDetailLoaderArgs {
  params: { id?: string };
}

export async function loader({ params }: PostBoardDetailLoaderArgs) {
  const id = params.id ?? '';

  if (!GetArticleDetailInputSchema.safeParse({ id }).success) {
    throw notFound();
  }

  const article = await getArticleDetail({ data: { id } });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE}/post-board/${article.id}`,
    },
  };

  return { article, jsonLd };
}

type PostBoardDetailLoaderData = Awaited<ReturnType<typeof loader>>;

export const Route = createFileRoute('/_blog/post-board_/$id')({
  head: ({ match }) => {
    const data = match.loaderData as PostBoardDetailLoaderData | undefined;
    if (!data) {
      return {};
    }
    const article = data.article;
    const url = `${SITE}/post-board/${article.id}`;
    return {
      meta: [
        { title: article.title },
        { name: 'description', content: article.excerpt },
        { property: 'og:type', content: 'article' },
        { property: 'og:title', content: article.title },
        { property: 'og:description', content: article.excerpt },
        { property: 'og:url', content: url },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: article.title },
        { name: 'twitter:description', content: article.excerpt },
      ],
      links: [{ rel: 'canonical', href: url }],
    };
  },
  loader,
  component: PostBoardDetailPage,
  notFoundComponent: () => <PostBoardDetailNotFound />,
  errorComponent: () => <PostBoardDetailNotFound />,
});

function PostBoardDetailPage() {
  const { article, jsonLd } = Route.useLoaderData();
  return (
    <ZView>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostContentView value={article} />
    </ZView>
  );
}

function PostBoardDetailNotFound() {
  return (
    <ZView className="container mx-auto py-12 text-center space-y-4">
      <h1 className="text-3xl font-bold">文章不存在</h1>
      <p className="text-muted-foreground">
        您访问的文章可能已被删除或暂时不可用。
      </p>
      <ZButton onClick={() => (window.location.href = '/post-board')}>
        返回文章列表
      </ZButton>
    </ZView>
  );
}
