import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ZTextarea,
  ZView,
  ZToggleGroup,
  Badge,
} from '@zcat/ui';
import { Eye, FileCode } from 'lucide-react';
import React from 'react';

import { MarkdownProcessor, MarkdownPdfPreview } from '@blog/features';

const VIEW_MODE_OPTIONS: CommonOption<string>[] = [
  { value: 'html', label: <FileCode className="size-5" /> },
  { value: 'preview', label: <Eye className="size-5" /> },
];

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
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState('html');

  return (
    <ZView className="p-4 space-y-6 flex flex-col h-full">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Markdown 转 HTML</h1>
        <p className="text-sm text-muted-foreground">
          将 Markdown 转换为 HTML 源码。支持 GitHub Flavored
          Markdown（表格、删除线等）和数学公式（KaTeX）。
        </p>
      </div>

      <ZView className="flex-1 flex gap-6">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="size-5" />
              Markdown 输入
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <ZTextarea
              className="h-full font-mono text-sm resize-none"
              style={{ fieldSizing: 'fixed' } as React.CSSProperties}
              value={inputMarkdown}
              onValueChange={setInputMarkdown}
              placeholder=""
            />
          </CardContent>
        </Card>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              {viewMode === 'html' ? 'HTML 输出' : '预览'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <ZToggleGroup
              type="single"
              options={VIEW_MODE_OPTIONS}
              value={viewMode}
              onValueChange={setViewMode}
            />
            {error && <Badge variant="destructive">错误: {error}</Badge>}
            {viewMode === 'html' ? (
              <MarkdownProcessor markdown={inputMarkdown} onError={setError} />
            ) : (
              <MarkdownPdfPreview markdown={inputMarkdown} onError={setError} />
            )}
          </CardContent>
        </Card>
      </ZView>
    </ZView>
  );
}
