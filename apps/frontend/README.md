# frontend

CMS 管理后台（`apps/frontend`）：管理博客的文章、分类、标签、照片与相册。

## 技术栈

- React 19 + TanStack Start（Vite + file-based routing，SSR 由 Nitro 输出）
- TanStack Router + TanStack Query
- Tailwind CSS 4 + Ant Design 生态组件
- 共享组件来自 `@zcat/ui`（`packages/ui`）

## 环境变量

复制 `.env.example` 为 `.env` 并按本地后端地址填写，变量说明见模板内注释。

## 开发命令

在仓库根目录执行：

- 启动开发服务器：`pnpm --filter frontend run dev`
- 类型检查：`pnpm --filter frontend run typecheck`
- 单元测试：`pnpm --filter frontend run test`
- E2E 测试：`pnpm --filter frontend run test:e2e`

## 构建与运行

```bash
pnpm --filter frontend run build
pnpm --filter frontend run start
```

构建产物输出到 `.output/`，`start` 通过 `.output/server/index.mjs` 提供 SSR 服务。

## 目录结构

- `app/routes/`：路由文件，`routeTree.gen.ts` 由 TanStack 插件生成，勿手动修改
- `app/features/`：按业务划分的页面与组件
- `app/server/`：服务端函数，读取 `BACKEND_API_URL` 调用 `apps/backend`
- `app/layouts/`：布局组件
- `app/shared/`：跨业务复用的 hooks、组件与服务层
- `tests/e2e/`：Playwright E2E 用例