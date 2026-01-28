import { ZButton, ZView, ZMarkdown, useMemoizedFn } from '@zcat/ui';
import { FileText } from 'lucide-react';
import React from 'react';

interface OffscreenRenderResult {
  element: HTMLElement;
  cleanup: () => void;
}

function createOffscreenIframe(styles: {
  containerClassName: string;
  markdownClassName: string;
}): OffscreenRenderResult {
  const iframe = document.createElement('iframe');
  iframe.id = 'offscreen-render-iframe';
  iframe.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 800px;
    height: 0;
    border: none;
    visibility: hidden;
    pointer-events: none;
  `;

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    throw new Error('无法创建离屏渲染文档');
  }

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 24px;
            background-color: #ffffff;
            font-family: ui-sans-serif, system-ui, sans-serif;
          }
          .container {
            width: 100%;
            min-height: 100vh;
          }
          .prose {
            max-width: 65ch;
            line-height: 1.75;
          }
          .prose pre {
            background-color: #1e293b;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
          }
          .prose code {
            background-color: #f1f5f9;
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
            font-size: 0.875em;
          }
          .prose pre code {
            background-color: transparent;
            padding: 0;
            font-size: 0.875em;
          }
          .prose h1, .prose h2, .prose h3, .prose h4 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
            line-height: 1.25;
          }
          .prose h1 { font-size: 2em; }
          .prose h2 { font-size: 1.5em; }
          .prose h3 { font-size: 1.25em; }
          .prose p {
            margin: 1em 0;
          }
          .prose ul, .prose ol {
            margin: 1em 0;
            padding-left: 1.5em;
          }
          .prose li {
            margin: 0.25em 0;
          }
          .prose blockquote {
            border-left: 4px solid #cbd5e1;
            padding-left: 1em;
            margin: 1em 0;
            color: #64748b;
          }
          .prose table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
          }
          .prose th, .prose td {
            border: 1px solid #e2e8f0;
            padding: 0.5em;
            text-align: left;
          }
          .prose th {
            background-color: #f8fafc;
            font-weight: 600;
          }
          .prose img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
          }
          .prose a {
            color: #3b82f6;
            text-decoration: underline;
          }
          .prose hr {
            border: none;
            border-top: 1px solid #e2e8f0;
            margin: 2em 0;
          }
          .katex {
            font-size: 1.1em;
          }
        </style>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
      </head>
      <body>
        <div class="container">
          <div class="prose" id="markdown-content"></div>
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  return {
    element: iframe,
    cleanup: () =>iframe.parentNode) {
      if ( {
        iframe.parentNode.removeChild(iframe);
      }
    },
  };
}

async function convertMarkdownToHtml(markdown: string): Promise<string> {
  const [
    Unified,
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

  const processor = Unified.unified()
    .use(remarkParse.default)
    .use(remarkMath.default)
    .use(remarkGfm.default)
    .use(remarkRehype.default)
    .use(rehypeKatex.default)
    .use(rehypeStringify.default);

  const result = await processor.process(markdown);
  return result.toString();
}

export interface MarkdownPdfPreviewProps {
  markdown: string;
  onError?: (error: string) => void;
}

export function MarkdownPdfPreview({
  markdown,
  onError,
}: MarkdownPdfPreviewProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const exportToPdf = useMemoizedFn(async () => {
    if (!markdown.trim()) return;

    setIsExporting(true);
    try {
      const [{ snapdom }, { jsPDF }] = await Promise.all([
        import('@zumer/snapdom'),
        import('jspdf'),
      ]);

      const htmlContent = await convertMarkdownToHtml(markdown);

      const renderResult = createOffscreenIframe({
        containerClassName: 'prose prose-slate max-w-none',
        markdownClassName: 'prose prose-slate max-w-none dark:prose-invert',
      });

      const iframeDoc =
        renderResult.element.contentDocument ||
        renderResult.element.contentWindow?.document;

      if (!iframeDoc) {
        renderResult.cleanup();
        throw new Error('离屏渲染文档创建失败');
      }

      const contentElement = iframeDoc.getElementById('markdown-content');
      if (!contentElement) {
        renderResult.cleanup();
        throw new Error('离屏渲染内容元素不存在');
      }

      contentElement.innerHTML = htmlContent;

      await new Promise((resolve) => setTimeout(resolve, 500));

      const element = renderResult.element;
      const containerElement = iframeDoc.querySelector('.container');
      const bodyElement = iframeDoc.body;

      if (!containerElement && !bodyElement) {
        renderResult.cleanup();
        throw new Error('离屏渲染容器元素不存在');
      }

      const targetElement = containerElement || bodyElement;

      const computedStyle = window.getComputedStyle(targetElement);
      if (
        !computedStyle.width ||
        computedStyle.width === '0px' ||
        !computedStyle.height ||
        computedStyle.height === '0px'
      ) {
        renderResult.cleanup();
        throw new Error('离屏渲染内容尺寸无效，无法生成 PDF');
      }

      const result = await snapdom(element, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const pngImage = await result.toPng();
      const imgData = pngImage.src;

      renderResult.cleanup();

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
        e instanceof Error
          ? e.message
          : 'PDF 导出失败，请确保 markdown 内容有效';
      console.error('PDF 导出失败:', e);
      onError?.(errorMessage);
    } finally {
      setIsExporting(false);
    }
  });

  return (
    <ZView className="flex flex-col h-full gap-6">
      <ZView className="relative flex-1 overflow-y-auto px-2">
        <ZMarkdown
          className="absolute inset-0"
          content={markdown}
          placeholder="请在左侧输入 Markdown 内容以查看预览"
        />
      </ZView>
      <ZButton
        className="w-full"
        onClick={exportToPdf}
        disabled={!markdown || isExporting}
      >
        <FileText className="w-4 h-4 mr-2" />
        {isExporting ? '导出中...' : '导出为 PDF'}
      </ZButton>
    </ZView>
  );
}
