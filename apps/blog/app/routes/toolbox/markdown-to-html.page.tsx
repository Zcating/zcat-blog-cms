import {
  ZButton,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ZTextarea,
  ZView,
  useMemoizedFn,
  useWatch,
  copyToClipboard,
  ZMarkdown,
} from '@zcat/ui';
import { Copy, FileCode } from 'lucide-react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';

export function meta() {
  return [
    { title: 'Markdown 转 HTML' },
    {
      name: 'description',
      content: '在线将 Markdown 转换为 HTML，支持 GFM 和数学公式',
    },
  ];
}

export default function MarkdownToHtmlPage() {
  const [inputMarkdown, setInputMarkdown] = React.useState('');
  const [htmlContent, setHtmlContent] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isConverting, setIsConverting] = React.useState(false);

  const convertToHtml = useMemoizedFn(async (markdown: string) => {
    if (!markdown.trim()) {
      setHtmlContent('');
      setError(null);
      return;
    }

    setIsConverting(true);
    try {
      const [unified, remarkParse, rehypeStringify] = await Promise.all([
        import('unified'),
        import('remark-parse'),
        import('rehype-stringify'),
      ]);

      const processor = unified
        .unified()
        .use(remarkParse.default)
        .use(remarkMath)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeKatex)
        .use(rehypeStringify.default);

      const result = await processor.process(markdown);
      setHtmlContent(result.toString());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setHtmlContent('');
    } finally {
      setIsConverting(false);
    }
  });

  useWatch([inputMarkdown], (markdown) => {
    convertToHtml(markdown);
  });

  return (
    <ZView className="p-4 space-y-6 h-full overflow-y-auto">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Markdown 转 HTML</h1>
        <p className="text-sm text-muted-foreground">
          将 Markdown 转换为 HTML 源码。支持 GitHub Flavored
          Markdown（表格、删除线等）和数学公式（KaTeX）。
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              Markdown 输入
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <ZTextarea
              className="min-h-80 font-mono text-sm resize-none"
              style={{ fieldSizing: 'fixed' } as React.CSSProperties}
              value={inputMarkdown}
              onValueChange={setInputMarkdown}
              placeholder="请输入 Markdown"
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              HTML 输出
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {error && (
              <ZView className="text-destructive text-sm bg-destructive/10 p-2 rounded">
                解析错误: {error}
              </ZView>
            )}
            <ZTextarea
              className="min-h-80 font-mono text-sm resize-none"
              style={{ fieldSizing: 'fixed' } as React.CSSProperties}
              value={htmlContent}
              readOnly
              placeholder="HTML 结果..."
            />
            <ZButton
              className="w-full"
              onClick={() => copyToClipboard(htmlContent)}
              disabled={!htmlContent || isConverting}
            >
              <Copy className="w-4 h-4 mr-2" />
              复制 HTML 源码
            </ZButton>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5" />
            预览
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inputMarkdown ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ZMarkdown content={inputMarkdown} />
            </div>
          ) : (
            <ZView className="text-muted-foreground text-sm py-8 text-center">
              请在左侧输入 Markdown 内容以查看预览
            </ZView>
          )}
        </CardContent>
      </Card>
    </ZView>
  );
}
