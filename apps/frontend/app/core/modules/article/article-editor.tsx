import { LoadingOutlined } from '@ant-design/icons';
import React from 'react';

import { ArticlesApi } from '@cms/api';
import {
  Button,
  Input,
  MarkdownEditor,
  Row,
  Textarea,
  useLoadingFn,
} from '@cms/components';
import { CommonRegex } from '@cms/core/utils';

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
          <Input
            variant="primary"
            className="flex-1 h-12"
            weight="bold"
            size="xl"
            value={article.title}
            onChange={(e) =>
              setArticle((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="请输入文章标题"
            maxLength={50}
          />
          <div className="">
            <Row justify="end" gap="5">
              <Button onClick={handleSave} variant="primary">
                保存
              </Button>
              <Button onClick={onCancel}>取消</Button>
            </Row>
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
