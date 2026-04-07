# AGENTS.md - apps/blog

本文件定义 Blog 站点前端（`apps/blog`）的协作约束。

## 作用范围

- 仅适用于目录：`apps/blog/**`
- 涉及跨项目改动时，需同步检查对应项目的 `AGENTS.md`

## 技术栈

- React + React Router（framework mode）
- Tailwind CSS
- 依赖 `@zcat/ui`

## 开发命令

- 安装依赖（仓库根目录）：`pnpm install`
- 启动 Blog：`pnpm --filter blog run dev`
- 类型检查：`pnpm --filter blog run typecheck`
- Lint：`pnpm --filter blog run lint`
- 构建：`pnpm --filter blog run build`

## 强制约束

- 文件命名使用 `kebab-case`
- 优先复用 `@zcat/ui` 组件，不重复造轮子
- 非必要不改动 `apps/backend`、`apps/frontend`、`packages/ui` 的实现
- 任何接口字段变更，需与 `apps/backend` 保持契约一致

## 代码与体验要求

- 保持 SSR/路由加载行为稳定，避免引入首屏闪烁
- 处理加载态、空态、错误态
- 新增页面需考虑移动端适配与可访问性（语义标签、可聚焦）
- 避免在组件内堆叠复杂副作用，优先使用 loader/action 和可复用 hooks

## 测试要求

- 至少覆盖关键主路径：页面访问、核心交互、接口异常分支
- E2E 使用 Playwright，测试需可重复运行且稳定通过

