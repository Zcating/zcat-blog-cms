import React from 'react';
import {
  type PrismAsyncLight,
  type SyntaxHighlighterProps,
} from 'react-syntax-highlighter';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';

import { useMount, useWatch } from '@zcat/ui/hooks';
import { isFunction } from '@zcat/ui/utils';

import { languageLoaderMap } from './language-loader-map';

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

  if (!SyntaxHighlighter) {
    return <code className={className}>{children}</code>;
  }

  return (
    <SyntaxHighlighter
      language={language}
      customStyle={{ margin: 0, fontSize: '16px' }}
      style={vscDarkPlus}
      wrapLongLines
      wrapLines
      showLineNumbers
      {...props}
    >
      {children}
    </SyntaxHighlighter>
  );
}
