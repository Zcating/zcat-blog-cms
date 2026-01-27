import { Code, Eye, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { transform } from 'sucrase';

import { FoldAnimation } from '@zcat/ui/animation';
import { ZToggleGroup } from '@zcat/ui/design/z-toggle-group';
import { useMemoizedFn, useToggleValue } from '@zcat/ui/hooks';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@zcat/ui/shadcn';
import { cn } from '@zcat/ui/shadcn/lib/utils';

import { Button } from '../../shadcn/ui/button';

import { ZSyntaxHighlighter } from './z-syntax-highlighter';

interface ZExecutableCodeProps {
  children: string;
  language?: string;
  className?: string;
  extraComponents?: Record<string, React.ComponentType<any>>;
}

interface ZExecutableProps {
  code: string;
  extraComponents?: Record<string, React.ComponentType<any>>;
}

const ReactModule = {
  createElement: React.createElement,
  useState: React.useState,
};

function ZExecutable({ code, extraComponents }: ZExecutableProps) {
  const [renderedElement, setRenderedElement] = useState<React.ReactNode>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<Root | null>(null);

  const handleClear = useCallback(() => {
    if (rootRef.current) {
      rootRef.current.unmount();
      rootRef.current = null;
    }
    setRenderedElement(null);
    setError(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    if (rootRef.current) {
      rootRef.current.unmount();
      rootRef.current = null;
    }

    try {
      const transpiledCode = transform(code, {
        transforms: ['typescript', 'jsx'],
        filePath: 'demo.tsx',
      }).code;

      const hasJSX = code.includes('<') && code.includes('>');

      if (hasJSX && containerRef.current && mounted) {
        const componentImports = extraComponents
          ? `const { ${Object.keys(extraComponents).join(', ')} } = extraComponents;`
          : '';

        const wrappedCode = `
          "use strict";
          const React = ReactModule;
          const { createElement, useState } = React;
          ${componentImports}
          ${transpiledCode}
          return <DemoComponent />;
        `;

        /* eslint-disable @typescript-eslint/no-implied-eval */
        const fn = new Function('ReactModule', 'extraComponents', wrappedCode);
        /* eslint-enable @typescript-eslint/no-implied-eval */

        /* eslint-disable @typescript-eslint/no-unsafe-call */
        const element = fn(ReactModule, extraComponents);
        /* eslint-enable @typescript-eslint/no-unsafe-call */

        if (element && mounted) {
          rootRef.current = createRoot(containerRef.current);
          rootRef.current.render(element);

          setTimeout(() => {
            if (mounted) {
              setRenderedElement(element);
            }
          }, 0);
        }
      }
    } catch (err) {
      setTimeout(() => {
        if (mounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }, 0);
    }

    return () => {
      mounted = false;
    };
  }, [code, extraComponents]);

  return (
    <div className="space-y-4">
      {(renderedElement || error) && (
        <div className="rounded-md bg-muted p-4 space-y-2">
          {renderedElement && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">
                  渲染结果:
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClear}
                  className="h-6 px-2"
                >
                  <X size={12} />
                  <p className="text-xs">清除</p>
                </Button>
              </div>
              <div
                ref={containerRef}
                className="p-4 bg-background rounded border"
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 font-mono p-2 bg-red-50 rounded">
              {error}
            </div>
          )}
        </div>
      )}
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

export function ZExecutableCode({
  children,
  language = 'typescript',
  className,
  extraComponents,
}: ZExecutableCodeProps) {
  const [isCollapsed, onToggleCollapsed] = useToggleValue(false);
  const [viewMode, setViewMode] = useState<ViewMode>('code');
  const code = children;

  const handleViewChange = useMemoizedFn((value: string) => {
    const option = VIEW_MODE_OPTIONS.find((item) => item.value === value);
    if (!option) {
      return;
    }
    setViewMode(option.value);
  });

  return (
    <Card className={cn('py-0 gap-0', className)}>
      <CardHeader className="flex items-center bg-accent/50 justify-between px-4 py-2">
        <CardTitle className="text-markdown-code-lang">{language}</CardTitle>
        <CardAction className="flex items-center gap-2">
          <ZToggleGroup
            type="single"
            value={viewMode}
            onValueChange={handleViewChange}
            options={VIEW_MODE_OPTIONS}
          />
          <Button size="sm" variant="outline" onClick={onToggleCollapsed}>
            {isCollapsed ? '展开' : '折叠'}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="py-3 px-0!">
        <FoldAnimation isOpen={!isCollapsed}>
          {viewMode === 'code' ? (
            <ZSyntaxHighlighter language="tsx">{code}</ZSyntaxHighlighter>
          ) : (
            <ZExecutable code={code} extraComponents={extraComponents} />
          )}
        </FoldAnimation>
      </CardContent>
    </Card>
  );
}
