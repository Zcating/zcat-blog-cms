import { spawn, type SpawnOptions } from 'node:child_process';

function run(command: string, args: string[], options: SpawnOptions = {}) {
  return new Promise<number>((resolve) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

const tsupCode = await run('pnpm', ['exec', 'tsup']);
if (tsupCode !== 0) {
  process.exit(tsupCode);
}

const tscCode = await run('pnpm', [
  'exec',
  'tsc',
  '-p',
  'tsconfig.build.json',
  '--emitDeclarationOnly',
]);
process.exit(tscCode);
