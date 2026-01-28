import { ZButton, ZView, ZMarkdown, useMemoizedFn } from '@zcat/ui';
import { FileText } from 'lucide-react';
import React from 'react';

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
      onError?.(errorMessage);
    } finally {
      setIsExporting(false);
    }
  });

  return (
    <>
      <ZView className="flex-1 overflow-y-auto">
        <ZMarkdown
          className="h-[200px]"
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
    </>
  );
}
