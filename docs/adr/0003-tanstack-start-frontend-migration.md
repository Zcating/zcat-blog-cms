---
status: accepted
---

# Frontend 采用 TanStack Start 的类型化服务端边界

当前 CMS 管理后台使用 React Router v7 的完整 SSR、通用 `/api/bff/*` 代理和 `HttpClient`。本次决定迁移到固定版本的 TanStack Start（决策时已验证的 `@tanstack/react-start` 为 `1.168.58`），目标不是前后端端到端类型安全，而是在不修改 Fastify 契约的前提下，建立可验证的 frontend 服务端边界类型安全。

## 决策

- 保持完整 SSR；TanStack Start 使用 Vite + Nitro，生产入口为 `.output/server/index.mjs`。只对明确依赖浏览器 API 的组件使用客户端边界。
- 使用文件路由。`app/routes/` 只保留 TanStack 必需的轻量路由元数据（loader、beforeLoad、error component）及页面引用；页面实现归 `app/features/`。TanStack 的 `$`、`__` 等路由文件名是 kebab-case 规则的明确例外。
- 删除通用 BFF proxy 及旧 `HttpClient` 事件模式，**不保留任何 `/api/bff/*` 兼容路由、server route 或 fallback**。`app/server/` 作为完整服务端边界，集中维护后端请求、Zod 输入/响应 schema、server functions、Query options 和错误转换；server function 在服务端解包成功响应并抛出类型化错误。
- TanStack Query 是唯一的服务端状态源：路由 loader 只负责 SSR 预取与脱水，组件通过 Query 读取；mutation 成功后按业务范围失效。现有乐观交互等价迁移，Query 不持久化，退出或认证失效时清空全部私有缓存。
- 认证采用双层边界：受保护布局的 `beforeLoad` 负责导航重定向和用户上下文，server function middleware 负责实际授权。继承既有的单 JWT、HttpOnly Cookie、`SameSite=Strict` 原则，不引入 refresh token 或新的 CSRF 机制。
- 文件压缩、预签名 URL 和对象存储上传继续由浏览器直传；server boundary 只处理元数据和权限。server functions 不自动重试请求，写入操作由用户确认后重试。
- 采用运行时服务端环境变量，并允许最小范围修改 frontend Docker 启动配置。交付为一次最终切换，开发过程可分阶段验证；不新增 CI、自动回滚或后端改造。发布失败时保留旧镜像并人工回滚。
- 本次只做迁移所需的 UI 兼容修复，不进行视觉重设计；`article-categories` 与 `settings` 空壳按现状迁移。

## Consequences

TanStack Start 仍处于 RC 阶段，生态和 Ant Design SSR 兼容性需要通过实际构建与 E2E 验证；由于后端契约不改，Zod schema 是前端维护的重复契约，必须配合契约测试防止漂移。该方案移除通用代理会增加按业务域迁移 server functions 的工作量，但能消除弱类型入口并明确安全边界。

## Considered options

- 保留 React Router v7 或使用 code-based routes：迁移风险较低，但无法获得本次决策所针对的生成路由类型安全。
- 保留 `/api/bff/*`：改动较少，但继续保留无类型 catch-all 边界，与目标冲突。
- 修改 Fastify 契约或引入 OpenAPI 生成：可获得更强的端到端契约，但超出本次 frontend-only 范围。
- 全面改为 SPA 或 data-only SSR：可降低 hydration 复杂度，但改变当前 SSR 能力。