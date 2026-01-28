import {
  safeArray,
  useConstant,
  ZMarkdown,
  type ZMarkdownComponents,
  type ZMarkdownCodeProps,
} from '@zcat/ui';
import React from 'react';

import { ExecutableCodeBlock } from '~/features';

import { DOCUMENT_CONFIGURES } from '../docs';

import type { Route } from './+types/index.page';

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: `${loaderData?.title || 'Docs'} - @zcat/ui` },
    {
      name: 'description',
      content: `${loaderData?.title || 'Component'} documentation`,
    },
  ];
}

export async function clientLoader({ params }: Route.LoaderArgs) {
  const componentName = (params.component ||
    'button') as keyof typeof DOCUMENT_CONFIGURES;

  try {
    const configure = DOCUMENT_CONFIGURES[componentName];
    if (!configure) {
      throw new Error(`文档 ${componentName} 不存在`);
    }

    const content = await configure.contentImporter().then((m) => m.default);
    return { content, title: configure.title };
  } catch (e) {
    return {
      content: `# 404 Not Found\n\n文档 **${componentName}** 不存在。`,
      title: 'Not Found',
    };
  }
}

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

export default function DocsPage(props: Route.ComponentProps) {
  const { content } = props.loaderData;

  return (
    <ZMarkdown
      className="pb-40"
      content={content}
      components={patchComponents}
    />
  );
}
