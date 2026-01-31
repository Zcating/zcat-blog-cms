import chalk from 'chalk';

function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function colorSuccess(...message: string[]): void {
  console.log(
    chalk.green('✓ ') + `[${getTimestamp()}] [SUCCESS] ` + message.join('\n'),
  );
}

export function colorError(...message: string[]): void {
  console.error(
    chalk.red('✗ ') + `[${getTimestamp()}] [ERROR] ` + message.join('\n'),
  );
}

export function colorWarning(...message: string[]): void {
  console.warn(
    chalk.yellow('⚠ ') + `[${getTimestamp()}] [WARN] ` + message.join('\n'),
  );
}

export function colorInfo(...message: string[]): void {
  console.log(
    chalk.cyan('ℹ ') + `[${getTimestamp()}] [INFO] ` + message.join(' '),
  );
}

export function colorCommand(cmd: string): void {
  console.log(chalk.magenta('$ ') + `[${getTimestamp()}] [CMD] ` + cmd);
}
