import React from 'react';

import { useAsync, useAsyncImport } from '@zcat/ui/hooks';
import { cn } from '@zcat/ui/shadcn/lib/utils';

import { ZView } from '../z-view';

import type { Mermaid } from 'mermaid';

function generateId() {
  return Date.now().toString();
}

export interface ZMermaidProps {
  children: string;
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
  });
  return mermaid;
};

export function ZMermaid({ children, className }: ZMermaidProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const mermaid = useAsyncImport<Mermaid>('mermaid', mermaidImporter);

  const [svg] = useAsync(
    '',
    async () => {
      if (!mermaid) {
        return '';
      }

      const id = `mermaid-${generateId()}`;
      const result = await mermaid.render(id, children);
      return result.svg;
    },
    [mermaid, children],
  );

  return (
    <ZView
      ref={ref}
      className={cn(
        'flex justify-center p-4 rounded-md overflow-x-auto',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
