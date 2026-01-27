import React from 'react';

import { useWatch, useAsyncImport } from '@zcat/ui/hooks';
import { cn } from '@zcat/ui/shadcn';

import { ZView } from '../z-view';

import { ZCodeCard } from './z-code-card';

import type { Mermaid } from 'mermaid';

function generateId() {
  return Date.now().toString();
}

export interface ZMermaidProps {
  children: string;
  language?: string;
  className?: string;
}

const mermaidImporter = async () => {
  const mermaidModule = await import('mermaid');
  const mermaid = mermaidModule.default;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'inherit',
    suppressErrorRendering: true,
  });
  mermaid.parseError = () => {};
  return mermaid;
};

export function ZMermaid({ children, className }: ZMermaidProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const mermaid = useAsyncImport<Mermaid>('mermaid', mermaidImporter);

  const [svg, setSvg] = React.useState('');
  useWatch([mermaid, children], async (mermaid, children) => {
    if (!mermaid || !ref.current) {
      return;
    }
    const id = `mermaid-${generateId()}`;
    try {
      const valid = await mermaid.parse(children, { suppressErrors: true });

      if (valid === false) {
        throw new Error('Mermaid parsing failed');
      }
      const result = await mermaid.render(id, children, ref.current);
      if (!result.svg) {
        return;
      }
      setSvg(result.svg);
    } catch {
      const errorElement = document.querySelector(`[id^="d${id}"]`);
      if (errorElement) {
        errorElement.remove();
      }

      const genericError = document.querySelector('#dmermaid-error');
      if (genericError) {
        genericError.remove();
      }
    }
  });

  return (
    <ZView className={cn('relative', className)}>
      <ZView
        className="flex flex-col items-center"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <ZView ref={ref} className="absolute h-0 w-0" />
    </ZView>
  );
}

export function ZMermaidCode({
  language = 'mermaid',
  children,
  className,
}: ZMermaidProps) {
  return (
    <ZCodeCard language={language} className={className}>
      <ZMermaid>{children}</ZMermaid>
    </ZCodeCard>
  );
}
