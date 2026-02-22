/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { spawn } from 'node:child_process';

import { NodeSSH } from 'node-ssh';

import { colorCommand, colorInfo } from './script-logger';
import { createStepError, createStepSuccess, StepResult } from './step-result';

/**
 * 执行本地命令并返回结果
 * @param description - 操作描述
 * @param command - 要执行的命令
 * @param dryRun - 是否为预览模式
 * @returns 执行结果对象
 */
export async function executeLocalCommand(
  description: string,
  command: string,
  dryRun: boolean,
): Promise<StepResult<string>> {
  if (dryRun) {
    colorInfo(`[Dry Run] [Local] ${description}`);
    colorCommand(command);
    return createStepSuccess(command);
  }

  colorInfo(`[Local] ${description}`);
  colorCommand(command);

  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, { shell: true });

    child.stdin.end();

    let output = '';
    child.stdout.on('data', (data: any) => {
      if (!data) {
        return;
      }
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (data: any) => {
      if (!data) {
        return;
      }
      process.stderr.write(data.toString());
    });

    child.on('close', (code: number) => {
      if (code !== 0) {
        resolve(createStepError(`命令退出码: ${code}`));
      } else {
        resolve(createStepSuccess(output));
      }
    });

    child.on('error', (err) => {
      resolve(createStepError(err.message));
    });
  });
}

/**
 * 执行远程命令
 */
export async function executeRemoteCommand(
  ssh: NodeSSH,
  description: string,
  command: string,
  dryRun: boolean,
): Promise<StepResult<string>> {
  if (dryRun) {
    colorInfo(`[Dry Run] [Remote] ${description}`);
    colorCommand(command);
    return createStepSuccess(command);
  }

  colorInfo(`[Remote] ${description}`);
  colorCommand(command);

  try {
    const result = await ssh.execCommand(command, {
      cwd: '.', // 在命令中显式处理目录切换
      onStdout(chunk) {
        process.stdout.write(chunk.toString('utf8'));
      },
      onStderr(chunk) {
        process.stderr.write(chunk.toString('utf8'));
      },
    });

    if (result.code !== 0) {
      return createStepError(
        `远程命令失败 (Code: ${result.code}): ${result.stderr}`,
      );
    }

    return createStepSuccess(result.stdout);
  } catch (error: any) {
    return createStepError(`SSH 执行错误: ${error.message}`);
  }
}
