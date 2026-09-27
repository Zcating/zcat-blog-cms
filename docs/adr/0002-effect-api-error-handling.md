# 0002 - API 错误层迁移至 Effect（未采纳）

**本决策未被采纳。** 记录保留在此，因为它的目标部分达成了，而机制没有。

原决策是：将 `apps/frontend` 的 API 错误处理从 `EventCenter` 事件总线迁移至 Effect，`HttpClient` 的 `get/post/put/del` 直接返回 `Effect<A, ApiError>`，错误作为 tagged union（`_tag: ApiErrorTag`）在 Effect 的 Left channel 中传播；认证失败时 Effect 错误向上冒泡至 loader/action 层，由其执行 `redirect("/login")`。

## 实际落地的是什么

`HttpClient` 已被删除，取代它的是**直接抛出 tagged union**：`app/server/errors.ts` 用 `mapResultCodeToTag` 把响应码映射到 `_tag`，并以 `ApiErrorException` 抛出；调用方按 `_tag` 判断（例如 `isUnauthorizedError`）。`apps/frontend` 没有任何 `effect` 导入——该依赖一度被声明却无人使用，已随此记录移除。

**原决策的核心目标仍然成立**：错误是一等公民的、可判别的类型，而不是全局隐式事件。`EventCenter` 没有被保留。放弃的只是 Effect 这个载体——tagged union 直接达成了同一个目标，少了一层运行时依赖与一次控制反转。

## 登录跳转由谁负责，结论未变

原决策中「loader/action 层处理重定向，而非 `HttpClient` 层面拦截」这一条仍然成立，且由另一套机制承担：受保护布局的 `beforeLoad` 是 **UX 守卫**，server function 的中间件是**安全边界**。ADR-0009 进一步规定 401 时清空私有查询缓存**并**导航回登录页。

## 一处刻意留下的不一致

`apps/backend` 使用 Effect（`Effect.gen`、`yield*`、服务以 Effect 建模），而 `apps/frontend` 与 `apps/blog` 用 tagged union。两者的取舍理由不同：后端的服务编排确实从 Effect 受益，前端则没有对应的组合需求。统一两者是一次独立迁移，不应搭在别的工作上顺手完成；记录在此以免下一个读者以为两边本来就该一致。