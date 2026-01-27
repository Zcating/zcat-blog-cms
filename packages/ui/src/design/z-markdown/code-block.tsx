/* eslint-disable react-hooks/static-components */
import React from 'react';

import { cn } from '@zcat/ui/shadcn';

import { ZMermaidCode } from './z-mermaid';
import { ZSyntaxHighlighterCode } from './z-syntax-highlighter';
import { ZThinking } from './z-thinking';

const rendererRegistry: Record<string, React.FC<any>> = {
  mermaid: ZMermaidCode,
  think: ZThinking,
  default: ZSyntaxHighlighterCode,
};

export function registerCodeComponent(name: string, component: React.FC<any>) {
  rendererRegistry[name.toLowerCase()] = component;
}

function useGetRenderer(
  language: string,
  customCodeComponents?: Record<string, React.ComponentType<any> | undefined>,
) {
  return (
    customCodeComponents?.[language.toLowerCase()] ||
    rendererRegistry[language.toLowerCase()] ||
    rendererRegistry.default
  );
}

export interface CodeBlockProps {
  language: string;
  children: React.ReactNode;
  className?: string;
  customCodeComponents?: Record<string, React.ComponentType<any> | undefined>;
}

export function CodeBlock({
  language = '',
  children,
  className,
  customCodeComponents,
  ...props
}: CodeBlockProps) {
  const Renderer = useGetRenderer(language, customCodeComponents);
  return (
    <Renderer
      className={cn('not-prose', className)}
      language={language}
      {...props}
    >
      {children}
    </Renderer>
  );
}
