/*
 * The page reads from the TanStack Query cache
 * via `useSuspenseQuery(articleDetailQueryOptions({ id }))`. The
 * thin route file at `app/routes/_cms/articles.$articleId.tsx`
 * ensures the cache slot is hot before the page renders.
 *
 * The list schema and the detail schema are distinct — the detail
 * endpoint does NOT project `content` (it is omitted from the
 * backend's SELECT). When the body is needed by the editor, the
 * editor uploads / preserves the user's local draft rather than
 * re-fetching from the detail cache. This component renders the
 * detail metadata only.
 */

import { safeDateString, ZButton, ZMarkdown } from '@zcat/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import React from 'react';

import { articleDetailQueryOptions } from '@cms/server/articles';
import { Workspace } from '@cms/core/ui/workspace';

interface ArticleDetailPageProps {
  articleId: number;
}

export function ArticleDetailPage({ articleId }: ArticleDetailPageProps) {
  const navigate = useNavigate();
  const { data: article } = useSuspenseQuery(
    articleDetailQueryOptions({ id: articleId }),
  );

  const createTime = safeDateString(article.createdAt, '未知');
  const updateTime = safeDateString(article.updatedAt, '未知');
  const publishTime = safeDateString(article.publishAt, '未知');

  const handleEdit = React.useCallback(() => {
    void navigate({
      to: '/articles/edit',
      search: { id: articleId },
    });
  }, [navigate, articleId]);

  const handleBack = React.useCallback(() => {
    void navigate({ to: '/articles' });
  }, [navigate]);

  return (
    <Workspace
      title="文章详情"
      operation={
        <div className="flex gap-2">
          <ZButton onClick={handleBack}>返回</ZButton>
          <ZButton onClick={handleEdit}>编辑</ZButton>
        </div>
      }
    >
      <div className="w-full flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            文章标题：{article.title}
          </h1>
          <p className="mt-2 text-gray-600 text-lg">
            摘要：{article.excerpt || '暂无摘要'}
          </p>
          <div className="mt-6 text-sm space-y-2">
            <p>创建时间: {createTime}</p>
            <p>更新时间: {updateTime}</p>
            <p>发布时间: {publishTime}</p>
          </div>
        </div>

        {/*
          The detail schema intentionally omits `content`. The body
          is rendered with a placeholder so callers (and tests) can
          rely on a stable contract: the detail cache slot is
          metadata only. To edit the body, the user navigates to
          the editor — the editor is the canonical place for the
          full draft.
        */}
        <div className="px-40">
          <ZMarkdown content="暂无内容" />
        </div>
      </div>
    </Workspace>
  );
}
