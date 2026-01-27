import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { cn } from '@zcat/ui/shadcn';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@zcat/ui/shadcn/ui/table';
import { safeArray } from '@zcat/ui/utils';

import { ZView } from '../z-view';

import { CodeBlock } from './code-block';

// 引入 KaTeX 样式
import 'katex/dist/katex.min.css';

export interface ZMarkdownProps {
  content: string;
  className?: string;
  placeholder?: React.ReactNode;
  extraComponents?: Record<string, React.ComponentType<any>>;
}

export function ZMarkdown({
  content,
  className,
  placeholder,
  extraComponents,
}: ZMarkdownProps) {
  const isEmpty = !content && placeholder;

  const MarkdownComponents: Components = {
    pre: ({ node, className: preClassName, children }) => {
      return <pre className={cn('mb-4!', preClassName)}>{children}</pre>;
    },

    code: ({ node, className: codeClassName, children }) => {
      const match = /language-([\w-]+)/.exec(codeClassName || '');
      const language = safeArray<string>(match)[1] ?? '';
      console.log(codeClassName, language);
      return (
        <CodeBlock
          language={language}
          className={codeClassName}
          extraComponents={extraComponents}
        >
          {children}
        </CodeBlock>
      );
    },
    a({ href, children, ...props }) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
    table({ children }) {
      return <Table className="my-4">{children}</Table>;
    },
    thead({ children }) {
      return <TableHeader>{children}</TableHeader>;
    },
    tbody({ children }) {
      return <TableBody>{children}</TableBody>;
    },
    tr({ children }) {
      return <TableRow>{children}</TableRow>;
    },
    th({ children, ...props }) {
      return <TableHead {...props}>{children}</TableHead>;
    },
    td({ children, ...props }) {
      return <TableCell {...props}>{children}</TableCell>;
    },
  };

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
        'prose-hr:border-border',
        className,
      )}
    >
      {isEmpty ? (
        <ZView className="text-muted-foreground text-sm py-8 text-center">
          {placeholder}
        </ZView>
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={MarkdownComponents}
        >
          {content}
        </ReactMarkdown>
      )}
    </article>
  );
}
