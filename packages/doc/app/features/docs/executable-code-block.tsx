import * as ZcatUi from '@zcat/ui';
import { Code, Copy, Eye, Check } from 'lucide-react';
import * as lucideReact from 'lucide-react';
import React from 'react';
import * as Sucrase from 'sucrase';

interface ZExecutableCodeProps {
  children?: React.ReactNode;
  language?: string;
  className?: string;
}

interface ZExecutableProps {
  code: string;
}

const ReactModule = React;

function Executable({ code }: ZExecutableProps) {
  const [renderedElement, setRenderedElement] =
    React.useState<React.ReactNode>(null);
  const [error, setError] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  ZcatUi.useWatch([code], (code) => {
    try {
      if (!containerRef.current) {
        return;
      }

      const transpiledCode = Sucrase.transform(code, {
        transforms: ['typescript', 'jsx', 'imports'],
        filePath: 'demo.tsx',
      }).code;

      const wrappedCode = `
          "use strict";
          const React = ReactModule;
          const { createElement, useState } = React;
          ${transpiledCode}
        `;
      const requireFn = (moduleName: string) => {
        if (moduleName === 'react') {
          return ReactModule;
        }
        if (moduleName === '@zcat/ui') {
          return ZcatUi;
        }
        if (moduleName === 'lucide-react') {
          return lucideReact;
        }
      };

      /* eslint-disable @typescript-eslint/no-implied-eval */
      const fn = new Function('ReactModule', 'require', 'exports', wrappedCode);

      const exports: Record<string, React.ComponentType<any> | undefined> = {};
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      fn(ReactModule, requireFn, exports);
      setRenderedElement(
        <>
          {Object.values(exports).map((component) => {
            if (!ZcatUi.isFunction(component)) {
              return;
            }
            return React.createElement(component, {});
          })}
        </>,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  });

  return (
    <div className="space-y-4">
      {error && <ZcatUi.Badge variant="destructive">{error}</ZcatUi.Badge>}
      <div ref={containerRef} className="p-4">
        {renderedElement}
      </div>
    </div>
  );
}

type ViewMode = 'code' | 'preview';
const VIEW_MODE_OPTIONS: CommonOption<ViewMode>[] = [
  {
    value: 'code',
    label: (
      <>
        <Code size={14} />
        代码
      </>
    ),
  },
  {
    value: 'preview',
    label: (
      <>
        <Eye size={14} />
        预览
      </>
    ),
  },
];

export function ExecutableCodeBlock({
  children,
  className,
}: ZExecutableCodeProps) {
  const [isCollapsed, onToggleCollapsed] = ZcatUi.useToggleValue(false);
  const [viewMode, setViewMode] = React.useState<ViewMode>('preview');
  const [isCopied, setIsCopied] = React.useState(false);
  const code = ZcatUi.safeString(children);

  const handleViewChange = ZcatUi.useMemoizedFn((value: string) => {
    const option = VIEW_MODE_OPTIONS.find((item) => item.value === value);
    if (!option) {
      return;
    }
    setViewMode(option.value);
  });

  const handleCopy = ZcatUi.useMemoizedFn(async () => {
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  });

  return (
    <ZcatUi.Card className={ZcatUi.cn('py-0 gap-0', className)}>
      <ZcatUi.CardHeader className="flex items-center bg-accent/50 justify-between px-4 py-2">
        <ZcatUi.CardTitle className="text-markdown-code-lang">
          typescript
        </ZcatUi.CardTitle>
        <ZcatUi.CardAction className="flex items-center gap-3">
          <ZcatUi.ZToggleGroup
            type="single"
            value={viewMode}
            onValueChange={handleViewChange}
            options={VIEW_MODE_OPTIONS}
          />
          <ZcatUi.Button size="sm" variant="outline" onClick={handleCopy}>
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
          </ZcatUi.Button>
          <ZcatUi.Button
            size="sm"
            variant="outline"
            onClick={onToggleCollapsed}
          >
            {isCollapsed ? '展开' : '折叠'}
          </ZcatUi.Button>
        </ZcatUi.CardAction>
      </ZcatUi.CardHeader>
      <ZcatUi.CardContent className="py-3">
        <ZcatUi.FoldAnimation isOpen={!isCollapsed}>
          <div className={viewMode === 'code' ? 'hidden' : 'block'}>
            <Executable code={code} />
          </div>
          <div className={viewMode === 'code' ? 'block' : 'hidden'}>
            <ZcatUi.ZSyntaxHighlighter language="tsx">
              {code}
            </ZcatUi.ZSyntaxHighlighter>
          </div>
        </ZcatUi.FoldAnimation>
      </ZcatUi.CardContent>
    </ZcatUi.Card>
  );
}
