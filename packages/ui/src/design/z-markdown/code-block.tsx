/* eslint-disable react-hooks/static-components */
import React from 'react';

import { ZExecutableCode } from './z-executable-code';
import { ZMermaidCode } from './z-mermaid';
import { ZSyntaxHighlighterCode } from './z-syntax-highlighter';
import { ZThinking } from './z-thinking';

const rendererRegistry: Record<string, React.FC<any>> = {
  mermaid: ZMermaidCode,
  'typescript-demo': ZExecutableCode,
  think: ZThinking,
  default: ZSyntaxHighlighterCode,
};

function useGetRenderer(language: string) {
  return rendererRegistry[language.toLowerCase()] || rendererRegistry.default;
}

export interface CodeBlockProps {
  language: string;
  children: React.ReactNode;
  className?: string;
  extraComponents?: Record<string, React.ComponentType<any>>;
}

export function CodeBlock({
  language = '',
  children,
  className,
  extraComponents,
  ...props
}: CodeBlockProps) {
  const Renderer = useGetRenderer(language);
  console.log(language, Renderer);
  return (
    <Renderer
      language={language}
      className={className}
      extraComponents={extraComponents}
      {...props}
    >
      {children}
    </Renderer>
  );
}
