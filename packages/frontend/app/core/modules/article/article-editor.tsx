import { Suspense, use, useState } from 'react';
import MdEditor from 'react-markdown-editor-lite';
import { ArticlesApi } from '@cms/api';
import { Button, Input, Markdown, Row, Textarea } from '@cms/components';

import 'react-markdown-editor-lite/lib/index.css';

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
  const [article, setArticle] = useState(initialArticle);

  // 处理编辑器内容变化
  const handleEditorChange = (text: string) => {
    setArticle((prev) => ({ ...prev, content: text }));
  };

  const handleSave = () => {
    onSave(article);
  };

  return (
    <div className="w-full">
      {/* 文章标题和操作按钮 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4 gap-5">
          <Textarea
            className="max-w-80"
            weight="bold"
            size="lg"
            value={article.title}
            onChange={(e) => setArticle((prev) => ({ ...prev, title: e }))}
            placeholder="请输入文章标题"
            maxLength={84}
          />
          <div className="flex-1">
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
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <MarkdownEditor
          value={article.content || ''}
          onChange={handleEditorChange}
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

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

async function getMdEditor() {
  return (await import('react-markdown-editor-lite')).default;
}

// import MdEditor from 'react-markdown-editor-lite';

function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  // const MdEditor = use(getMdEditor());

  const handleEditorChange = ({ text }: { text: string }) => {
    onChange(text);
  };

  return (
    <Suspense fallback={<div>加载中...</div>}>
      <MdEditor
        value={value}
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
    </Suspense>
  );
}
