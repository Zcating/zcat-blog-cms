import {
  ZButton,
  ZTextarea,
  useMemoizedFn,
  copyToClipboard,
  useWatch,
} from '@zcat/ui';
import { Copy } from 'lucide-react';
import React, { useState } from 'react';

export interface MarkdownProcessorProps {
  markdown: string;
  onError: (error: string) => void;
}

export function MarkdownProcessor({
  markdown,
  onError,
}: MarkdownProcessorProps) {
  const [htmlContent, setHtmlContent] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const convertToHtml = useMemoizedFn(async (inputMarkdown: string) => {
    if (!inputMarkdown.trim()) {
      setHtmlContent('');
      onError('');
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

      const result = await processor.process(inputMarkdown);
      const html = result.toString();
      setHtmlContent(html);
      onError('');
    } catch (e) {
      const errorMessage = (e as Error).message;
      setHtmlContent('');
      onError(errorMessage);
    } finally {
      setIsConverting(false);
    }
  });

  useWatch([markdown], convertToHtml);

  return (
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
  );
}
