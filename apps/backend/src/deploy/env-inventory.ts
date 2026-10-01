import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

import ts from 'typescript';

export type EnvObligation = 'required' | 'defaulted' | 'unknown';

export type EnvAccessPath =
  | 'member'
  | 'destructured'
  | 'dynamic-wrapper'
  | 'loader-wrapper'
  | 'file-loader';

export interface EnvReadSite {
  readonly file: string;
  readonly line: number;
  readonly path: EnvAccessPath;
  readonly obligation: EnvObligation;
}

export interface EnvRead {
  readonly name: string;
  readonly obligation: EnvObligation;
  readonly paths: ReadonlySet<EnvAccessPath>;
  readonly sites: readonly EnvReadSite[];
}

export interface UnresolvedEnvRead {
  readonly file: string;
  readonly line: number;
  readonly snippet: string;
  readonly reason: string;
  readonly manualStep: string;
}

export interface EnvInventory {
  readonly reads: readonly EnvRead[];
  readonly unresolved: readonly UnresolvedEnvRead[];
}

const OBLIGATION_RANK: Record<EnvObligation, number> = {
  unknown: 0,
  defaulted: 1,
  required: 2,
};

const SCANNED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);

const SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.nyc_output',
  '.output',
  '.tanstack',
  '.nitro',
  '.vite',
  '.git',
  '.worktrees',
  'worktrees',
  'playwright-report',
  'test-results',
]);

const NOT_DEPLOYED_RUNTIME = /\.(?:test|spec)\.[^.]+$|\.d\.ts$/;

const ENV_NAME = /^[A-Z][A-Z0-9_]*$/;

export const VITE_BUILT_IN_ENV: ReadonlySet<string> = new Set([
  'DEV',
  'PROD',
  'SSR',
  'MODE',
  'BASE_URL',
  'ASSETS_PREFIX',
]);

export const ENV_PROVIDER_MODULES: ReadonlyMap<string, string> = new Map([
  ['prisma/config', 'env'],
]);

export const ENV_LOADER_FUNCTIONS: ReadonlySet<string> = new Set(['loadEnv']);

export const FILE_ENV_LOADER_FUNCTIONS: ReadonlySet<string> = new Set([
  'loadEnvConfig',
]);

export const HOST_PROVIDED_ENV: ReadonlyMap<string, string> = new Map([
  ['CI', 'set by the test runner, never by a deployment'],
]);

export const CONTAINER_ONLY_KEYS: ReadonlyMap<string, string> = new Map([
  [
    'POSTGRES_DB',
    'consumed by the cms_pg container, not by the backend process',
  ],
  ['POSTGRES_USER', 'consumed by the cms_pg container and the migration role'],
  [
    'POSTGRES_PASSWORD',
    'consumed by the cms_pg container, never by the backend process',
  ],
]);

export const CONTAINER_ENV_TEMPLATE = '.env.deploy.example';

export const PUSH_ENV_TEMPLATE = '.env.deploy.push.example';

const APP_ROOTS = ['apps/', 'packages/'];

export type DeployScope = 'container' | 'operator' | 'both';

export function envFileNameFor(template: string): string {
  return template.replace(/\.example$/, '');
}

export function deployScope(read: EnvRead): DeployScope {
  const inApp = read.sites.filter((site) =>
    APP_ROOTS.some((prefix) => site.file.startsWith(prefix)),
  ).length;
  if (inApp === 0) return 'operator';
  return inApp === read.sites.length ? 'container' : 'both';
}

export function readComposeEnvFiles(root: string): Set<string> {
  const text = readFileSync(join(root, 'docker-compose.yml'), 'utf8');
  const files = new Set<string>();
  let insideEnvFile = false;
  for (const raw of text.split(/\r?\n/)) {
    if (/^\s*env_file:/.test(raw)) {
      insideEnvFile = true;
      const inline = /^\s*env_file:\s*(\S+)\s*$/.exec(raw);
      if (inline?.[1]) files.add(inline[1]);
      continue;
    }
    if (!insideEnvFile) continue;
    const item = /^\s+-\s+(\S+)\s*$/.exec(raw);
    if (item?.[1]) files.add(item[1]);
    else insideEnvFile = false;
  }
  return files;
}

export const MANUAL_DYNAMIC_STEP = [
  'rewrite the access into a derivable shape, or extend',
  'apps/backend/src/deploy/env-inventory.ts with a rule plus a synthetic',
  'fixture in env-inventory.test.ts that proves the rule works.',
].join(' ');

export const MANUAL_IMPORT_META_STEP = [
  'rename it so it is VITE_ prefixed, or add it to VITE_BUILT_IN_ENV in',
  'env-inventory.ts if Vite itself defines it.',
].join(' ');

interface ReadAccumulator {
  obligation: EnvObligation;
  paths: Set<EnvAccessPath>;
  sites: EnvReadSite[];
}

interface Accessor {
  readonly fnName: string;
  readonly param: string;
  readonly paramIndex: number;
  readonly obligation: EnvObligation;
}

interface LoadedFile {
  readonly rel: string;
  readonly raw: string;
  readonly source: ts.SourceFile;
}

function collectSourceFiles(root: string): string[] {
  const files: string[] = [];
  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const abs = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) walk(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!SCANNED_EXTENSIONS.has(extname(entry.name))) continue;
      if (NOT_DEPLOYED_RUNTIME.test(entry.name)) continue;
      files.push(abs);
    }
  };
  walk(root);
  return files;
}

function loadFiles(root: string): LoadedFile[] {
  return collectSourceFiles(root).map((abs) => {
    const raw = readFileSync(abs, 'utf8');
    return {
      rel: relative(root, abs).split('\\').join('/'),
      raw,
      source: ts.createSourceFile(
        abs,
        raw,
        ts.ScriptTarget.Latest,
        true,
        extname(abs) === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      ),
    };
  });
}

function isProcessEnv(node: ts.Node): boolean {
  return (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'process' &&
    node.name.text === 'env'
  );
}

function isImportMetaEnv(node: ts.Node): boolean {
  return (
    ts.isPropertyAccessExpression(node) &&
    ts.isMetaProperty(node.expression) &&
    node.name.text === 'env'
  );
}

function hasThrow(node: ts.Node): boolean {
  let found = false;
  const visit = (child: ts.Node): void => {
    if (found) return;
    if (ts.isThrowStatement(child)) {
      found = true;
      return;
    }
    child.forEachChild(visit);
  };
  node.forEachChild(visit);
  return found;
}

function findAccessors(files: readonly LoadedFile[]): Accessor[] {
  const accessors: Accessor[] = [];

  const record = (
    fnName: string,
    params: readonly ts.ParameterDeclaration[],
    body: ts.Node | undefined,
  ): void => {
    if (!body) return;
    const obligation: EnvObligation = hasThrow(body) ? 'required' : 'defaulted';
    params.forEach((param, paramIndex) => {
      if (!ts.isIdentifier(param.name)) return;
      const paramName = param.name.text;
      let readsDynamically = false;
      const visit = (node: ts.Node): void => {
        if (
          ts.isElementAccessExpression(node) &&
          isProcessEnv(node.expression) &&
          node.argumentExpression.getText() === paramName
        ) {
          readsDynamically = true;
          return;
        }
        if (
          ts.isVariableDeclaration(node) &&
          ts.isObjectBindingPattern(node.name) &&
          node.initializer &&
          isProcessEnv(node.initializer) &&
          node.name.elements.some(
            (element) =>
              ts.isIdentifier(element.propertyName ?? element.name) &&
              (element.propertyName ?? element.name).getText() === paramName,
          )
        ) {
          readsDynamically = true;
          return;
        }
        node.forEachChild(visit);
      };
      visit(body);
      if (readsDynamically) {
        accessors.push({ fnName, param: paramName, paramIndex, obligation });
      }
    });
  };

  for (const file of files) {
    for (const statement of file.source.statements) {
      if (ts.isFunctionDeclaration(statement) && statement.name) {
        record(
          statement.name.text,
          [...statement.parameters],
          statement.body ?? undefined,
        );
        continue;
      }
      const declarations = ts.isVariableStatement(statement)
        ? statement.declarationList.declarations
        : [];
      for (const declaration of declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        const init = declaration.initializer;
        if (!init) continue;
        if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
          record(
            declaration.name.text,
            [...init.parameters],
            init.body as ts.Node | undefined,
          );
        }
      }
    }
  }

  return accessors;
}

function addRead(
  reads: Map<string, ReadAccumulator>,
  name: string,
  site: EnvReadSite,
): void {
  let entry = reads.get(name);
  if (!entry) {
    entry = { obligation: 'unknown', paths: new Set(), sites: [] };
    reads.set(name, entry);
  }
  if (OBLIGATION_RANK[site.obligation] > OBLIGATION_RANK[entry.obligation]) {
    entry.obligation = site.obligation;
  }
  entry.paths.add(site.path);
  entry.sites.push(site);
}

function stringLiteralValue(node: ts.Node): string | undefined {
  return ts.isStringLiteralLike(node) ? node.text : undefined;
}

function unwrapExpression(node: ts.Expression): ts.Expression {
  if (
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    ts.isParenthesizedExpression(node) ||
    ts.isNonNullExpression(node)
  ) {
    return unwrapExpression(node.expression);
  }
  return node;
}

export function scanEnvInventory(root: string): EnvInventory {
  const files = loadFiles(root);
  const reads = new Map<string, ReadAccumulator>();
  const unresolved: UnresolvedEnvRead[] = [];
  const accessors = findAccessors(files);
  const resolvedAccessors = new Set<Accessor>();

  const site = (
    file: LoadedFile,
    node: ts.Node,
    path: EnvAccessPath,
    obligation: EnvObligation,
  ): EnvReadSite => {
    const { line } = file.source.getLineAndCharacterOfPosition(
      node.getStart(file.source),
    );
    return { file: file.rel, line: line + 1, path, obligation };
  };

  const unresolvedAt = (
    file: LoadedFile,
    node: ts.Node,
    reason: string,
    manualStep: string,
  ): void => {
    const { line, character } = file.source.getLineAndCharacterOfPosition(
      node.getStart(file.source),
    );
    const snippet = file.raw.split(/\r?\n/)[line]?.slice(character).trim();
    unresolved.push({
      file: file.rel,
      line: line + 1,
      snippet: snippet ?? '',
      reason,
      manualStep,
    });
  };

  for (const accessor of accessors) {
    for (const file of files) {
      const visit = (node: ts.Node): void => {
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === accessor.fnName
        ) {
          const arg = node.arguments[accessor.paramIndex];
          const name = arg ? stringLiteralValue(arg) : undefined;
          if (name === undefined) {
            if (arg) {
              unresolvedAt(
                file,
                node,
                `argument ${accessor.paramIndex} of ${accessor.fnName}() is not a string literal`,
                MANUAL_DYNAMIC_STEP,
              );
            }
            return;
          }
          if (!ENV_NAME.test(name)) {
            unresolvedAt(
              file,
              node,
              `${accessor.fnName}() is called with ${name}, which is not UPPER_SNAKE_CASE`,
              MANUAL_DYNAMIC_STEP,
            );
            return;
          }
          resolvedAccessors.add(accessor);
          addRead(
            reads,
            name,
            site(file, node, 'dynamic-wrapper', accessor.obligation),
          );
          return;
        }
        node.forEachChild(visit);
      };
      visit(file.source);
    }
  }

  const dynamicParams = new Set(accessors.map((accessor) => accessor.param));

  for (const file of files) {
    const loaderBindings = new Map<string, EnvAccessPath>();

    const visit = (node: ts.Node): void => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer
      ) {
        const init = unwrapExpression(node.initializer);
        if (ts.isCallExpression(init) && ts.isIdentifier(init.expression)) {
          const loader = init.expression.text;
          if (ENV_LOADER_FUNCTIONS.has(loader)) {
            loaderBindings.set(node.name.text, 'loader-wrapper');
          } else if (FILE_ENV_LOADER_FUNCTIONS.has(loader)) {
            loaderBindings.set(node.name.text, 'file-loader');
          }
        }
      }
      node.forEachChild(visit);
    };
    visit(file.source);

    const walk = (node: ts.Node): void => {
      if (
        ts.isPropertyAccessExpression(node) &&
        isProcessEnv(node.expression)
      ) {
        const name = node.name.text;
        if (ENV_NAME.test(name)) {
          addRead(reads, name, site(file, node, 'member', 'unknown'));
        } else {
          unresolvedAt(
            file,
            node,
            `process.env.${name} is not UPPER_SNAKE_CASE, so it is not a deployment variable`,
            MANUAL_DYNAMIC_STEP,
          );
        }
        return;
      }

      if (ts.isElementAccessExpression(node) && isProcessEnv(node.expression)) {
        const literal = stringLiteralValue(node.argumentExpression);
        if (literal !== undefined && ENV_NAME.test(literal)) {
          addRead(
            reads,
            literal,
            site(file, node, 'dynamic-wrapper', 'unknown'),
          );
          return;
        }
        if (
          ts.isIdentifier(node.argumentExpression) &&
          dynamicParams.has(node.argumentExpression.text)
        ) {
          const bound = accessors.find(
            (accessor) => accessor.param === node.argumentExpression.getText(),
          );
          if (bound && resolvedAccessors.has(bound)) return;
        }
        unresolvedAt(
          file,
          node,
          literal === undefined
            ? 'process.env[...] is a dynamic read this scan cannot tie to a literal call site'
            : `${literal} is not UPPER_SNAKE_CASE, so it is not a deployment variable`,
          MANUAL_DYNAMIC_STEP,
        );
        return;
      }

      if (
        ts.isPropertyAccessExpression(node) &&
        isImportMetaEnv(node.expression)
      ) {
        const name = node.name.text;
        if (name.startsWith('VITE_')) {
          addRead(reads, name, site(file, node, 'member', 'unknown'));
        } else if (!VITE_BUILT_IN_ENV.has(name)) {
          unresolvedAt(
            file,
            node,
            `import.meta.env.${name} is neither VITE_ prefixed nor a Vite built-in`,
            MANUAL_IMPORT_META_STEP,
          );
        }
        return;
      }

      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        loaderBindings.has(node.expression.text) &&
        ENV_NAME.test(node.name.text)
      ) {
        addRead(
          reads,
          node.name.text,
          site(
            file,
            node,
            loaderBindings.get(node.expression.text)!,
            'unknown',
          ),
        );
        return;
      }

      if (
        ts.isVariableDeclaration(node) &&
        ts.isObjectBindingPattern(node.name) &&
        node.initializer &&
        (isProcessEnv(node.initializer) ||
          isImportMetaEnv(node.initializer) ||
          (ts.isIdentifier(node.initializer) &&
            loaderBindings.has(node.initializer.text)))
      ) {
        const path: EnvAccessPath =
          isProcessEnv(node.initializer) || isImportMetaEnv(node.initializer)
            ? 'destructured'
            : loaderBindings.get(node.initializer.getText())!;
        for (const element of node.name.elements) {
          const key = element.propertyName ?? element.name;
          const keyName =
            ts.isIdentifier(key) || ts.isStringLiteralLike(key)
              ? key.text
              : undefined;
          if (keyName === undefined) {
            unresolvedAt(
              file,
              node,
              'computed key in a destructured environment read',
              MANUAL_DYNAMIC_STEP,
            );
            continue;
          }
          if (!ENV_NAME.test(keyName)) {
            unresolvedAt(
              file,
              node,
              `destructured ${keyName} is not UPPER_SNAKE_CASE`,
              MANUAL_DYNAMIC_STEP,
            );
            continue;
          }
          addRead(reads, keyName, site(file, node, path, 'unknown'));
        }
        return;
      }

      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const provider = providerNameFor(file, node.expression.text);
        if (provider) {
          const name = stringLiteralValue(node.arguments[0] ?? node);
          if (name !== undefined && ENV_NAME.test(name)) {
            addRead(
              reads,
              name,
              site(file, node, 'dynamic-wrapper', 'required'),
            );
            return;
          }
          if (node.arguments.length > 0) {
            unresolvedAt(
              file,
              node,
              `argument 0 of ${provider}() is not a string literal`,
              MANUAL_DYNAMIC_STEP,
            );
            return;
          }
        }
      }

      node.forEachChild(walk);
    };

    walk(file.source);
  }

  const ordered: EnvRead[] = [...reads.entries()]
    .map(([name, entry]) => ({
      name,
      obligation: entry.obligation,
      paths: new Set(entry.paths),
      sites: entry.sites,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  unresolved.sort((a, b) =>
    `${a.file}:${a.line}`.localeCompare(`${b.file}:${b.line}`),
  );

  return { reads: ordered, unresolved };
}

function providerNameFor(file: LoadedFile, local: string): string | undefined {
  const wanted = new Set(
    [...ENV_PROVIDER_MODULES.values()].map((name) => name),
  );
  if (!wanted.has(local)) return undefined;
  for (const statement of file.source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      continue;
    }
    const expected = ENV_PROVIDER_MODULES.get(statement.moduleSpecifier.text);
    if (!expected) continue;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const element of bindings.elements) {
      const localName = element.name.text;
      if (localName !== local) continue;
      if (element.propertyName && element.propertyName.text !== expected) {
        continue;
      }
      return statement.moduleSpecifier.text;
    }
  }
  return undefined;
}

export function readTemplateVariables(
  root: string,
  fileName: string,
): Map<string, string> {
  const variables = new Map<string, string>();
  let text: string;
  try {
    text = readFileSync(join(root, fileName), 'utf8');
  } catch {
    return variables;
  }
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;
    variables.set(
      trimmed.slice(0, separator).trim(),
      trimmed.slice(separator + 1).trim(),
    );
  }
  return variables;
}
