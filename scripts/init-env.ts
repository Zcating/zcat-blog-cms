import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const generateMarker = '# init-env: generate';
const generatedValueByteLength = 32;
const assignmentPattern = /^(\s*[A-Za-z_][A-Za-z0-9_]*\s*=)(.*)$/;

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const templatePairs = [
  { template: '.env.example', target: '.env' },
  { template: 'apps/backend/.env.example', target: 'apps/backend/.env' },
  { template: 'apps/blog/.env.example', target: 'apps/blog/.env' },
  {
    template: 'apps/frontend/.env.example',
    target: 'apps/frontend/.env',
  },
];

type GenerationOutcome =
  | { status: 'generated'; target: string; content: string }
  | { status: 'skipped'; target: string }
  | { status: 'failed'; target: string; reason: string };

function detectLineEnding(content: string): string {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

function generateSecret(): string {
  return randomBytes(generatedValueByteLength).toString('hex');
}

function applyMarkers(content: string): string {
  const lineEnding = detectLineEnding(content);
  const lines = content.split(/\r?\n/);
  let precedingNonBlankLine = '';

  const rewritten = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      return line;
    }
    if (trimmed.startsWith('#')) {
      precedingNonBlankLine = trimmed;
      return line;
    }

    const assignment = line.match(assignmentPattern);
    const isMarked = precedingNonBlankLine === generateMarker;
    precedingNonBlankLine = trimmed;

    if (!assignment || !isMarked) {
      return line;
    }
    if (assignment[2].trim().length > 0) {
      return line;
    }
    return `${assignment[1]}${generateSecret()}`;
  });

  return rewritten.join(lineEnding);
}

function collectAssignments(
  content: string,
): Array<{ key: string; value: string }> {
  const assignments: Array<{ key: string; value: string }> = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }
    const assignment = line.match(assignmentPattern);
    if (assignment) {
      assignments.push({
        key: trimmed.split('=', 1)[0].trim(),
        value: assignment[2].trim(),
      });
    }
  }
  return assignments;
}

function collectEmptyKeys(content: string): string[] {
  return collectAssignments(content)
    .filter((assignment) => assignment.value.length === 0)
    .map((assignment) => assignment.key);
}

function generateEnvFile(
  templateRelativePath: string,
  targetRelativePath: string,
): GenerationOutcome {
  const templatePath = path.join(repositoryRoot, templateRelativePath);
  const targetPath = path.join(repositoryRoot, targetRelativePath);

  if (fs.existsSync(targetPath)) {
    return { status: 'skipped', target: targetRelativePath };
  }

  if (!fs.existsSync(templatePath)) {
    return {
      status: 'failed',
      target: targetRelativePath,
      reason: `模板 ${templateRelativePath} 不存在`,
    };
  }

  let templateContent: string;
  try {
    templateContent = fs.readFileSync(templatePath, 'utf-8');
  } catch (error) {
    return {
      status: 'failed',
      target: targetRelativePath,
      reason: `模板 ${templateRelativePath} 无法读取: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  if (collectAssignments(templateContent).length === 0) {
    return {
      status: 'failed',
      target: targetRelativePath,
      reason: `模板 ${templateRelativePath} 没有任何键值对，无法解析`,
    };
  }

  const generatedContent = applyMarkers(templateContent);
  try {
    fs.writeFileSync(targetPath, generatedContent, 'utf-8');
  } catch (error) {
    return {
      status: 'failed',
      target: targetRelativePath,
      reason: `无法写入 ${targetRelativePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  return {
    status: 'generated',
    target: targetRelativePath,
    content: generatedContent,
  };
}

function report(outcomes: GenerationOutcome[]): void {
  console.log('[init-env] 仓库根目录:', repositoryRoot);
  console.log('');

  for (const outcome of outcomes) {
    if (outcome.status === 'generated') {
      console.log(`[init-env] 已生成 ${outcome.target}`);
    } else if (outcome.status === 'skipped') {
      console.log(`[init-env] 已存在，未改动 ${outcome.target}`);
    } else {
      console.log(
        `[init-env] 错误：${outcome.reason}，未生成 ${outcome.target}`,
      );
    }
  }

  const generatedWithEmptyKeys = outcomes.filter(
    (outcome): outcome is Extract<GenerationOutcome, { status: 'generated' }> =>
      outcome.status === 'generated',
  );

  console.log('');
  if (generatedWithEmptyKeys.length === 0) {
    console.log('[init-env] 本次没有新生成的文件，无待填清单。');
    return;
  }

  console.log('[init-env] 以下变量的值仍为空，必须由人工填写：');
  for (const outcome of generatedWithEmptyKeys) {
    const emptyKeys = collectEmptyKeys(outcome.content);
    console.log(`  ${outcome.target}`);
    if (emptyKeys.length === 0) {
      console.log('    （无空值）');
    }
    for (const key of emptyKeys) {
      console.log(`    - ${key}`);
    }
  }
}

function main(): void {
  const outcomes = templatePairs.map(({ template, target }) =>
    generateEnvFile(template, target),
  );
  report(outcomes);
}

main();
