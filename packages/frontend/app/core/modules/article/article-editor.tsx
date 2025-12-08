import MdEditor from 'react-markdown-editor-lite';
import { ArticlesApi } from '@cms/api';
import { Button, Markdown, Row, Textarea, useLoadingFn } from '@cms/components';

import 'react-markdown-editor-lite/lib/index.css';
import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';

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
      <div className="m-6">
        <div className="flex justify-between items-center mb-4 gap-5">
          <Textarea
            className="flex-1"
            weight="bold"
            size="lg"
            value={article.title}
            onChange={(e) => setArticle((prev) => ({ ...prev, title: e }))}
            placeholder="请输入文章标题"
            maxLength={84}
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
      <div className="border border-gray-200 rounded-lg overflow-hidden flex-1">
        <MarkdownEditor
          value={article.content || ''}
          onChange={handleEditorChange}
        />
      </div>
      {handleSave.loading && (
        <div className="absolute top-0 left-0 right-0 flex justify-center items-center">
          <LoadingOutlined className="text-5xl" />
        </div>
      )}
    </div>
  );
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const handleEditorChange = ({ text }: { text: string }) => {
    onChange(text);
  };

  return (
    <MdEditor
      value={value}
      onChange={handleEditorChange}
      style={{ height: '100%' }}
      renderHTML={(text) => <Markdown content={text} />}
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
  );
}
