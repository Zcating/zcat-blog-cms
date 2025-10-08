import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SyntaxHighlighter from 'react-syntax-highlighter';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // 引入 KaTeX 样式

import { useMount } from '../hooks';
import { classnames } from '../utils';

export interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  useMount(() => {
    setIsMounted(true);
  });

  return isMounted ? (
    <article
      data-slot="markdown"
      className={classnames(
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
                PreTag={React.Fragment}
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
  ) : (
    <div className="flex items-center justify-center h-full">Loading...</div>
  );
}
