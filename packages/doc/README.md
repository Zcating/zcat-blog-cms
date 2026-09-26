# doc

`@zcat/ui` 组件库文档站（`packages/doc`）。

## 技术栈

- React 19 + TanStack Start（Vite + file-based routing，SSR 由 Nitro 输出）
- TanStack Router
- Tailwind CSS 4
- 组件与文档渲染来自 `@zcat/ui`（`packages/ui`）

## 开发命令

在仓库根目录执行：

- 启动开发服务器：`pnpm --filter doc run dev`
- 类型检查：`pnpm --filter doc run typecheck`
- 单元测试：`pnpm --filter doc run test`
- Lint：`pnpm --filter doc run lint`

## 构建与运行

```bash
pnpm --filter doc run build
pnpm --filter doc run start
```

构建产物输出到 `.output/`，`start` 通过 `.output/server/index.mjs` 提供 SSR 服务。

## 目录结构

- `app/routes/`：路由文件，`routeTree.gen.ts` 由 TanStack 插件生成，勿手动修改
- `app/docs/`：`DOCUMENT_CONFIGURES` 注册表与 markdown 源文件，侧边栏与 `/:component` loader 共用该注册表
- `app/features/`：文档站自身的组件

## 路由

- `/`：首页
- `/:component`：按 `DOCUMENT_CONFIGURES` 解析对应 markdown；未注册的名称回落到 404 文档内容