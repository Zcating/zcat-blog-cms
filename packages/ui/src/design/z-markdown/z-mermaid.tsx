import React from 'react';

import { useWatch, useAsyncImport } from '@zcat/ui/hooks';
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
    suppressErrorRendering: true,
  });
  // Override parseError to prevent console logging and default behavior
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
      // Pass suppressErrors: true to prevent default error handling side effects
      // mermaid.parse returns Promise<boolean> in some versions or throws
      // We handle both cases
      const valid = await mermaid.parse(children, { suppressErrors: true });

      // If parse returns false explicitly (unlikely with suppressErrors: true in recent versions but possible)
      if (valid === false) {
        throw new Error('Mermaid parsing failed');
      }
      const result = await mermaid.render(id, children, ref.current);
      if (!result.svg) {
        return;
      }
      setSvg(result.svg);
    } catch {
      // Defensive cleanup: remove any error element Mermaid might have injected into the body
      const errorElement = document.querySelector(`[id^="d${id}"]`);
      if (errorElement) {
        errorElement.remove();
      }

      // Also check for generic mermaid error elements
      const genericError = document.querySelector('#dmermaid-error');
      if (genericError) {
        genericError.remove();
      }
    }
  });

  return (
    <ZView className="relative">
      <ZView
        className="flex flex-col items-center"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <ZView ref={ref} className="absolute h-0 w-0" />
    </ZView>
  );
}
