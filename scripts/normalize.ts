import shell from 'shelljs';

import {
  createStepError,
  createStepSuccess,
  StepResult,
} from './step-result';

export function normalizeError(error: unknown) {
  let errorMessage = '';
  let errorStack = '';
  if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack || '';
  } else {
    errorMessage = String(error);
  }
  return {
    message: errorMessage,
    stack: errorStack,
  };
}

export function normalizeShellCommand(
  scriptPath: string,
  envVars: Record<string, string>,
): StepResult<string> {
  const envVarsStr = Object.entries(envVars)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');

  const platform = process.platform;

  if (platform === 'darwin' || platform === 'linux') {
    return createStepSuccess(`bash -c "${envVarsStr} ${scriptPath}"`);
  }

  if (platform === 'win32') {
    if (!shell.which('wsl')) {
      return createStepError(
        'WSL 未安装或不可用。请确保 Windows Subsystem for Linux 已安装并启用。',
      );
    }
    return createStepSuccess(`wsl -e bash -c "${envVarsStr} ${scriptPath}"`);
  }

  return createStepError(`不支持的操作系统: ${platform}`);
}
