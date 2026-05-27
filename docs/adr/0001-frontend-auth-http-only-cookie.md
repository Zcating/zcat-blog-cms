# 0001 - 前端认证方案重构：BFF 托管 httpOnly Cookie

前端 token 从 `js-cookie` 读写改为由 BFF auth route 管理 httpOnly Cookie。CSRF token 基础设施移除，由 `SameSite=Strict` 替代。

选择了单 JWT 永不过期（whitelist 生命周期） + httpOnly Cookie + BFF 专属 auth route 的组合。拒绝 refresh-token（复杂度超出 CMS 场景需求）、内存存储（丢失 SSR 兼容性）、CSRF token 落地（同源 SameSite=Strict 已足够防御）。

被拒绝的替代方案值得记录：纯内存存储（页面刷新需重登录）、refresh-token 机制（管理两个 cookie 和刷新旋转）、后端直接写 cookie（后端耦合了 domain 和应用层配置）。