import {
  safeArray,
  useConstant,
  ZMarkdown,
  type ZMarkdownComponents,
  type ZMarkdownCodeProps,
} from '@zcat/ui';
import React from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { ExecutableCodeBlock } from '~/features';

import { DOCUMENT_CONFIGURES } from '../docs';

interface DocumentLoaderArgs {
  params: { component?: string };
}

export async function loader({ params }: DocumentLoaderArgs) {
  const componentName = (params.component ||
    'button') as keyof typeof DOCUMENT_CONFIGURES;

  try {
    const configure = DOCUMENT_CONFIGURES[componentName];
    if (!configure) {
      throw new Error(`文档 ${componentName} 不存在`);
    }

    const content = await configure.contentImporter().then((m) => m.default);
    return { content, title: configure.title };
  } catch {
    return {
      content: `# 404 Not Found\n\n文档 **${componentName}** 不存在。`,
      title: 'Not Found',
    };
  }
}

type DocumentLoaderData = Awaited<ReturnType<typeof loader>>;

export const Route = createFileRoute('/_layout/$component')({
  head: ({ match }) => {
    const data = match.loaderData as DocumentLoaderData | undefined;
    const title = data?.title || 'Docs';
    const label = data?.title || 'Component';
    return {
      meta: [
        { title: `${title} - @zcat/ui` },
        { name: 'description', content: `${label} documentation` },
      ],
    };
  },
  loader,
  component: DocsPage,
});

function patchComponents(components: ZMarkdownComponents) {
  return {
    ...components,
    code: (props: ZMarkdownCodeProps) => {
      if (props.language === 'typescript-demo') {
        return <ExecutableCodeBlock {...props} />;
      }
      return components.code(props);
    },
  };
}

function DocsPage() {
  const { content } = Route.useLoaderData();

  return (
    <ZMarkdown
      className="pb-40"
      content={content}
      components={patchComponents}
    />
  );
}
