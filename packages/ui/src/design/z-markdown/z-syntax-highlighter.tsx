/* eslint-disable react-hooks/static-components */
import React from 'react';
import {
  type PrismAsyncLight,
  type SyntaxHighlighterProps,
} from 'react-syntax-highlighter';

import { useAsyncImport, useWatch } from '@zcat/ui/hooks';
import { cn } from '@zcat/ui/shadcn/lib/utils';

import { getLanguageLoader } from './language-loader-map';

export interface ZSyntaxHighlighterProps extends SyntaxHighlighterProps {
  children: string;
  language?: string;
}

const SyntaxHighlighterImporter = async () => {
  const module =
    await import('react-syntax-highlighter/dist/esm/prism-async-light');
  return module.default;
};

const vsStyleImporter = async () => {
  const module =
    await import('react-syntax-highlighter/dist/esm/styles/prism/vs');
  return module.default;
};

export function ZSyntaxHighlighter({
  language = '',
  children,
  ...props
}: ZSyntaxHighlighterProps) {
  const SyntaxHighlighter = useAsyncImport<typeof PrismAsyncLight>(
    'react-syntax-highlighter',
    SyntaxHighlighterImporter,
  );

  const vsStyle = useAsyncImport<Record<string, React.CSSProperties>>(
    'vsStyle',
    vsStyleImporter,
  );

  useWatch([language, SyntaxHighlighter], async (currentLang, highlighter) => {
    if (!currentLang || !highlighter) {
      return;
    }
    const loader = await getLanguageLoader(currentLang);
    if (!loader) {
      return;
    }
    highlighter.registerLanguage(currentLang, loader);
  });

  if (!SyntaxHighlighter) {
    return null;
  }

  return (
    <SyntaxHighlighter
      language={language}
      PreTag={CustomPre}
      CodeTag={CustomCode}
      style={vsStyle}
      showLineNumbers
      wrapLines
      lineProps={{
        style: {
          display: 'block',
          paddingLeft: '3.5em',
          position: 'relative',
        },
      }}
      lineNumberStyle={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '3em',
        textAlign: 'right',
        paddingRight: '1em',
        userSelect: 'none',
        color: '#9CA3AF',
      }}
      {...props}
    >
      {children}
    </SyntaxHighlighter>
  );
}

type CustomPreProps = React.ComponentProps<'pre'>;

function CustomPre({ className, style, ...props }: CustomPreProps) {
  return (
    <pre
      style={{ margin: 0, padding: '0px 12px' }}
      className={cn(
        'border-0 bg-transparent overflow-hidden text-left whitespace-pre-wrap wrap-break-word tab-size-[4]',
        className,
      )}
      // style={style}
      {...props}
    />
  );
}

type CustomCodeProps = React.ComponentProps<'code'>;

function CustomCode({ className, style, ...props }: CustomCodeProps) {
  return (
    <code
      style={{ margin: 0 }}
      className="text-[16px] text-left whitespace-pre-wrap wrap-break-word tab-size-[4]"
      {...props}
    />
  );
}
