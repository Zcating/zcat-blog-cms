import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { cn } from '@zcat/ui/shadcn';
import { safeArray } from '@zcat/ui/utils';

import { CodeBlock } from './code-block';
import { ZThinking } from './z-thinking';

// 引入 KaTeX 样式
import 'katex/dist/katex.min.css';

export interface ZMarkdownProps {
  content: string;
  className?: string;
}

const MarkdownComponents: Components = {
  pre: ({ node, className, children }) => {
    return <pre className={cn('mb-4!', className)}>{children}</pre>;
  },

  code: ({ node, className, children }) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = safeArray<string>(match)[1] ?? '';

    // Handle think tags
    if (language === 'think') {
      return <ZThinking>{children}</ZThinking>;
    }

    return (
      <CodeBlock language={language} className={className}>
        {children}
      </CodeBlock>
    );
  },
  // 自定义链接渲染
  a({ href, children, ...props }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  },
};

export function ZMarkdown({ content, className }: ZMarkdownProps) {
  return (
    <article
      data-slot="markdown"
      className={cn(
        'prose prose-zinc max-w-none',
        'prose-headings:font-bold prose-headings:text-foreground',
        'prose-p:text-foreground prose-p:leading-7',
        'prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:underline',
        'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',
        'prose-code:border-none prose-code:text-black',
        'prose-pre:mb-4 prose-pre:bg-transparent',
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
        components={MarkdownComponents}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
