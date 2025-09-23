import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SyntaxHighlighter from "react-syntax-highlighter";
import { cn, useMount } from "@blog/components";

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
      className={cn(
        "prose prose-neutral max-w-none",
        "prose-headings:font-bold prose-headings:text-foreground",
        "prose-p:text-foreground prose-p:leading-7",
        "prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:underline",
        "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
        "prose-code:relative prose-code:rounded prose-code:text-md prose-code:font-mono",
        "prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg prose-pre:p-4",
        "prose-ul:text-foreground prose-ol:text-foreground",
        "prose-li:text-foreground",
        "prose-table:border prose-table:border-border",
        "prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-2",
        "prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2",
        "prose-hr:border-border",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 自定义代码块渲染
          code({ node, className, children }) {
            const match = /language-(\w+)/.exec(className || "");
            if (!match || typeof children !== "string") {
              return <code>{children}</code>;
            }

            return (
              <SyntaxHighlighter
                customStyle={{ background: "transparent" }}
                PreTag="div"
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
