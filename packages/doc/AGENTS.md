# AGENTS.md - packages/doc

本文件定义组件库文档站（`packages/doc`）的协作约束。

## 作用范围

- 仅适用于目录：`packages/doc/**`
- 与 `packages/ui` 的组件文档保持一致

## 开发命令

- 启动开发：`pnpm --filter doc run dev`
- 构建：`pnpm --filter doc run build`
- 类型检查：`pnpm --filter doc run typecheck`
- Lint：`pnpm --filter doc run lint`

## 强制约束

- 文件命名使用 `kebab-case`
- 文档示例必须可运行、可复现
- API 文档与组件真实行为保持一致，避免过期描述

## 文档质量要求

- 每个组件至少包含：用途、基础示例、关键 props、注意事项
- 复杂组件需补充边界行为说明（空值、禁用、加载、错误）
- 变更组件行为时，优先同步更新文档再合并代码

## 验证要求

- 发布前至少验证文档站可启动且关键示例可交互
- 链接与代码片段应可正常访问和复制

