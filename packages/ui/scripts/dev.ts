import { spawn } from 'node:child_process';

function run(command, args) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return child;
}

const children = [
  run('pnpm', ['exec', 'tsup', '--watch']),
  run('pnpm', [
    'exec',
    'tsc',
    '-p',
    'tsconfig.build.json',
    '--emitDeclarationOnly',
    '--watch',
    '--preserveWatchOutput',
  ]),
];

const shutdown = (signal) => {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

const exitCodes = [];
for (const child of children) {
  child.on('exit', (code) => {
    exitCodes.push(code ?? 1);
    if (exitCodes.length === children.length) {
      const firstNonZero = exitCodes.find((c) => c !== 0);
      process.exit(firstNonZero ?? 0);
    }
  });
}
