#!/usr/bin/env node

import * as child_process from 'child_process';

const spawn = (command: string, params: string[] = []) => {
  return new Promise<string>((resolve) => {
    const stream = child_process.spawn(command, params);
    const chunkList: string[] = [];
    stream.stdout.on('data', (chunk) => {
      const chunkString = chunk.toString();
      if (!chunkString || chunkString === '0') {
        console.log(`已完成 => ${params[0]}`);
        return;
      }
      chunkList.push(chunkString);
    });
    stream.stderr.on('data', (chunk) => {
      chunkList.push(chunk.toString());
    });
    stream.on('close', () => {
      resolve(chunkList.join(''));
    });
  });
};

function processCommands(commands: string[]) {
  const params = {
    ecosystem: '',
    name: '',
    command: [] as string[],
  };
  for (let i = 0; i < commands.length; i++) {
    const arg = commands[i];
    if (arg === '--name') {
      params.name = commands[i + 1] || '';
      i += 1;
      continue;
    }
    if (arg === '--') {
      let j = i + 1;
      while (j < commands.length) {
        const item = commands[j] || '';
        if (item.startsWith('--')) {
          break;
        }
        params.command.push(item);
        j += 1;
      }
      i = j + 1;
      continue;
    }

    params.ecosystem = arg || '';
  }

  return params;
}

async function main(args: string[]) {
  const params = processCommands(args.slice(2));
  if (!params.ecosystem) {
    console.log('需要执行的具体环境，比如 pnpm');
    return;
  }

  if (!params.name) {
    console.log('请输入名称');
    return;
  }

  if (!params.command.length) {
    console.log('请输入命令');
    return;
  }

  const pid = await spawn('pm2', ['pid', params.name]);
  const pidNumber = parseInt(pid);

  if (Number.isNaN(pidNumber)) {
    console.log('正在启动项目: ', params.name);
    await spawn('pm2', [
      'start',
      params.ecosystem,
      '--name',
      params.name,
      '--',
      ...params.command,
    ]);
  } else {
    console.log('正在删除项目进程: ', params.name);
    await spawn('pm2', ['delete', params.name]);

    console.log('正在重启项目: ', params.name);
    await spawn('pm2', [
      'start',
      params.ecosystem,
      '--name',
      params.name,
      '--',
      ...params.command,
    ]);
  }
}

main(process.argv);
