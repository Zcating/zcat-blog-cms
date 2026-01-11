import React from 'react';
import remarkGfm from 'remark-gfm';
import SyntaxHighlighter from 'react-syntax-highlighter';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import ReactMarkdown from 'react-markdown';

import 'katex/dist/katex.min.css'; // 引入 KaTeX 样式
import { cn } from '@zcat/ui/shadcn';
import { ZView } from '../z-view';

export interface ZMarkdownProps {
  content: string;
  className?: string;
}

export function ZMarkdown({ content, className }: ZMarkdownProps) {
  // const { default: ReactMarkdown } = React.use(import("react-markdown"));

  return (
    <React.Suspense
      fallback={
        <ZView className="flex items-center justify-center h-full">
          Loading...
        </ZView>
      }
    >
      <article
        data-slot="markdown"
        className={cn(
          'prose prose-neutral max-w-none',
          'prose-headings:font-bold prose-headings:text-foreground',
          'prose-p:text-foreground prose-p:leading-7',
          'prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:underline',
          'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',
          'prose-code:border-none prose-code:text-black',
          'prose-pre:bg-gray-200',
          'prose-ul:text-foreground prose-ol:text-foreground',
          'prose-li:text-foreground',
          'prose-table:border prose-table:border-border',
          'prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-2',
          'prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2',
          'prose-hr:border-border',
          className,
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]} // 渲染数学公式
          components={{
            code: ({ node, className, children }) => {
              const match = /language-(\w+)/.exec(className || '');
              if (!match || typeof children !== 'string') {
                return <code className={className}>{children}</code>;
              }

              return (
                <SyntaxHighlighter
                  customStyle={{ background: 'transparent' }}
                  // PreTag={React.Fragment}
                  PreTag="pre"
                  language={match[1]}
                  wrapLongLines
                  wrapLines
                  children={children}
                />
              );
            },
            // 自定义链接渲染
            a({ href, children, ...props }) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                >
                  {children}
                </a>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </React.Suspense>
  );
}
