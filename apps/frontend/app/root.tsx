import { ZNotification } from '@zcat/ui';
import React from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigate,
} from 'react-router';

import { HttpClient } from './api';
import {
  initServerStorage,
  runWithRequest,
} from './api/context/request-context';
import { authMiddleware } from './auth/auth-middleware';

import type { Route } from './+types/root';

import './app.css';

export const middleware = [
  async (
    { request }: Parameters<Route.MiddlewareFunction>[0],
    next: () => Promise<unknown>,
  ) => {
    await initServerStorage();
    return runWithRequest(request, () => authMiddleware({ request }, next));
  },
];

export function meta() {
  return [
    { title: 'ZCAT-BLOG-CMS' },
    { name: 'description', content: 'ZCAT-BLOG-CMS' },
  ];
}

export const links: Route.LinksFunction = () => [];

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    return HttpClient.subscribeErrorEvent(
      (error: { _tag: string; message: string }) => {
        if (error.message === 'Unauthorized') {
          navigate('/login');
          return;
        }
        ZNotification.error(error.message);
        console.log('error', error);
      },
    );
  }, [navigate]);

  return (
    <html lang="en" data-theme="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
