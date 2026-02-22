/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/**
 * @fileoverview Docker 部署脚本 - SSH 远程服务器部署工具 (Node-SSH 重写版)
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
 * DOCKER_REGISTRY=localhost:5000   # Docker 镜像仓库地址
 * SSH_HOST=localhost                # SSH 服务器地址（必填）
 * SSH_PORT=22                          # SSH 端口号（默认 22）
 * SSH_USER=root                        # SSH 用户名（必填）
 * SSH_PASSWORD=your_password           # SSH 密码（必填）
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

import chalk from 'chalk';
import { Command } from 'commander';
import { NodeSSH } from 'node-ssh';
import { z } from 'zod';

import {
  executeLocalCommand,
  executeRemoteCommand,
  executeUploadFile,
} from './executer';
import { normalizeError } from './normalize';
import {
  colorSuccess,
  colorError,
  colorWarning,
  colorInfo,
} from './script-logger';
import { StepResult, createStepError, createStepSuccess } from './step-result';

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'),
) as Record<string, any>;

const BACKEND_ENV_FILE = './apps/backend/.env.production';

/**
 * SSH 配置 schema - 使用 zod 进行类型验证
 */
const SSHConfigSchema = z.object({
  host: z.string().min(1, 'SSH 主机地址不能为空'),
  port: z.number().min(1).max(65535, 'SSH 端口号无效（应为 1-65535）'),
  user: z.string().min(1, 'SSH 用户名不能为空'),
});

/**
 * 部署配置 schema - 定义所有可配置项及其验证规则
 */
const DeployConfigSchema = z.object({
  dockerRegistry: z
    .string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9.:-]*$/, 'Docker 镜像仓库地址格式无效')
    .optional()
    .default(''),
  projectName: z.string(),
  sshConfig: SSHConfigSchema,
  sshPassword: z.string().optional().default(''),
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

/**
 * 从命令行选项生成部署配置
 * @param options - 命令行选项对象
 * @returns 部署配置对象或错误信息
 */
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
    sshPassword: envConfig.SSH_PASSWORD || '',
    remoteDir: envConfig.REMOTE_DIR || '',
    dryRun: options.dryRun || envConfig.DRY_RUN === 'true',
    skipConfirm: options.yes || false,
    skipBuild: options.skipBuild || envConfig.SKIP_BUILD === 'true',
    envFile: options.envFile || '.env.deploy',
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
 * 执行构建命令 - 调用 npm run build 进行项目构建
 */
async function runBuild(config: DeployConfig): Promise<StepResult<string>> {
  if (config.skipBuild) {
    return createStepSuccess('构建已跳过');
  }
  return executeLocalCommand(
    '执行项目构建',
    `docker compose --env-file ${config.envFile} build ${config.projectName}`,
    config.dryRun,
  );
}

/**
 * 执行推送命令 - 对镜像进行 tag 并推送到镜像仓库
 */
async function runPush(config: DeployConfig): Promise<StepResult<string>> {
  if (config.skipBuild) {
    return createStepSuccess('推送已跳过');
  }
  return executeLocalCommand(
    '推送镜像到仓库',
    `docker compose --env-file ${config.envFile} push ${config.projectName}`,
    config.dryRun,
  );
}

/**
 * 执行本地任务：构建和推送镜像
 */
async function executeLocalTasks(
  config: DeployConfig,
): Promise<StepResult<void>> {
  // 1. 本地构建和推送
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

  return createStepSuccess(undefined);
}

/**
 * 执行远程任务：SSH连接并执行部署
 */
async function executeRemoteTasks(
  config: DeployConfig,
): Promise<StepResult<void>> {
  const composeFilePath = 'docker-compose.yml';

  // 2. SSH 连接
  colorInfo(`正在连接到 ${config.sshConfig.host}...`);
  const ssh = new NodeSSH();

  try {
    if (!config.dryRun) {
      await ssh.connect({
        host: config.sshConfig.host,
        port: config.sshConfig.port,
        username: config.sshConfig.user,
        password: config.sshPassword,
        // privateKeyPath: ... // 如果需要支持私钥
      });
      colorSuccess('SSH 连接成功');
    }

    // 3. 准备远程目录
    const mkdirCmd = `mkdir -p ${config.remoteDir}/apps/backend && chmod -R 755 ${config.remoteDir}`;
    const mkdirResult = await executeRemoteCommand(
      ssh,
      '创建远程目录结构',
      mkdirCmd,
      config.dryRun,
    );

    if (!mkdirResult.success) {
      return mkdirResult;
    }

    // 4. 上传文件
    const remoteComposeFile = `${config.remoteDir}/docker-compose.yml`;
    const uploadCompose = await executeUploadFile(
      ssh,
      composeFilePath,
      remoteComposeFile,
      config.dryRun,
    );
    if (!uploadCompose.success) {
      return uploadCompose;
    }

    // 4.1 上传环境文件
    const envFileName = path.basename(config.envFile);
    const remoteEnvFile = `${config.remoteDir}/${envFileName}`;
    const uploadEnv = await executeUploadFile(
      ssh,
      config.envFile,
      remoteEnvFile,
      config.dryRun,
    );
    if (!uploadEnv.success) {
      return uploadEnv;
    }

    // 4.2 上传后端环境文件
    const remoteBackendEnv = `${config.remoteDir}/apps/backend/.env.production`;
    const uploadBackendEnv = await executeUploadFile(
      ssh,
      BACKEND_ENV_FILE,
      remoteBackendEnv,
      config.dryRun,
    );
    if (!uploadBackendEnv.success) {
      return uploadBackendEnv;
    }

    // 5. 远程 Docker 操作
    // 注意：如果远程只有 docker-compose (v1)，则需要改为 docker-compose
    // 假设远程环境支持 docker compose (v2) 或者 docker-compose 是别名
    // 原脚本使用的是 docker-compose，这里保持一致，但建议检查远程环境
    const baseCmd = `cd ${config.remoteDir} && docker-compose --env-file ${envFileName}`;

    // 部署单个服务
    const pullResult = await executeRemoteCommand(
      ssh,
      `拉取服务镜像: ${config.projectName}`,
      `${baseCmd} pull ${config.projectName}`,
      config.dryRun,
    );
    if (!pullResult.success) return pullResult;

    // 部署单个服务
    const downResult = await executeRemoteCommand(
      ssh,
      `停止服务: ${config.projectName}`,
      `${baseCmd} down ${config.projectName}`,
      config.dryRun,
    );
    if (!downResult.success) return downResult;

    // 部署单个服务
    const upResult = await executeRemoteCommand(
      ssh,
      `启动服务: ${config.projectName}`,
      `${baseCmd} up -d ${config.projectName}`,
      config.dryRun,
    );
    if (!upResult.success) return upResult;

    // 6. 验证状态
    const psResult = await executeRemoteCommand(
      ssh,
      '验证服务状态',
      `${baseCmd} ps`,
      config.dryRun,
    );
    if (!psResult.success) return psResult;

    colorSuccess('部署完成！', `应用已在 ${config.sshConfig.host} 上部署成功`);
    return createStepSuccess(undefined);
  } catch (error: any) {
    return createStepError(`SSH 连接或部署失败: ${error.message}`);
  } finally {
    if (!config.dryRun) {
      ssh.dispose();
    }
  }
}

/**
 * 程序入口点
 * 解析命令行参数、加载配置、验证并执行部署
 */
async function main(): Promise<void> {
  const program = new Command();

  program
    .name('docker-push')
    .description('通过 SSH 远程部署 Docker 容器 (Node-SSH)')
    .version(packageJson.version || '1.0.0', '-V, --version');

  program
    .option('-p, --project-name <name>', '指定项目名称', '')
    .option('--env-file <file>', '指定环境变量文件', '.env.deploy')
    .option('--skip-build', '跳过本地构建阶段')
    .option('--dry-run', '预览模式 - 仅打印命令，不实际执行')
    .option('-y, --yes', '跳过确认直接执行')
    .action(async (options: Record<string, any>) => {
      if (!fs.existsSync(BACKEND_ENV_FILE)) {
        colorError(`后端环境文件 ${BACKEND_ENV_FILE} 不存在`);
        return;
      }

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

      const localResult = await executeLocalTasks(config);
      if (!localResult.success) {
        colorError(localResult.error);
        return;
      }

      const remoteResult = await executeRemoteTasks(config);
      if (!remoteResult.success) {
        colorError(remoteResult.error);
        return;
      }
    });

  program.parse();
}

main().catch((error) => {
  const { message, stack } = normalizeError(error);

  colorError(`未捕获的异常: ${message}`);
  if (stack) {
    colorError('\n错误堆栈:', chalk.gray(stack));
  }
  process.exit(1);
});
