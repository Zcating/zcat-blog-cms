import {
  ZButton,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ZTextarea,
  ZView,
  ZToggleGroup,
  ZMarkdown,
  useMemoizedFn,
  useWatch,
  copyToClipboard,
  Badge,
} from '@zcat/ui';
import { Copy, Eye, FileCode, FileText } from 'lucide-react';
import React from 'react';

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
  const [htmlContent, setHtmlContent] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isConverting, setIsConverting] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('html');

  const convertToHtml = useMemoizedFn(async (markdown: string) => {
    if (!markdown.trim()) {
      setHtmlContent('');
      setError(null);
      return;
    }

    setIsConverting(true);
    try {
      const [
        unified,
        remarkParse,
        rehypeStringify,
        remarkMath,
        remarkGfm,
        remarkRehype,
        rehypeKatex,
      ] = await Promise.all([
        import('unified'),
        import('remark-parse'),
        import('rehype-stringify'),
        import('remark-math'),
        import('remark-gfm'),
        import('remark-rehype'),
        import('rehype-katex'),
      ]);

      const processor = unified
        .unified()
        .use(remarkParse.default)
        .use(remarkMath.default)
        .use(remarkGfm.default)
        .use(remarkRehype.default)
        .use(rehypeKatex.default)
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

  const exportToPdf = useMemoizedFn(async () => {
    if (!inputMarkdown.trim()) return;

    setIsExporting(true);
    try {
      const [{ snapdom }, { jsPDF }] = await Promise.all([
        import('@zumer/snapdom'),
        import('jspdf'),
      ]);

      const element = document.getElementById('markdown-preview');
      if (!element) {
        throw new Error('PDF 内容元素不存在，请确保已切换到预览模式');
      }

      const computedStyle = window.getComputedStyle(element);
      if (!computedStyle.width || computedStyle.width === '0px') {
        throw new Error('PDF 内容元素尺寸无效，请确保内容已完全渲染');
      }

      const result = await snapdom(element, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const pngImage = await result.toPng();
      const imgData = pngImage.src;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (pngImage.height * pdfWidth) / pngImage.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save('markdown-document.pdf');
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : 'PDF 导出失败，请确保已切换到预览模式';
      console.error('PDF 导出失败:', e);
      setError(errorMessage);
    } finally {
      setIsExporting(false);
    }
  });

  useWatch([inputMarkdown], convertToHtml);

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
            {error && <Badge variant="destructive">解析错误: {error}</Badge>}
            {viewMode === 'html' ? (
              <>
                <ZTextarea
                  className="flex-1 font-mono text-sm resize-none"
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
              </>
            ) : (
              <>
                <ZView id="markdown-preview" className="flex-1 overflow-y-auto">
                  <ZMarkdown
                    className="h-[200px]"
                    content={inputMarkdown}
                    placeholder="请在左侧输入 Markdown 内容以查看预览"
                  />
                </ZView>
                <ZButton
                  className="w-full"
                  onClick={exportToPdf}
                  disabled={!inputMarkdown || isExporting}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isExporting ? '导出中...' : '导出为 PDF'}
                </ZButton>
              </>
            )}
          </CardContent>
        </Card>
      </ZView>
    </ZView>
  );
}
