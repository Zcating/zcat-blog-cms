import React from 'react';
import {
  type PrismAsyncLight,
  type SyntaxHighlighterProps,
} from 'react-syntax-highlighter';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vs';
import { Copy } from 'lucide-react';

import { useMount, useToggleValue, useWatch } from '@zcat/ui/hooks';
import { cn } from '@zcat/ui/shadcn/lib/utils';
import { isFunction } from '@zcat/ui/utils';

import { languageLoaderMap } from './language-loader-map';
import { Button } from '../../shadcn/ui/button';
import { ZView } from '../z-view';
import { FoldAnimation } from '@zcat/ui/animation';

export interface CodeBlockProps extends SyntaxHighlighterProps {
  children: string;
  className?: string;
}

let SyntaxHighlighterCache: typeof PrismAsyncLight | undefined = void 0;

export function CodeBlock({
  language = '',
  children,
  className,
  ...props
}: CodeBlockProps) {
  const [SyntaxHighlighter, setSyntaxHighlighter] =
    React.useState<typeof PrismAsyncLight>();
  const [isCollapsed, onToggleCollapsed] = useToggleValue(true);

  useMount(async () => {
    if (!SyntaxHighlighterCache) {
      // prettier-ignore
      const module = await import('react-syntax-highlighter/dist/esm/prism-async-light');
      SyntaxHighlighterCache = module.default;
    }
    setSyntaxHighlighter(() => SyntaxHighlighterCache);
  });

  useWatch([language, SyntaxHighlighter], async (currentLang, highlighter) => {
    if (!currentLang && !highlighter) {
      return;
    }
    const loaderFn = languageLoaderMap[currentLang.toLowerCase()];
    if (!isFunction(loaderFn)) {
      return;
    }
    const loader = await loaderFn();
    highlighter?.registerLanguage(language, loader.default as any);
  });

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      // TODO: show toast
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!SyntaxHighlighter) {
    return null;
  }

  return (
    <ZView
      className={cn(
        'relative overflow-hidden bg-white border rounded-xl border-markdown-code-border',
        className,
      )}
    >
      <ZView
        className="flex items-center justify-between border-b border-markdown-code-border px-4 py-2"
        backgroundColor="rgba(237,237,237,1)"
      >
        <ZView className="flex items-center gap-1.5 text-markdown-code-lang">
          {language}
        </ZView>
        <ZView className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onCopy}>
            <Copy className="text-gray-500" size={14} />
            <p>复制</p>
          </Button>
          <Button size="sm" variant="outline" onClick={onToggleCollapsed}>
            <p>{isCollapsed ? '折叠' : '展开'}</p>
          </Button>
        </ZView>
      </ZView>
      <FoldAnimation isOpen={isCollapsed} className="py-3">
        <SyntaxHighlighter
          language={language}
          customStyle={{
            margin: 0,
            fontSize: '18px',
            background: 'transparent',
            border: 0,
            backgroundColor: 'white',
          }}
          style={vscDarkPlus}
          wrapLongLines
          wrapLines
          showLineNumbers
          {...props}
        >
          {children}
        </SyntaxHighlighter>
      </FoldAnimation>
    </ZView>
  );
}
