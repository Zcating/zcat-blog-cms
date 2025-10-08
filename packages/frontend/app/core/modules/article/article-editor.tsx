import { useState } from 'react';
import MdEditor from 'react-markdown-editor-lite';
import { ArticlesApi } from '@cms/api';
import { Button, Input, Markdown, Textarea } from '@cms/components';

import 'react-markdown-editor-lite/lib/index.css';

interface ArticleEditorProps {
  article: ArticlesApi.Article;
  onSave: (article: ArticlesApi.Article) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ArticleEditor({
  article: initialArticle,
  onSave,
  onCancel,
  loading = false,
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
            <Input
              value={article.title}
              onChange={(e) =>
                setArticle((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="请输入文章标题"
            />
          </h1>
          <div className="flex gap-2">
            <Button onClick={handleSave} loading={loading} variant="primary">
              {loading ? '保存中...' : '保存'}
            </Button>
            <Button onClick={onCancel}>取消</Button>
          </div>
        </div>

        {/* 文章摘要 */}
        <Textarea
          value={article.excerpt}
          onChange={(e) => setArticle((prev) => ({ ...prev, excerpt: e }))}
          placeholder="请输入文章摘要"
        />
      </div>

      {/* Markdown 编辑器 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <MdEditor
          value={article.content || ''}
          style={{ height: '600px' }}
          renderHTML={(text) => <Markdown content={text} />}
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
