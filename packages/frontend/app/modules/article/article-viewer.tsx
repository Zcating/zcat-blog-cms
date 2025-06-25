import type { ArticlesApi } from '@cms/api';
import MarkdownIt from 'markdown-it';

// 初始化 markdown 解析器
const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

interface ArticleViewerProps {
  article: ArticlesApi.Article;
  onEdit: () => void;
}

export function ArticleViewer({ article, onEdit }: ArticleViewerProps) {
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 文章标题和操作按钮 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            {article.title || '无标题'}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              编辑
            </button>
          </div>
        </div>

        {/* 文章摘要 */}
        <p className="text-gray-600 text-lg mb-4">
          {article.excerpt || '暂无摘要'}
        </p>
      </div>

      {/* Markdown 内容预览 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6">
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{
              __html: mdParser.render(article.content || '暂无内容'),
            }}
          />
        </div>
      </div>

      {/* 文章信息 */}
      <div className="mt-6 text-sm text-gray-500">
        <p>
          创建时间:{' '}
          {article.createdAt
            ? new Date(article.createdAt).toLocaleString()
            : '未知'}
        </p>
        <p>
          更新时间:{' '}
          {article.updatedAt
            ? new Date(article.updatedAt).toLocaleString()
            : '未知'}
        </p>
      </div>
    </div>
  );
}
