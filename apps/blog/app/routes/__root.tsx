import { useMount, ZButton } from '@zcat/ui';
import { AlertCircle, FileQuestion, Home, RefreshCcw } from 'lucide-react';
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useNavigate,
} from '@tanstack/react-router';

import { StatisticsApi } from '@blog/features/layouts/statistics-api';

import type { ErrorComponentProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import '../app.css';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#0a0a0a' },
      { name: 'color-scheme', content: 'light dark' },
    ],
    links: [
      {
        rel: 'preload',
        href: '/fonts/orbitron-black.ttf',
        as: 'font',
        type: 'font/ttf',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'alternate',
        type: 'application/rss+xml',
        title: 'ZCAT Blog',
        href: '/rss.xml',
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: RootNotFound,
  errorComponent: RootErrorBoundary,
});

function RootComponent() {
  useMount(() => {
    StatisticsApi.uploadVisitRecord(window.location.href, document.title);
  });

  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootNotFound() {
  return (
    <ErrorScreen
      status={404}
      message="页面未找到"
      details="您访问的页面可能已被删除、更名或暂时不可用。"
    />
  );
}

function RootErrorBoundary({ error }: ErrorComponentProps) {
  let message = '哎呀，出错了！';
  let details = '发生了一个意想不到的错误。';
  let stack: string | undefined;
  let status = 500;
  const routeError = error as {
    status?: number;
    statusText?: string;
    isNotFound?: boolean;
  } | null;

  if (routeError && typeof routeError === 'object') {
    status =
      routeError.isNotFound === true ? 404 : Number(routeError.status) || 500;
    message = status === 404 ? '页面未找到' : '请求错误';
    details =
      status === 404
        ? '您访问的页面可能已被删除、更名或暂时不可用。'
        : routeError.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <ErrorScreen
      status={status}
      message={message}
      details={details}
      stack={stack}
    />
  );
}

function ErrorScreen({
  status,
  message,
  details,
  stack,
}: {
  status: number;
  message: string;
  details: string;
  stack?: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon Area */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center animate-pulse">
              {status === 404 ? (
                <FileQuestion className="w-12 h-12 text-muted-foreground" />
              ) : (
                <AlertCircle className="w-12 h-12 text-destructive" />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-background px-2 py-1 rounded-md border text-xs font-mono font-bold text-muted-foreground shadow-sm">
              {status}
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {message}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {details}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <ZButton
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => navigate({ to: '/' as never })}
          >
            <Home className="w-4 h-4 mr-2" />
            返回首页
          </ZButton>
          <ZButton
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            刷新页面
          </ZButton>
        </div>

        {/* Stack Trace (Dev Only) */}
        {stack && (
          <div className="mt-12 text-left border rounded-xl p-4 bg-muted/30 overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <AlertCircle className="w-3 h-3" />
              Developer Stack Trace
            </div>
            <pre className="text-xs font-mono overflow-x-auto p-2 text-destructive/80 whitespace-pre-wrap break-all">
              {stack}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
