import { ZButton, ZView, ZMarkdown, useMemoizedFn, useMount } from '@zcat/ui';
import { snapdom } from '@zumer/snapdom';
import { FileText, Download, X } from 'lucide-react';
import React from 'react';
import { unknown } from 'zod';

export interface MarkdownPdfPreviewProps {
  markdown: string;
  onError?: (error: string) => void;
}

export function MarkdownPdfPreview({
  markdown,
  onError,
}: MarkdownPdfPreviewProps) {
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportedImage, setExportedImage] = React.useState<string | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const offscreenContainerRef = React.useRef<HTMLDivElement | null>(null);

  const cleanupOffscreenContainer = React.useCallback(() => {
    if (
      offscreenContainerRef.current &&
      document.body.contains(offscreenContainerRef.current)
    ) {
      document.body.removeChild(offscreenContainerRef.current);
      offscreenContainerRef.current = null;
    }
  }, []);

  const createOffscreenContainer = React.useCallback(() => {
    cleanupOffscreenContainer();

    const offscreen = document.createElement('div');
    offscreen.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: ${containerRef.current?.offsetWidth || 800}px;
      background-color: white;
      z-index: -1;
      overflow: visible;
    `;

    document.body.appendChild(offscreen);
    offscreenContainerRef.current = offscreen;

    return offscreen;
  }, [cleanupOffscreenContainer]);

  const exportToImage = useMemoizedFn(async () => {
    if (!markdown) {
      onError?.('没有可导出的内容');
      return;
    }

    if (!containerRef.current) {
      onError?.('找不到预览容器元素');
      return;
    }

    setIsExporting(true);
    setExportedImage(null);

    try {
      const offscreenContainer = createOffscreenContainer();

      const clone = containerRef.current.cloneNode(true) as HTMLElement;
      clone.removeAttribute('data-export-target');
      clone.style.position = 'relative';
      clone.style.left = '0';
      clone.style.top = '0';
      clone.style.width = '100%';
      clone.style.height = 'auto';
      clone.style.minHeight = 'auto';
      clone.style.overflow = 'visible';
      clone.style.overflowY = 'visible';

      const markdownElement = clone.querySelector('[data-slot="markdown"]');
      if (markdownElement) {
        (markdownElement as HTMLElement).style.position = 'relative';
        (markdownElement as HTMLElement).style.height = 'auto';
        (markdownElement as HTMLElement).style.overflow = 'visible';
      }

      offscreenContainer.appendChild(clone);

      await new Promise((resolve) => setTimeout(resolve, 200));

      const scrollHeight = clone.scrollHeight;
      if (scrollHeight > 0) {
        clone.style.height = `${scrollHeight}px`;
      }

      const result = await snapdom(offscreenContainer, {
        backgroundColor: '#ffffff',
        scale: 2,
        fast: false,
      });

      cleanupOffscreenContainer();

      const pngImage = await result.toPng();
      if (pngImage && pngImage.src) {
        setExportedImage(pngImage.src);
        setShowPreview(true);
      } else {
        throw new Error('导出结果为空');
      }
    } catch (error) {
      cleanupOffscreenContainer();
      const errorMessage = error instanceof Error ? error.message : '导出失败';
      console.error('导出图片失败:', error);
      onError?.(errorMessage);
    } finally {
      setIsExporting(false);
    }
  });

  const handleDownload = useMemoizedFn(async () => {
    if (!exportedImage) return;

    try {
      const response = await fetch(exportedImage);
      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `markdown-export-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setShowPreview(false);
      setExportedImage(null);
    } catch (error) {
      console.error('下载失败:', error);
      onError?.('下载失败');
    }
  });

  const handleClosePreview = useMemoizedFn(() => {
    setShowPreview(false);
    setExportedImage(null);
  });

  useMount(() => {
    return () => {
      cleanupOffscreenContainer();
    };
  });

  return (
    <>
      <ZView className="flex flex-col h-full gap-6">
        <ZView
          ref={containerRef}
          className="relative flex-1 overflow-y-auto"
          data-export-target="true"
        >
          <ZMarkdown
            className="absolute inset-0"
            content={markdown}
            placeholder="请在左侧输入 Markdown 内容以查看预览"
          />
        </ZView>
        <ZButton
          className="w-full"
          onClick={exportToImage}
          disabled={!markdown || isExporting}
        >
          <FileText className="w-4 h-4 mr-2" />
          {isExporting ? '导出中...' : '导出为 PNG 图片'}
        </ZButton>
      </ZView>

      {showPreview && exportedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleClosePreview}
        >
          <div
            className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">图片预览</h3>
              <button
                onClick={handleClosePreview}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
                <img
                  src={exportedImage}
                  alt="导出图片预览"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <ZButton variant="outline" onClick={handleClosePreview}>
                关闭
              </ZButton>
              <ZButton onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                下载图片
              </ZButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
