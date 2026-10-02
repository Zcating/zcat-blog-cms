# 0001 - 前端认证方案：httpOnly Cookie

前端 token 从 `js-cookie` 读写改为由 httpOnly Cookie 承载。CSRF token 基础设施移除，由 `SameSite=Strict` 替代。Cookie 由**前端自身的 server function** 写入与清除（TanStack Start 的服务端边界），不是独立的 BFF 路由。

选择了单 JWT 永不过期（whitelist 生命周期） + httpOnly Cookie + 同源服务端写入的组合。拒绝 refresh-token（复杂度超出 CMS 场景需求）、内存存储（丢失 SSR 兼容性）、CSRF token 落地（同源 SameSite=Strict 已足够防御）。

被拒绝的替代方案值得记录：纯内存存储（页面刷新需重登录）、refresh-token 机制（管理两个 cookie 和刷新旋转）、后端直接写 cookie（`apps/backend` 耦合了 domain 与应用层配置；写 cookie 的是 `apps/frontend` 的 server function）。

**本记录原先写的是「BFF 托管」与「BFF 专属 auth route」，该机制已不存在。** ADR-0003 删除了整个 `/api/bff` 面，Cookie 改由同源 server function 承载。Cookie 语义本身（单 JWT 名为 `token`、HttpOnly、`SameSite=Strict`、`Path=/`、值可为裸值或 `Bearer ` 前缀、无 refresh token、客户端不接触 token）未受该次迁移影响，仍然有效；`CONTEXT.md` 中的记述与实际一致。