/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * @fileoverview Docker 部署脚本 - SSH 远程服务器部署工具
 * @description 该脚本用于通过 SSH 连接到远程服务器并执行 Docker 容器部署
 *              支持文件传输、docker-compose 命令执行、dry-run 预览模式
 *              所有配置均从环境变量读取，不支持命令行参数传递敏感信息
 *
 * @example
 * # 基本部署（从 .env.deploy 读取配置）
 * pnpm docker:push
 *
 * # 预览模式（仅打印将要执行的命令，不实际执行）
 * pnpm docker:push --dry-run
 *
 * # 跳过本地构建阶段（直接推送已有镜像）
 * pnpm docker:push --skip-build
 *
 * # 跳过确认直接执行
 * pnpm docker:push --yes
 *
 * # 环境变量说明 (.env.deploy)
 * DOCKER_REGISTRY=103.84.110.53:5000   # Docker 镜像仓库地址
 * SSH_HOST=103.84.110.53               # SSH 服务器地址（必填）
 * SSH_PORT=22                          # SSH 端口号（默认 22）
 * SSH_USER=root                        # SSH 用户名（必填）
 * SSH_PASSWORD=your_password           # SSH 密码（必填）
 */

import { exec, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

import chalk from 'chalk';
import { Command } from 'commander';
import { z } from 'zod';

import {
  colorSuccess,
  colorError,
  colorWarning,
  colorInfo,
  colorCommand,
} from './script-logger';

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'),
) as Record<string, any>;

interface StepError {
  success: false;
  error: string;
}

interface StepSuccess<T> {
  success: true;
  data: T;
}

type StepResult<T> = StepSuccess<T> | StepError;

/**
 * 创建部署错误信息
 * @param message - 错误消息
 * @returns 错误对象，如果 message 为空则返回 undefined
 */
function createStepError(message: string): StepError {
  return { success: false, error: message };
}

function createStepSuccess<T>(data: T): StepSuccess<T> {
  return { success: true, data };
}

function unifyErrorFrom(error: unknown) {
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

/**
 * SSH 配置 schema - 使用 zod 进行类型验证
 */
const SSHConfigSchema = z.object({
  host: z.string().min(1, 'SSH 主机地址不能为空'),
  port: z.number().min(1).max(65535, 'SSH 端口号无效（应为 1-65535）'),
  user: z.string().min(1, 'SSH 用户名不能为空'),
});

/**
 * SSH 配置类型定义
 */
type SSHConfig = z.infer<typeof SSHConfigSchema>;

/**
 * 部署配置 schema - 定义所有可配置项及其验证规则
 */
const DeployConfigSchema = z.object({
  dockerRegistry: z
    .string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9.:-]*$/, 'Docker 镜像仓库地址格式无效')
    .optional()
    .default(''),
  projectName: z.string().optional().default(''),
  sshConfig: SSHConfigSchema,
  remoteDir: z
    .string()
    .regex(/^\/[\w/.-]*$/, '远程目录路径必须是绝对路径（以 / 开头）'),
  dryRun: z.boolean(),
  skipConfirm: z.boolean(),
  skipBuild: z.boolean(),
  envFile: z.string().optional().default('.env.deploy'),
});

/**
 * 部署配置类型定义
 */
type DeployConfig = z.infer<typeof DeployConfigSchema>;

/**
 * 从环境变量文件加载配置
 * @param envFile - 环境变量文件路径
 * @returns 配置键值对对象
 */
function loadEnvConfig(envFile: string): Record<string, string> {
  const config: Record<string, string> = {};
  if (!fs.existsSync(envFile)) {
    return config;
  }
  const content = fs.readFileSync(envFile, 'utf-8');
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        config[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
  return config;
}

function generateConfig(
  options: Record<string, any>,
): StepResult<DeployConfig> {
  const envConfig = loadEnvConfig(options.envFile || '.env.deploy');
  const result = DeployConfigSchema.safeParse({
    dockerRegistry: envConfig.DOCKER_REGISTRY || '',
    projectName: options.projectName || '',
    sshConfig: {
      host: envConfig.SSH_HOST || '',
      port: parseInt(envConfig.SSH_PORT || '22', 10),
      user: envConfig.SSH_USER || '',
    },
    remoteDir: envConfig.REMOTE_DIR || '',
    dryRun: envConfig.DRY_RUN || false,
    skipConfirm: options.yes || false,
    skipBuild: envConfig.SKIP_BUILD || false,
  });
  if (!result.success) {
    const errorMessages = result.error.issues
      .map((issue) => issue.message)
      .join('; ');
    colorError(`配置验证失败: ${errorMessages}`);
    return createStepError(errorMessages);
  }
  return createStepSuccess(result.data);
}

/**
 * 确认部署 - 显示配置摘要并等待用户确认
 * @param config - 部署配置对象
 * @returns 布尔值，用户确认返回 true，否则返回 false
 */
async function confirmDeploy(config: DeployConfig): Promise<boolean> {
  if (config.skipConfirm) {
    return true;
  }

  colorInfo(`部署配置摘要:
   Docker Registry: ${config.dockerRegistry}
   SSH Host: ${config.sshConfig.user}@${config.sshConfig.host}:${config.sshConfig.port}
   Remote Directory: ${config.remoteDir}
   Skip Build: ${config.skipBuild ? '是' : '否'}
   Dry Run Mode: ${config.dryRun ? '启用' : '禁用'}`);

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(chalk.cyan('\n确认执行部署? (y/N): '), (answer: string) => {
      rl.close();
      const confirmed =
        answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
      if (!confirmed) {
        colorWarning('部署已取消');
      }
      resolve(confirmed);
    });
  });
}

/**
 * 执行命令并返回结果
 * @param description - 操作描述
 * @param command - 要执行的命令
 * @param dryRun - 是否为预览模式
 * @returns 执行结果对象
 */
async function executeCommand(
  description: string,
  command: string,
  dryRun: boolean,
): Promise<{ success: boolean; output: string; error?: string }> {
  if (dryRun) {
    colorInfo(`[Dry Run] ${description}`);
    colorCommand(command);
    return { success: true, output: command, error: undefined };
  }

  colorInfo(description);
  colorCommand(command);

  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, { shell: true });

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

    child.on('close', (code) => {
      if (code === 0) {
        colorSuccess(`${description} 完成`);
        resolve({ success: true, output, error: undefined });
      } else {
        colorError(`${description} 失败，退出码: ${code}`);
        resolve({ success: false, output, error: `退出码: ${code}` });
      }
    });

    child.on('error', (error) => {
      colorError(`${description} 执行错误: ${error.message}`);
      resolve({ success: false, output, error: error.message });
    });
  });
}

/**
 * 执行 shell 脚本 - 通过 WSL 运行 bash 脚本并传递环境变量
 * @param description - 操作描述
 * @param scriptPath - 脚本路径
 * @param envVars - 要传递的环境变量对象
 * @param dryRun - 是否为预览模式
 * @returns 执行结果对象，包含 success、output 和 error 属性
 */
async function runBashScript(
  description: string,
  scriptPath: string,
  envVars: Record<string, string>,
  dryRun: boolean,
): Promise<{ success: boolean; output: string; error?: string }> {
  const envVarsStr = Object.entries(envVars)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
  const command = `wsl -e bash -c "${envVarsStr} ${scriptPath}"`;
  return executeCommand(description, command, dryRun);
}

/**
 * 执行构建命令 - 调用 npm run build 进行项目构建
 * @param config - 部署配置对象
 * @returns 执行结果对象，包含 success、output 和 error 属性
 */
async function runBuild(
  config: DeployConfig,
): Promise<{ success: boolean; output: string; error?: string }> {
  if (config.skipBuild) {
    return { success: true, output: '构建已跳过', error: undefined };
  }
  return executeCommand(
    '执行项目构建',
    `docker compose --env-file ${config.envFile} build ${config.projectName}`,
    config.dryRun,
  );
}

/**
 * 执行推送命令 - 对镜像进行 tag 并推送到镜像仓库
 * @param config - 部署配置对象
 * @returns 执行结果对象，包含 success、output 和 error 属性
 */
async function runPush(
  config: DeployConfig,
): Promise<{ success: boolean; output: string; error?: string }> {
  if (config.skipBuild) {
    return { success: true, output: '推送已跳过', error: undefined };
  }
  return executeCommand(
    '推送镜像到仓库',
    `docker compose --env-file ${config.envFile} push ${config.projectName}`,
    config.dryRun,
  );
}

/**
 * 执行所有部署命令
 * 1. 检查必要的文件是否存在
 * 2. 准备环境变量
 * 3. 调用 shell 脚本执行实际部署
 * @param config - 部署配置对象
 * @returns 错误信息对象，如果有错误则包含 error 属性
 */
async function runAllCommands(config: DeployConfig): Promise<StepResult<void>> {
  colorInfo('开始 Docker 部署...');

  const composeFilePath = 'docker-compose.yml';
  const scriptPath = './scripts/docker-push.sh';
  const backendEnvFilePath = './apps/backend/.env.production';

  if (!fs.existsSync(scriptPath)) {
    return createStepError(`脚本不存在: ${scriptPath}`);
  }

  const envVars = {
    SSH_HOST: config.sshConfig.host,
    SSH_USER: config.sshConfig.user,
    SSH_PORT: String(config.sshConfig.port),
    REMOTE_DIR: config.remoteDir,
    PROJECT_NAME: config.projectName,
    COMPOSE_FILE: composeFilePath,
    ENV_FILE: config.envFile,
    BACKEND_ENV_FILE: backendEnvFilePath,
  };

  colorInfo('开始构建项目...');
  const buildResult = await runBuild(config);
  if (!buildResult.success) {
    return createStepError(`构建失败: ${buildResult.error}`);
  }

  colorInfo('推送镜像到仓库...');
  const pushResult = await runPush(config);
  if (!pushResult.success) {
    return createStepError(`推送失败: ${pushResult.error}`);
  }

  colorInfo('执行部署脚本...');
  const result = await runBashScript(
    '部署脚本',
    scriptPath,
    envVars,
    config.dryRun,
  );
  if (!result.success) {
    return createStepError(`部署脚本执行失败: ${result.error}`);
  }

  colorSuccess('部署完成！', `应用已在 ${config.sshConfig.host} 上部署成功`);

  return createStepSuccess(undefined);
}

/**
 * 程序入口点
 * 解析命令行参数、加载配置、验证并执行部署
 */
async function main(): Promise<void> {
  const program = new Command();

  program
    .name('docker-push')
    .description('通过 SSH 远程部署 Docker 容器')
    .version(packageJson.version || '1.0.0', '-V, --version');

  program
    .option('-p, --project-name <name>', '指定项目名称', '')
    .option('--env-file <file>', '指定环境变量文件', '.env.deploy')
    .option('--skip-build', '跳过本地构建阶段')
    .option('--dry-run', '预览模式 - 仅打印命令，不实际执行')
    .option('-y, --yes', '跳过确认直接执行')
    .action(async (options: Record<string, any>) => {
      const validationResult = generateConfig(options);
      if (!validationResult.success) {
        colorError(validationResult.error);
        return;
      }

      const config = validationResult.data;

      if (config.dryRun) {
        colorInfo('当前模式: Dry Run 模式 - 仅预览命令，不会实际执行');
        colorWarning('\n⚠️  Dry Run 模式 - 以下命令仅预览，不会实际执行\n');
      } else {
        colorInfo('当前模式: Normal 模式 - 会实际执行部署操作');
      }

      const confirmed = await confirmDeploy(config);
      if (!confirmed) {
        return;
      }

      const result = await runAllCommands(config);
      if (!result.success) {
        colorError(result.error);
        return;
      }
    });

  program.parse();
}

main().catch((error) => {
  const { message, stack } = unifyErrorFrom(error);

  colorError(`未捕获的异常: ${message}`);
  if (stack) {
    colorError('\n错误堆栈:', chalk.gray(stack));
  }
  process.exit(1);
});
