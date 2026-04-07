# AGENTS.md - packages/ui

本文件定义组件库（`packages/ui`）的协作约束。

## 作用范围

- 仅适用于目录：`packages/ui/**`
- 面向 `apps/blog` 与 `apps/frontend` 复用

## 技术栈

- React
- TypeScript
- Tailwind CSS
- tsup 构建

## 开发命令

- 启动开发（watch）：`pnpm --filter ui run dev`
- 构建：`pnpm --filter ui run build`
- 类型检查：`pnpm --filter ui run typecheck`
- Lint：`pnpm --filter ui run lint`

## 强制约束

- 文件命名使用 `kebab-case`
- 公共 API 稳定优先，避免无必要 breaking change
- 样式与主题能力应可配置，避免业务硬编码
- 新组件默认考虑可访问性（键盘可用、语义结构、aria）

## 组件设计要求

- Props 语义明确，避免布尔爆炸
- 优先组合优于继承，减少高耦合
- 对外导出收敛在统一入口
- 必要时提供受控与非受控两种模式

## 测试与文档

- 新增组件应提供最小可用示例
- 组件行为变更需补充测试或文档说明

