# AGENTS.md - apps/frontend

本文件定义 CMS 管理后台（`apps/frontend`）的协作约束。

## 作用范围

- 仅适用于目录：`apps/frontend/**`
- 依赖接口契约来自 `apps/backend`

## 技术栈

- React + React Router（framework mode）
- Tailwind CSS
- Ant Design 生态组件
- 依赖 `@zcat/ui`

## 开发命令

- 启动开发：`pnpm --filter frontend run dev`
- 类型检查：`pnpm --filter frontend run typecheck`
- Lint：`pnpm --filter frontend run lint`
- 构建：`pnpm --filter frontend run build`

## 强制约束

- 文件命名使用 `kebab-case`
- 表单交互必须包含校验与错误提示
- 列表页必须处理分页、空数据、加载态、异常态
- 不在页面组件里直接写大段请求逻辑，抽离为 hooks 或 service

## 交互与可维护性要求

- 操作反馈明确：成功提示、失败原因、可重试路径
- 危险操作需二次确认
- 复杂页面拆分为可复用模块，避免单文件过大
- 保持路由、loader、action 职责清晰

## 测试要求

- 覆盖核心后台流程：登录、内容管理、媒体管理等关键路径
- E2E 使用 Playwright，要求在本地可稳定通过

