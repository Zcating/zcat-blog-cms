import {
  safeArray,
  useConstant,
  ZMarkdown,
  type ZMarkdownComponents,
} from '@zcat/ui';
import React from 'react';

import { ExecutableCodeBlock } from '~/features';

import type { Route } from './+types/index.page';

interface MarkdownConfig {
  title: string;
  contentImporter: () => Promise<typeof import('*.md?raw')>;
}

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
  const componentName = params.component || 'button';

  const configures: Record<string, MarkdownConfig | undefined> = {
    button: {
      title: 'Button',
      contentImporter: () => import('../docs/button.md?raw'),
    },
    select: {
      title: 'Select',
      contentImporter: () => import('../docs/select.md?raw'),
    },
    pagination: {
      title: 'Pagination',
      contentImporter: () => import('../docs/pagination.md?raw'),
    },
    view: {
      title: 'View',
      contentImporter: () => import('../docs/view.md?raw'),
    },
    avatar: {
      title: 'Avatar',
      contentImporter: () => import('../docs/avatar.md?raw'),
    },
    'z-image': {
      title: 'Image',
      contentImporter: () => import('../docs/z-image.md?raw'),
    },
    'z-waterfall': {
      title: 'Waterfall',
      contentImporter: () => import('../docs/z-waterfall.md?raw'),
    },
    cascader: {
      title: 'Cascader',
      contentImporter: () => import('../docs/cascader.md?raw'),
    },
    'z-date-picker': {
      title: 'Date Picker',
      contentImporter: () => import('../docs/z-date-picker.md?raw'),
    },
    markdown: {
      title: 'Markdown',
      contentImporter: () => import('../docs/markdown.md?raw'),
    },
    'z-dialog': {
      title: 'Dialog',
      contentImporter: () => import('../docs/z-dialog.md?raw'),
    },
    'z-notification': {
      title: 'Message',
      contentImporter: () => import('../docs/z-notification.md?raw'),
    },
    'z-chat': {
      title: 'Chat',
      contentImporter: () => import('../docs/z-chat.md?raw'),
    },
    'z-textarea': {
      title: 'Textarea',
      contentImporter: () => import('../docs/z-textarea.md?raw'),
    },
    'z-sidebar': {
      title: 'Sidebar',
      contentImporter: () => import('../docs/z-sidebar.md?raw'),
    },
    'stagger-reveal': {
      title: 'StaggerReveal',
      contentImporter: () => import('../docs/stagger-reveal.md?raw'),
    },
    'fold-animation': {
      title: 'FoldAnimation',
      contentImporter: () => import('../docs/fold-animation.md?raw'),
    },
  };

  try {
    const configure = configures[componentName];
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
    code: (props) => {
      if (props.language === 'typescript-demo') {
        return (
          <ExecutableCodeBlock
            language={props.language}
            className={props.className}
          >
            {props.children}
          </ExecutableCodeBlock>
        );
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
