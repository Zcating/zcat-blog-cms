# AGENTS.md - apps/backend

本文件定义后端服务（`apps/backend`）的协作约束。

## 作用范围

- 仅适用于目录：`apps/backend/**`
- 若改动接口契约，需同步通知 `apps/blog` 与 `apps/frontend`

## 技术栈

- NestJS
- Prisma
- PostgreSQL

## 开发命令

- 启动开发：`pnpm --filter backend run dev`
- 类型/构建检查：`pnpm --filter backend run build`
- Lint：`pnpm --filter backend run lint`
- 单元测试：`pnpm --filter backend run test`
- E2E 测试：`pnpm --filter backend run test:e2e`
- Prisma 生成：`pnpm --filter backend run db:generate`

## 强制约束

- 文件命名使用 `kebab-case`
- API 变更必须保持向后兼容，或明确提供迁移方案
- 禁止跳过 DTO/校验直接暴露数据库模型
- 数据库结构变更必须通过 Prisma 流程管理

## 实现要求

- Controller 只做协议层处理，业务逻辑放 Service
- 输入输出使用明确 DTO 与校验
- 统一错误响应格式，避免泄露敏感内部信息
- 关键路径加日志（不打印密钥、token、密码）

## 数据库与环境

- 本地数据库优先通过 docker 启动 `cms_pg`
- 环境变量从 `.env` 或 `apps/backend/.env.development` 加载
- 新增环境变量需同步文档说明用途与默认值策略

## 测试要求

- 新增或修复接口需覆盖成功与失败分支
- 至少补充一个防回归测试（单测或 e2e）

