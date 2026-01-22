import { isFunction } from '@zcat/ui/utils';

type LoaderType = { default: () => any };

export const languageLoaderMap: Record<
  string,
  (() => Promise<LoaderType>) | undefined
> = {
  js: () =>
    import('react-syntax-highlighter/dist/esm/languages/prism/javascript'),
  javascript: () =>
    import('react-syntax-highlighter/dist/esm/languages/prism/javascript'),
  ts: () =>
    import('react-syntax-highlighter/dist/esm/languages/prism/typescript'),
  typescript: () =>
    import('react-syntax-highlighter/dist/esm/languages/prism/typescript'),
  jsx: () => import('react-syntax-highlighter/dist/esm/languages/prism/jsx'),
  tsx: () => import('react-syntax-highlighter/dist/esm/languages/prism/tsx'),
  py: () => import('react-syntax-highlighter/dist/esm/languages/prism/python'),
  python: () =>
    import('react-syntax-highlighter/dist/esm/languages/prism/python'),
  rb: () => import('react-syntax-highlighter/dist/esm/languages/prism/ruby'),
  ruby: () => import('react-syntax-highlighter/dist/esm/languages/prism/ruby'),
  sh: () => import('react-syntax-highlighter/dist/esm/languages/prism/bash'),
  bash: () => import('react-syntax-highlighter/dist/esm/languages/prism/bash'),
  shell: () => import('react-syntax-highlighter/dist/esm/languages/prism/bash'),
  yml: () => import('react-syntax-highlighter/dist/esm/languages/prism/yaml'),
  yaml: () => import('react-syntax-highlighter/dist/esm/languages/prism/yaml'),
  json: () => import('react-syntax-highlighter/dist/esm/languages/prism/json'),
  css: () => import('react-syntax-highlighter/dist/esm/languages/prism/css'),
  html: () =>
    import('react-syntax-highlighter/dist/esm/languages/prism/markup'),
  xml: () => import('react-syntax-highlighter/dist/esm/languages/prism/markup'),
  svg: () => import('react-syntax-highlighter/dist/esm/languages/prism/markup'),
  markup: () =>
    import('react-syntax-highlighter/dist/esm/languages/prism/markup'),
  md: () =>
    import('react-syntax-highlighter/dist/esm/languages/prism/markdown'),
  markdown: () =>
    import('react-syntax-highlighter/dist/esm/languages/prism/markdown'),
  go: () => import('react-syntax-highlighter/dist/esm/languages/prism/go'),
  java: () => import('react-syntax-highlighter/dist/esm/languages/prism/java'),
  c: () => import('react-syntax-highlighter/dist/esm/languages/prism/c'),
  cpp: () => import('react-syntax-highlighter/dist/esm/languages/prism/cpp'),
  sql: () => import('react-syntax-highlighter/dist/esm/languages/prism/sql'),
  docker: () =>
    import('react-syntax-highlighter/dist/esm/languages/prism/docker'),
  dockerfile: () =>
    import('react-syntax-highlighter/dist/esm/languages/prism/docker'),
  rust: () => import('react-syntax-highlighter/dist/esm/languages/prism/rust'),
  rs: () => import('react-syntax-highlighter/dist/esm/languages/prism/rust'),
  swift: () =>
    import('react-syntax-highlighter/dist/esm/languages/prism/swift'),
  kotlin: () =>
    import('react-syntax-highlighter/dist/esm/languages/prism/kotlin'),
  kt: () => import('react-syntax-highlighter/dist/esm/languages/prism/kotlin'),
};

export async function getLanguageLoader(language: string): Promise<() => any> {
  const importer = languageLoaderMap[language.toLowerCase()];
  if (!isFunction(importer)) {
    return () => null;
  }
  const module = await importer();
  return module.default;
}
