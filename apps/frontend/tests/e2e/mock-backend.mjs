import { createServer } from 'node:http';

const port = 9090;

function sendJson(response, data, status = 200) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(
    JSON.stringify({
      code: '0000',
      message: 'success',
      data,
    }),
  );
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

  if (url.pathname === '/api/health') {
    sendJson(response, { ok: true });
    return;
  }

  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    sendJson(response, {
      accessToken: 'frontend-e2e-token',
    });
    return;
  }

  if (url.pathname === '/api/cms/statistics/summary') {
    sendJson(response, {
      totalVisits: 1,
      totalUniqueVisitors: 1,
      todayVisits: 1,
      todayUniqueVisitors: 1,
      topPages: [],
    });
    return;
  }

  if (url.pathname === '/api/cms/statistics/chart-data') {
    sendJson(response, []);
    return;
  }

  if (url.pathname === '/api/cms/statistics/detail') {
    sendJson(response, []);
    return;
  }

  response.writeHead(404, { 'Content-Type': 'application/json' });
  response.end(
    JSON.stringify({
      code: '4040',
      message: `Unhandled mock backend route: ${request.method} ${url.pathname}`,
      data: null,
    }),
  );
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Mock backend listening on http://127.0.0.1:${port}`);
});
