# 0002 - API 错误层迁移至 Effect

将 `apps/frontend` 的 API 错误处理从 `EventCenter` 事件总线迁移至 Effect。`HttpClient` 的 `get/post/put/del` 直接返回 `Effect<A, ApiError>`，错误作为 tagged union（`_tag: ApiErrorTag`）在 Effect 的 Left channel 中传播。认证失败时 Effect 错误向上冒泡至 loader/action 层，由其执行 `redirect("/login")`。

**核心权衡**：

- 拒绝 `EventCenter`（全局隐式事件）→ Effect（一等公民错误类型，可组合）
- 拒绝 EventCenter + 联合类型（`_tag` 在 body 里）→ Effect + `ApiErrorTag` 类型别名（更简洁）
- Effect 放在 `HttpClient` 内部（而非外部包装层）→ 复用 SSR cookie 转发 + retry 逻辑
- loader/action 层处理重定向，而非 `HttpClient` 层面拦截（符合现有 CONTEXT.md「不实现路由守卫」约定）