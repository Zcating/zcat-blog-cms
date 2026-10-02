// kill-port.mjs
//
// 释放指定端口：先杀掉正在监听的进程，再退出。
// 用法: node kill-port.mjs <port>
//
// Windows: netstat -ano + taskkill /F /PID
// macOS/Linux: lsof -ti tcp:<port> -sTCP:LISTEN（fallback: fuser <port>/tcp）

import { execSync } from 'node:child_process';

const rawPort = process.argv[2];
const port = Number(rawPort);
if (!rawPort || !Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`[kill-port] 无效端口: ${rawPort ?? '(空)'}`);
  process.exit(1);
}

const isWindows = process.platform === 'win32';

function safeExec(cmd) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return '';
  }
}

function getListeningPids() {
  if (isWindows) {
    // netstat -ano 输出示例: "  TCP    0.0.0.0:9090    0.0.0.0:0    LISTENING    1234"
    const out = safeExec(`netstat -ano | findstr :${port}`);
    if (!out) return [];
    const pids = out
      .split(/\r?\n/)
      .filter((line) => /LISTENING/i.test(line))
      .map((line) => line.trim().split(/\s+/).pop())
      .filter((pid) => pid && /^\d+$/.test(pid));
    return [...new Set(pids)];
  }

  // macOS / Linux
  const out = safeExec(`lsof -ti tcp:${port} -sTCP:LISTEN 2>/dev/null`);
  if (out) {
    return [...new Set(out.split(/\r?\n/).filter(Boolean))];
  }
  // fuser 回退（部分精简 Linux 镜像没有 lsof）
  const fuserOut = safeExec(`fuser ${port}/tcp 2>/dev/null`);
  if (fuserOut) {
    return [
      ...new Set(
        fuserOut.trim().split(/\s+/).filter((p) => /^\d+$/.test(p)),
      ),
    ];
  }
  return [];
}

function killPid(pid) {
  try {
    if (isWindows) {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
    } else {
      process.kill(Number(pid), 'SIGKILL');
    }
    return true;
  } catch {
    return false;
  }
}

const pids = getListeningPids();
if (pids.length === 0) {
  console.log(`[kill-port] 端口 ${port} 上没有进程`);
  process.exit(0);
}

let killed = 0;
for (const pid of pids) {
  if (killPid(pid)) {
    console.log(`[kill-port] 已结束 PID ${pid}（端口 ${port}）`);
    killed++;
  } else {
    console.warn(`[kill-port] 结束 PID ${pid} 失败（端口 ${port}）`);
  }
}

if (killed === 0) {
  process.exit(1);
}
