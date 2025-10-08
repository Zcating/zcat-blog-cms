import type { ArticlesApi } from '@cms/api';
import { Button, Markdown, safeDateString } from '@cms/components';
import dayjs from 'dayjs';

interface ArticleViewerProps {
  article: ArticlesApi.Article;
  onEdit: () => void;
}

export function ArticleViewer({ article, onEdit }: ArticleViewerProps) {
  const createTime = safeDateString(article.createdAt, '未知');
  const updateTime = safeDateString(article.updatedAt, '未知');
  return (
    <div className="w-full flex flex-col justify-center gap-10">
      {/* 文章标题和操作按钮 */}
      <div className="space-y-4">
        <Button onClick={onEdit} variant="primary">
          编辑
        </Button>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            文章标题：{article.title}
          </h1>
          <div className="flex gap-2"></div>
        </div>

        {/* 文章摘要 */}
        <p className="text-gray-600 text-lg mb-4">
          摘要：{article.excerpt || '暂无摘要'}
        </p>

        {/* 文章信息 */}
        <div className="mt-6 text-sm space-y-2">
          <p>创建时间: {createTime}</p>
          <p>更新时间: {updateTime}</p>
        </div>
      </div>

      <div className="px-40">
        {/* Markdown 内容预览 */}
        <Markdown content={article.content || '暂无内容'} />
      </div>
    </div>
  );
}
