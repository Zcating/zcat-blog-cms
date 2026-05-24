# CONTEXT.md — zcat-blog-cms 领域术语表

## 认证领域 (Authentication)

| 术语 | 定义 |
|------|------|
| Token Cookie | 名为 `token` 的 httpOnly Cookie，存储 JWT（含 `Bearer ` 前缀），`SameSite=Strict`，由 BFF auth route 负责写入和清除 |
| CSRF 策略 | 不实现 CSRF token 校验。由 `SameSite=Strict` 同源策略防御 |
| Token 生命周期 | 单 JWT，永不过期。生命周期完全由后端 whitelist 表的 `create`/`remove` 管理。用户不主动登出则一直有效 |
| 前端携带模式 | 浏览器自动携带 `token` Cookie，frontend JS 层不读写该 Cookie。`js-cookie` 不再用于 token |
| 路由守卫 | 不实现前端/BFF 层的路由守卫。401 回落保持现状：`HttpClient.handleResponse` → `EventCenter.emit('UNAUTH')` → `navigate('/login')` |
| 用户信息管理 | 登录后不主动获取用户信息，不缓存。各页面按需调用接口 |
| 记住我 | 已移除，登录页不显示 |
| CMS 退出登录 | CMS layout sidebar footer 新增"退出登录"项（LogOut 图标 + 文字），点击后通过 ZDialog.confirm 二次确认，确认后调用 AuthApi.logout() → BFF 清除 httpOnly cookie → 前端 navigate('/login') |
