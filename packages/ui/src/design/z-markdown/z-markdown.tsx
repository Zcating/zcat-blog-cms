import React from 'react';
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
import { isFunction, safeArray } from '@zcat/ui/utils';

import { ZView } from '../z-view';

import { CodeBlock } from './code-block';

// 引入 KaTeX 样式
import 'katex/dist/katex.min.css';

export type ZMarkdownCodeProps = React.ComponentProps<'code'> & {
  language: string;
};

export type ZMarkdownComponents = Omit<Components, 'code'> & {
  code: (props: ZMarkdownCodeProps) => React.ReactNode;
};

type NextComponents =
  | ZMarkdownComponents
  | ((prev: ZMarkdownComponents) => ZMarkdownComponents);

export interface ZMarkdownProps {
  content: string;
  style?: React.CSSProperties;
  className?: string;
  placeholder?: React.ReactNode;
  components?: NextComponents;
}

const MarkdownComponents: ZMarkdownComponents = {
  pre: ({ node, className: preClassName, children }) => {
    return <pre className={cn('mb-4!', preClassName)}>{children}</pre>;
  },
  code: CodeBlock,
  a({ href, children, ...props }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  },
  table({ className, ...props }) {
    return <Table className={cn('my-4', className)} {...props} />;
  },
  thead: TableHeader,
  tbody: TableBody,
  tr: TableRow,
  th: TableHead,
  td: TableCell,
};

const useComposeComponents = (
  prev: ZMarkdownComponents,
  next?: NextComponents,
): Components => {
  const composedComponents = React.useMemo(() => {
    if (isFunction(next)) {
      return next(prev);
    }
    if (next) {
      return { ...prev, ...next };
    }
    return prev;
  }, [prev, next]);

  return React.useMemo(() => {
    return {
      ...composedComponents,
      code: (props: React.ComponentProps<'code'>) => {
        const match = /language-([\w-]+)/.exec(props.className || '');
        const language = safeArray<string>(match)[1] || 'default';
        return composedComponents.code({
          ...props,
          language,
          className: cn(`not-prose`, props.className),
        });
      },
    };
  }, [composedComponents]);
};

export const ZMarkdown = React.memo(function ZMarkdown({
  content,
  style,
  className,
  placeholder,
  components,
}: ZMarkdownProps) {
  const isEmpty = !content && placeholder;

  const mergedComponents = useComposeComponents(MarkdownComponents, components);

  return (
    <article
      data-slot="markdown"
      style={style}
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
          components={mergedComponents}
        >
          {content}
        </ReactMarkdown>
      )}
    </article>
  );
});
