import { Play, X } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { transform } from 'sucrase';

import { FoldAnimation } from '@zcat/ui/animation';
import { useToggleValue } from '@zcat/ui/hooks';
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

interface ConsoleOutput {
  type: 'log' | 'error' | 'warn';
  content: string;
}

interface ZExecutableCodeProps {
  code: string;
  language?: string;
  className?: string;
  extraComponents?: Record<string, React.ComponentType<any>>;
}

type ExecutionStatus = 'idle' | 'loading' | 'success' | 'error';

const ReactModule = {
  createElement: React.createElement,
  useState: React.useState,
};

export function ZExecutableCode({
  code,
  language = 'typescript',
  className,
  extraComponents,
}: ZExecutableCodeProps) {
  const [isCollapsed, onToggleCollapsed] = useToggleValue(false);
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [consoleOutput, setConsoleOutput] = useState<ConsoleOutput[]>([]);
  const [returnValue, setReturnValue] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderedElement, setRenderedElement] = useState<React.ReactNode>(null);
  const [hasRendered, setHasRendered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<Root | null>(null);

  const clearRenderedElement = useCallback(() => {
    if (rootRef.current) {
      rootRef.current.unmount();
      rootRef.current = null;
    }
    setRenderedElement(null);
    setHasRendered(false);
  }, []);

  const runCode = useCallback(async () => {
    setStatus('loading');
    setConsoleOutput([]);
    setReturnValue(null);
    setError(null);

    clearRenderedElement();

    try {
      const capturedLogs: ConsoleOutput[] = [];

      const mockConsole = {
        log: (...args: unknown[]) => {
          capturedLogs.push({
            type: 'log',
            content: args.map((arg) => String(arg)).join(' '),
          });
        },
        error: (...args: unknown[]) => {
          capturedLogs.push({
            type: 'error',
            content: args.map((arg) => String(arg)).join(' '),
          });
        },
        warn: (...args: unknown[]) => {
          capturedLogs.push({
            type: 'warn',
            content: args.map((arg) => String(arg)).join(' '),
          });
        },
      };

      const transpiledCode = transform(code, {
        transforms: ['typescript', 'jsx'],
        filePath: 'demo.tsx',
      }).code;

      const hasJSX = code.includes('<') && code.includes('>');

      if (hasJSX && containerRef.current) {
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
        const fn = new Function(
          'ReactModule',
          'mockConsole',
          'extraComponents',
          wrappedCode,
        );
        /* eslint-enable @typescript-eslint/no-implied-eval */

        /* eslint-disable @typescript-eslint/no-unsafe-call */
        const element = fn(ReactModule, mockConsole, extraComponents);
        /* eslint-enable @typescript-eslint/no-unsafe-call */

        if (element) {
          rootRef.current = createRoot(containerRef.current);
          rootRef.current.render(element);
          setRenderedElement(element);
          setHasRendered(true);
        }
      } else {
        const wrappedCode = `
          "use strict";
          const console = mockConsole;
          ${transpiledCode}
          return lastExpression;
        `;

        const lastExpression = code
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith('//'))
          .pop();

        /* eslint-disable @typescript-eslint/no-implied-eval */
        const fn = new Function('mockConsole', wrappedCode);
        /* eslint-enable @typescript-eslint/no-implied-eval */

        /* eslint-disable @typescript-eslint/no-unsafe-call */
        const result = fn(mockConsole);
        /* eslint-enable @typescript-eslint/no-unsafe-call */

        setReturnValue(result);
      }

      setConsoleOutput(capturedLogs);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }, [code, clearRenderedElement, extraComponents]);

  return (
    <Card className={cn('py-0 gap-0', className)}>
      <CardHeader className="flex items-center bg-accent/50 justify-between px-4 py-2">
        <CardTitle className="text-markdown-code-lang">{language}</CardTitle>
        <CardAction className="flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={runCode}
            disabled={status === 'loading'}
          >
            <Play size={14} />
            <p>{status === 'loading' ? '运行中...' : '运行'}</p>
          </Button>
          <Button size="sm" variant="outline" onClick={onToggleCollapsed}>
            <p>{isCollapsed ? '展开' : '折叠'}</p>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="py-3">
        <FoldAnimation isOpen={!isCollapsed}>
          <div className="space-y-4">
            <ZSyntaxHighlighter language={language} className="rounded-md">
              {code}
            </ZSyntaxHighlighter>

            {(status === 'success' ||
              status === 'error' ||
              consoleOutput.length > 0 ||
              renderedElement) && (
              <div className="rounded-md bg-muted p-4 space-y-2">
                {renderedElement && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-medium">
                        渲染结果:
                      </p>
                      {hasRendered && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={clearRenderedElement}
                          className="h-6 px-2"
                        >
                          <X size={12} />
                          <p className="text-xs">清除</p>
                        </Button>
                      )}
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

                {consoleOutput.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      控制台输出:
                    </p>
                    {consoleOutput.map((log, index) => (
                      <div
                        key={index}
                        className={cn(
                          'text-sm font-mono p-1 rounded',
                          log.type === 'error' && 'text-red-600 bg-red-50',
                          log.type === 'warn' && 'text-yellow-600 bg-yellow-50',
                          log.type === 'log' && 'text-foreground',
                        )}
                      >
                        {log.content}
                      </div>
                    ))}
                  </div>
                )}

                {returnValue !== undefined &&
                  returnValue !== null &&
                  !renderedElement && (
                    <div className="text-sm">
                      <p className="text-xs text-muted-foreground font-medium">
                        返回值:
                      </p>
                      <pre className="text-xs mt-1 p-2 bg-background rounded overflow-x-auto">
                        {/* eslint-disable @typescript-eslint/no-base-to-string */}
                        {typeof returnValue === 'object'
                          ? JSON.stringify(returnValue, null, 2)
                          : String(returnValue)}
                        {/* eslint-enable @typescript-eslint/no-base-to-string */}
                      </pre>
                    </div>
                  )}
              </div>
            )}
          </div>
        </FoldAnimation>
      </CardContent>
    </Card>
  );
}
