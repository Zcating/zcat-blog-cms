import { LoadingOutlined } from '@ant-design/icons';
import { ZButton, ZInput, ZTextarea } from '@zcat/ui';
import React from 'react';

import { ArticlesApi } from '@cms/api';

import { useLoadingFn } from '../../hooks';
import { MarkdownEditor } from '../../ui';

interface ArticleEditorProps {
  article: ArticlesApi.Article;
  onSave: (article: ArticlesApi.Article) => Promise<void>;
  onCancel: () => void;
}

export function ArticleEditor({
  article: initialArticle,
  onSave,
  onCancel,
}: ArticleEditorProps) {
  const [article, setArticle] = React.useState(initialArticle);

  // 处理编辑器内容变化
  const handleEditorChange = (text: string) => {
    setArticle((prev) => ({ ...prev, content: text }));
  };

  const handleSave = useLoadingFn(async () => {
    await onSave(article);
  });

  return (
    <div className="w-full h-screen flex flex-col">
      {/* 文章标题和操作按钮 */}
      <div className="mx-3 mt-3">
        <div className="flex justify-between items-center mb-4 gap-5">
          <ZInput
            className="flex-1 h-12 text-xl font-bold"
            value={article.title}
            onValueChange={(value) =>
              setArticle((prev) => ({ ...prev, title: value }))
            }
            placeholder="请输入文章标题"
            maxLength={50}
          />
          <div className="">
            <div className="flex justify-end gap-3">
              <ZButton onClick={handleSave} loading={handleSave.loading}>
                保存
              </ZButton>
              <ZButton onClick={onCancel} variant="outline">
                取消
              </ZButton>
            </div>
          </div>
        </div>

        {/* 文章摘要 */}
        <ZTextarea
          value={article.excerpt}
          onValueChange={(value) =>
            setArticle((prev) => ({ ...prev, excerpt: value }))
          }
          placeholder="请输入文章摘要"
        />
      </div>

      {/* Markdown 编辑器 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden flex-1 mx-3">
        <MarkdownEditor
          value={article.content || ''}
          onChange={handleEditorChange}
        />
      </div>
      {handleSave.loading && (
        <div className="fixed top-0 left-0 bottom-0 right-0 flex justify-center items-center">
          <LoadingOutlined className="text-5xl" />
        </div>
      )}
    </div>
  );
}
