import { useTheme } from 'next-themes';
import React from 'react';

import { useAsyncImport, useWatch } from '@zcat/ui/hooks';
import { cn } from '@zcat/ui/shadcn/lib/utils';

import { ZView } from '../z-view';

import type { Mermaid } from 'mermaid';

export interface ZMermaidProps {
  chart: string;
  className?: string;
}

const mermaidImporter = () => import('mermaid');

export function ZMermaid({ chart, className }: ZMermaidProps) {
  const [svg, setSvg] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const { theme, systemTheme } = useTheme();

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const mermaidTheme = currentTheme === 'dark' ? 'dark' : 'default';

  const mermaid = useAsyncImport<Mermaid>('mermaid', mermaidImporter);

  useWatch([chart, mermaidTheme, mermaid], async (chart, theme, m) => {
    if (!m) {
      return;
    }

    try {
      m.initialize({
        startOnLoad: false,
        theme: theme as any,
        securityLevel: 'loose',
        fontFamily: 'inherit',
      });

      const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
      const { svg } = await m.render(id, chart);
      setSvg(svg);
      setError(null);
    } catch (err) {
      console.error('Mermaid render error:', err);
      setError('Failed to render diagram');
      setSvg('');
    }
  });

  if (error) {
    return (
      <ZView
        className={cn(
          'p-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-md',
          className,
        )}
      >
        {error}
      </ZView>
    );
  }

  if (!svg) {
    return (
      <ZView
        className={cn(
          'p-4 text-sm text-muted-foreground animate-pulse',
          className,
        )}
      >
        Loading diagram...
      </ZView>
    );
  }

  return (
    <ZView
      className={cn(
        'flex justify-center p-4 bg-white dark:bg-zinc-950 rounded-md overflow-x-auto',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
