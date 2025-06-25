import { useState } from 'react';
import MdEditor from 'react-markdown-editor-lite';
import MarkdownIt from 'markdown-it';
import 'react-markdown-editor-lite/lib/index.css';
import { ArticlesApi } from '@cms/api';

// 初始化 markdown 解析器
const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

interface ArticleEditorProps {
  article: ArticlesApi.Article;
  onSave: (article: ArticlesApi.Article) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export function ArticleEditor({
  article: initialArticle,
  onSave,
  onCancel,
  saving = false,
}: ArticleEditorProps) {
  const [article, setArticle] = useState(initialArticle);

  // 处理编辑器内容变化
  const handleEditorChange = ({ text }: { text: string }) => {
    setArticle((prev) => ({ ...prev, content: text }));
  };

  const handleSave = () => {
    onSave(article);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 文章标题和操作按钮 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            <input
              type="text"
              value={article.title}
              onChange={(e) =>
                setArticle((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入文章标题"
            />
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              取消
            </button>
          </div>
        </div>

        {/* 文章摘要 */}
        <textarea
          value={article.excerpt}
          onChange={(e) =>
            setArticle((prev) => ({ ...prev, excerpt: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入文章摘要"
          rows={3}
        />
      </div>

      {/* Markdown 编辑器 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <MdEditor
          value={article.content || ''}
          style={{ height: '600px' }}
          renderHTML={(text) => mdParser.render(text)}
          onChange={handleEditorChange}
          config={{
            view: {
              menu: true,
              md: true,
              html: true,
            },
            canView: {
              menu: true,
              md: true,
              html: true,
              fullScreen: true,
              hideMenu: true,
            },
          }}
        />
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
