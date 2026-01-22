import { ZView } from '@zcat/ui';
import React from 'react';

import { StatisticsApi } from '@blog/apis';

export function meta() {
  return [
    { title: '统计功能测试' },
    { name: 'description', content: '测试博客访客统计功能' },
  ];
}

export default function TestStatisticsPage() {
  const [status, setStatus] = React.useState<string>('未测试');
  const [logs, setLogs] = React.useState<string[]>([]);
  const [isClient, setIsClient] = React.useState(false);
  const [currentPath, setCurrentPath] = React.useState('');
  const [pageTitle, setPageTitle] = React.useState('');

  // 确保只在客户端执行
  React.useEffect(() => {
    setIsClient(true);
    setCurrentPath(window.location.pathname);
    setPageTitle(document.title);
  }, []);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testAutoRecord = async () => {
    if (!isClient) {
      addLog('错误: 客户端未准备就绪');
      return;
    }

    setStatus('测试中...');
    addLog('开始自动记录测试');

    try {
      await StatisticsApi.uploadVisitRecord(currentPath, pageTitle);
      addLog('自动记录成功');
      setStatus('测试成功');
    } catch (error) {
      addLog(`自动记录失败: ${String(error)}`);
      setStatus('测试失败');
    }
  };

  const getBrowserInfo = () => {
    if (!isClient) {
      addLog('错误: 客户端未准备就绪');
      return;
    }

    const info = StatisticsApi.getBrowserInfo();
    addLog(`浏览器信息: ${JSON.stringify(info)}`);
  };

  const getDeviceId = async () => {
    if (!isClient) {
      addLog('错误: 客户端未准备就绪');
      return;
    }

    const deviceId = await StatisticsApi.generateDeviceId();
    addLog(`设备ID: ${deviceId}`);
  };

  return (
    <ZView className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">博客访客统计功能测试</h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">测试状态</h2>
          <div
            className={`p-3 rounded ${
              status === '测试成功'
                ? 'bg-green-100 text-green-800'
                : status === '测试失败'
                  ? 'bg-red-100 text-red-800'
                  : status === '测试中...'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
            }`}
          >
            {status}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">测试操作</h2>
          <div className="space-x-4">
            <button
              onClick={testAutoRecord}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              测试自动记录
            </button>
            <button
              onClick={getBrowserInfo}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              获取浏览器信息
            </button>
            <button
              onClick={getDeviceId}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              获取设备ID
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">API信息</h2>
          <div className="bg-gray-100 p-3 rounded">
            <p>
              <strong>接口地址:</strong> /api/blog/visitor
            </p>
            <p>
              <strong>请求方法:</strong> POST
            </p>
            <p>
              <strong>当前页面:</strong> {isClient ? currentPath : '加载中...'}
            </p>
            <p>
              <strong>页面标题:</strong> {isClient ? pageTitle : '加载中...'}
            </p>
            <p>
              <strong>客户端状态:</strong> {isClient ? '已准备' : 'SSR模式'}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">测试日志</h2>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div>暂无日志...</div>
            ) : (
              logs.map((log, index) => <div key={index}>{log}</div>)
            )}
          </div>
        </div>
      </div>
    </ZView>
  );
}
