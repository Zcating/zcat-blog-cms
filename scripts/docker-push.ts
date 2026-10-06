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

interface CliOptions {
  envFile: string;
  projectName: string;
  service: string;
  skipBuild?: boolean;
  dryRun?: boolean;
  yes?: boolean;
}

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'),
) as { version?: string };

const ENV_FILE = './.env';
const TEMPLATE_FILE = './.env.example';
const COMPOSE_FILE = './docker-compose.yml';
const REMOTE_COMPOSE_FILE = 'docker-compose.yml';

const EXPECTED_PROJECT_NAME = 'cms';
const DATA_VOLUME = 'cms_cms_pg';

const COMPOSE_REQUIRED_VALUES = [
  'ENV',
  'DATABASE_URL',
  'JWT_SECRET',
  'BACKEND_API_URL',
  'OSS_ENDPOINT',
  'OSS_BUCKET',
  'OSS_ACCESS_KEY',
  'OSS_SECRET_KEY',
  'POSTGRES_PASSWORD',
];

const SCRIPT_REQUIRED_VALUES = ['SSH_PASSWORD'];

const RETIRED_ENV_KEYS = [
  'NODE_ENV',
  'OSS_PORT',
  'OSS_USE_SSL',
  'OSS_PUBLIC_URL',
  'OSS_INTERNAL_URL',
  'OSS_REGION',
];

const SSHConfigSchema = z.object({
  host: z.string().min(1, 'SSH 主机地址不能为空'),
  port: z.number().min(1).max(65535, 'SSH 端口号无效（应为 1-65535）'),
  user: z.string().min(1, 'SSH 用户名不能为空'),
});

const DeployConfigSchema = z.object({
  dockerRegistry: z
    .string()
    .min(
      1,
      'DOCKER_REGISTRY 不能为空：compose 直接把它与镜像名拼接，留空会解析成本地名 cms_backend:latest',
    )
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9.:-]*\/$/,
      'DOCKER_REGISTRY 必须以斜杠结尾（如 103.84.110.53:5000/），compose 拼出 ${DOCKER_REGISTRY}cms_blog:latest，缺斜杠会得到 103.84.110.53:5000cms_blog:latest 这种非法镜像名',
    ),
  projectName: z.string(),
  service: z
    .string()
    .regex(/^[A-Za-z0-9_.-]*$/, '服务名只允许字母、数字、下划线、点和连字符'),
  sshConfig: SSHConfigSchema,
  sshPassword: z.string().optional().default(''),
  remoteDir: z
    .string()
    .regex(/^\/[\w/.-]*$/, '远程目录路径必须是绝对路径（以 / 开头）'),
  dryRun: z.boolean(),
  skipConfirm: z.boolean(),
  skipBuild: z.boolean(),
  envFile: z.string(),
  envFileName: z.string(),
});

type DeployConfig = z.infer<typeof DeployConfigSchema>;

function fail(message: string): void {
  colorError(message);
  process.exitCode = 1;
}

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

function collectComposeEnvRefs(): StepResult<string[]> {
  if (!fs.existsSync(COMPOSE_FILE)) {
    return createStepError(`compose 文件 ${COMPOSE_FILE} 不存在`);
  }
  const content = fs.readFileSync(COMPOSE_FILE, 'utf-8');
  const refs = new Set<string>();
  for (const match of content.matchAll(
    /\$\{([A-Za-z_][A-Za-z0-9_]*)(?::[-?][^}]*)?\}/g,
  )) {
    refs.add(match[1]);
  }
  if (refs.size === 0) {
    return createStepError(
      `${COMPOSE_FILE} 里没有解析出任何 \${变量} 形式的引用，契约校验无法进行，请确认文件是否被改坏`,
    );
  }
  return createStepSuccess([...refs].sort());
}

function findContractProblems(
  values: Record<string, string>,
  composeRefs: string[],
  label: string,
  requireNonEmpty: boolean,
): string[] {
  const problems: string[] = [];

  const retired = RETIRED_ENV_KEYS.filter((key) => key in values);
  if (retired.length > 0) {
    problems.push(
      `${label} 仍含已废弃的变量 ${retired.join('、')}，现行契约里没有任何读取方`,
    );
  }

  for (const ref of composeRefs) {
    if (!(ref in values)) {
      problems.push(`${COMPOSE_FILE} 读取 ${ref}，但 ${label} 没有声明它`);
      continue;
    }
    if (
      requireNonEmpty &&
      COMPOSE_REQUIRED_VALUES.includes(ref) &&
      values[ref].trim() === ''
    ) {
      problems.push(`${label} 的 ${ref} 为空，容器启动即抛错`);
    }
  }

  if (requireNonEmpty) {
    for (const key of SCRIPT_REQUIRED_VALUES) {
      if ((values[key] ?? '').trim() === '') {
        problems.push(`${label} 的 ${key} 为空，SSH 认证会失败`);
      }
    }
  }

  const endpoint = (values.OSS_ENDPOINT ?? '').trim();
  if (endpoint !== '' && !endpoint.startsWith('https://')) {
    problems.push(
      `${label} 的 OSS_ENDPOINT 必须带 https:// 前缀，当前为 ${endpoint}`,
    );
  }

  const env = (values.ENV ?? '').trim().toUpperCase();
  if (env !== '' && env !== 'DEVELOPMENT' && env !== 'PRODUCTION') {
    problems.push(
      `${label} 的 ENV=${values.ENV} 无法识别，未识别的取值会静默按开发模式运行`,
    );
  }

  return problems;
}

function validateContract(
  config: DeployConfig,
  composeRefs: string[],
): string[] {
  const problems = findContractProblems(
    loadEnvConfig(config.envFile),
    composeRefs,
    config.envFile,
    true,
  );
  if (fs.existsSync(TEMPLATE_FILE)) {
    problems.push(
      ...findContractProblems(
        loadEnvConfig(TEMPLATE_FILE),
        composeRefs,
        TEMPLATE_FILE,
        false,
      ),
    );
  } else {
    colorWarning(
      `${TEMPLATE_FILE} 不存在，跳过「compose 读取的变量是否都在模板里声明」这项对照`,
    );
  }
  return problems;
}

function resolveProjectName(config: DeployConfig): StepResult<string> {
  const dirName = config.remoteDir.replace(/\/+$/, '').split('/').pop() ?? '';
  if (
    dirName === EXPECTED_PROJECT_NAME &&
    config.projectName === EXPECTED_PROJECT_NAME
  ) {
    return createStepSuccess(EXPECTED_PROJECT_NAME);
  }
  return createStepError(
    `compose 项目名必须是 ${EXPECTED_PROJECT_NAME}：数据在卷 ${DATA_VOLUME} 上，卷全名是 <项目名>_<卷名>，项目名一旦不同，compose 会改绑一个新空卷、表现为数据消失。REMOTE_DIR=${config.remoteDir} 推出的目录名是 ${dirName || '(空)'}，--project-name 是 ${config.projectName}`,
  );
}

function generateConfig(options: CliOptions): StepResult<DeployConfig> {
  const envFile = options.envFile || ENV_FILE;
  const envConfig = loadEnvConfig(envFile);
  const result = DeployConfigSchema.safeParse({
    dockerRegistry: envConfig.DOCKER_REGISTRY ?? '',
    projectName: options.projectName,
    service: options.service ?? '',
    sshConfig: {
      host: envConfig.SSH_HOST ?? '',
      port: parseInt(envConfig.SSH_PORT || '22', 10),
      user: envConfig.SSH_USER ?? '',
    },
    sshPassword: envConfig.SSH_PASSWORD ?? '',
    remoteDir: envConfig.REMOTE_DIR ?? '',
    dryRun: options.dryRun === true || envConfig.DRY_RUN === 'true',
    skipConfirm: options.yes === true,
    skipBuild: options.skipBuild === true || envConfig.SKIP_BUILD === 'true',
    envFile,
    envFileName: path.basename(envFile),
  });
  if (!result.success) {
    const errorMessages = result.error.issues
      .map((issue) => issue.message)
      .join('; ');
    colorError(`配置验证失败: ${errorMessages}`);
    return createStepError(errorMessages);
  }
  if (result.data.envFileName === '' || result.data.envFileName === '.') {
    const message = `--env-file 的值 ${envFile} 不是一个文件路径`;
    colorError(`配置验证失败: ${message}`);
    return createStepError(message);
  }
  return createStepSuccess(result.data);
}

function serviceSuffix(config: DeployConfig): string {
  return config.service ? ` ${config.service}` : '';
}

function localComposeCommand(config: DeployConfig, action: string): string {
  return `docker compose -p ${config.projectName} --env-file ${config.envFileName} ${action}${serviceSuffix(config)}`;
}

async function confirmDeploy(config: DeployConfig): Promise<boolean> {
  if (config.skipConfirm) {
    return true;
  }

  colorInfo(`部署配置摘要:
   Docker Registry: ${config.dockerRegistry}
   Compose 项目名: ${config.projectName}（数据卷 ${DATA_VOLUME} 绑定在这个项目名上）
   服务范围: ${config.service || '全部服务'}
   SSH Host: ${config.sshConfig.user}@${config.sshConfig.host}:${config.sshConfig.port}
   Remote Directory: ${config.remoteDir}
   上传文件: ${COMPOSE_FILE}、${config.envFileName}
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
        process.exitCode = 1;
      }
      resolve(confirmed);
    });
  });
}

async function runBuild(config: DeployConfig): Promise<StepResult<string>> {
  if (config.skipBuild) {
    return createStepSuccess('构建已跳过');
  }
  return executeLocalCommand(
    '本地构建镜像',
    localComposeCommand(config, 'build'),
    config.dryRun,
  );
}

async function runPush(config: DeployConfig): Promise<StepResult<string>> {
  if (config.skipBuild) {
    return createStepSuccess('推送已跳过');
  }
  return executeLocalCommand(
    '推送镜像到仓库',
    localComposeCommand(config, 'push'),
    config.dryRun,
  );
}

async function executeLocalTasks(
  config: DeployConfig,
): Promise<StepResult<void>> {
  colorInfo('本地构建镜像...');
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

async function executeRemoteTasks(
  config: DeployConfig,
): Promise<StepResult<void>> {
  const remoteComposeFile = `${config.remoteDir}/${REMOTE_COMPOSE_FILE}`;
  const remoteEnvFile = `${config.remoteDir}/${config.envFileName}`;

  colorInfo(`正在连接到 ${config.sshConfig.host}...`);
  const ssh = new NodeSSH();

  try {
    if (!config.dryRun) {
      await ssh.connect({
        host: config.sshConfig.host,
        port: config.sshConfig.port,
        username: config.sshConfig.user,
        password: config.sshPassword,
      });
      colorSuccess('SSH 连接成功');
    }

    const mkdirResult = await executeRemoteCommand(
      ssh,
      '创建远程部署目录',
      `mkdir -p ${config.remoteDir} && chmod 700 ${config.remoteDir}`,
      config.dryRun,
    );
    if (!mkdirResult.success) {
      return mkdirResult;
    }

    const uploadCompose = await executeUploadFile(
      ssh,
      COMPOSE_FILE,
      remoteComposeFile,
      config.dryRun,
    );
    if (!uploadCompose.success) {
      return uploadCompose;
    }

    const uploadEnv = await executeUploadFile(
      ssh,
      config.envFile,
      remoteEnvFile,
      config.dryRun,
    );
    if (!uploadEnv.success) {
      return uploadEnv;
    }

    const chmodResult = await executeRemoteCommand(
      ssh,
      '收紧环境文件权限',
      `chmod 600 ${remoteEnvFile}`,
      config.dryRun,
    );
    if (!chmodResult.success) {
      return chmodResult;
    }

    const baseCmd = `cd ${config.remoteDir} && DOCKER_REGISTRY=${config.dockerRegistry} docker compose -p ${config.projectName} --env-file ${config.envFileName}`;

    const pullResult = await executeRemoteCommand(
      ssh,
      '拉取镜像',
      `${baseCmd} pull${serviceSuffix(config)}`,
      config.dryRun,
    );
    if (!pullResult.success) return pullResult;

    const upResult = await executeRemoteCommand(
      ssh,
      '启动服务',
      `${baseCmd} up -d --no-build${serviceSuffix(config)}`,
      config.dryRun,
    );
    if (!upResult.success) return upResult;

    const psResult = await executeRemoteCommand(
      ssh,
      '验证服务状态',
      `${baseCmd} ps`,
      config.dryRun,
    );
    if (!psResult.success) return psResult;

    colorSuccess(
      '部署完成！',
      `项目 ${config.projectName} 已在 ${config.sshConfig.host}:${config.remoteDir} 启动；数据卷应为 ${DATA_VOLUME}`,
    );
    return createStepSuccess(undefined);
  } catch (error: unknown) {
    return createStepError(
      `SSH 连接或部署失败: ${normalizeError(error).message}`,
    );
  } finally {
    if (!config.dryRun) {
      ssh.dispose();
    }
  }
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('docker-push')
    .description(
      '本地构建镜像并推送私有仓库，再通过 SSH 用 docker compose (v2) 在远端拉取启动',
    )
    .version(packageJson.version || '1.0.0', '-V, --version');

  program
    .option(
      '-p, --project-name <name>',
      'compose 项目名，必须是 cms',
      EXPECTED_PROJECT_NAME,
    )
    .option(
      '--service <name>',
      '只处理指定服务（如 backend/frontend/blog/cms_pg），缺省为全部服务',
      '',
    )
    .option(
      '--env-file <file>',
      '环境变量文件，容器契约与部署凭据同在一份，上传到远端 REMOTE_DIR',
      ENV_FILE,
    )
    .option('--skip-build', '跳过本地构建与推送，直接推送已有镜像')
    .option('--dry-run', '预览模式 - 仅打印命令，不实际执行')
    .option('-y, --yes', '跳过确认直接执行')
    .action(async (options: CliOptions) => {
      const envFile = options.envFile || ENV_FILE;
      if (!fs.existsSync(envFile)) {
        fail(`部署所需的环境文件 ${envFile} 不存在`);
        return;
      }

      const validationResult = generateConfig(options);
      if (!validationResult.success) {
        process.exitCode = 1;
        return;
      }
      const config = validationResult.data;

      const composeRefsResult = collectComposeEnvRefs();
      if (!composeRefsResult.success) {
        fail(composeRefsResult.error);
        return;
      }

      const projectNameResult = resolveProjectName(config);
      if (!projectNameResult.success) {
        fail(projectNameResult.error);
        return;
      }
      config.projectName = projectNameResult.data;

      const problems = validateContract(config, composeRefsResult.data);
      if (problems.length > 0) {
        fail(`部署契约校验失败:\n  - ${problems.join('\n  - ')}`);
        return;
      }

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
        fail(localResult.error);
        return;
      }

      const remoteResult = await executeRemoteTasks(config);
      if (!remoteResult.success) {
        fail(remoteResult.error);
        return;
      }
    });

  program.parse();
}

main().catch((error: unknown) => {
  const { message, stack } = normalizeError(error);

  colorError(`未捕获的异常: ${message}`);
  if (stack) {
    colorError('\n错误堆栈:', chalk.gray(stack));
  }
  process.exit(1);
});
