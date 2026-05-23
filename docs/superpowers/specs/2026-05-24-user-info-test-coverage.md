# 用户信息编辑全链路测试覆盖设计

## 背景

用户信息编辑功能（User Info）涉及后端 API 和前端管理后台页面。当前已有后端 service/route 基础测试，但前端 API 层、OssAction action、页面组件和 E2E 均存在测试缺口。

基于已有的 monorepo 测试体系（2026-05-19-monorepo-test-design.md），本次对用户信息编辑场景做全链路闭环覆盖。

## 涉及范围

- `apps/backend` — user-info service / route / schema
- `apps/frontend` — user-api interface、OssAction action、user-info 页面组件、E2E

## 非目标

- 不修改用户信息编辑的业务逻辑
- 不修改现有表单组件（createZForm、ImageUpload 等）的实现
- 不涉及 blog 前台的用户信息展示页

## 分层设计

### 第一层：后端 — 补充边缘用例

#### Service 测试补充

| 用例 | 说明 |
|------|------|
| `update` 传入部分字段 | contact 为 undefined 时 `JSON.stringify` 返回 undefined，Prisma 应跳过该字段 |
| `get` 已有记录无 avatar | `transformUserInfo` 保持原对象不变 |
| `update` 全部字段更新 | 验证所有字段正确序列化 |

#### Route 测试补充

| 用例 | 说明 |
|------|------|
| POST 校验失败返回 400 | 发送空 name / 非法 email，验证返回 400 状态码 |
| GET 带上 user 上下文 | 在测试 app 中注入一个设 `c.set('user', {userId:1})` 的测试中间件，验证 service 被传入正确的 userId |

#### Schema 一致性

- Zod schema 要求 contact.email 为合法邮箱、name min(1)
- DB 中字段为 `String?`（可空），但 schema 要求全部必填，当前行为合理，不做改动

### 第二层：前端 API 接口层

文件：`apps/frontend/app/api/interfaces/user-api.ts`

按照 `auth-api.test.ts` 的模式（mock `HttpClient.get` / `HttpClient.post`）：

| 测试 | 说明 |
|------|------|
| `userInfo()` | mock `HttpClient.get`，验证返回数据中 contact 被 `safeParseJson` 正确解析 |
| `userInfo()` — contact 为空字符串 | 验证 fallback 为默认值 |
| `updateUserInfo()` | mock `HttpClient.post`，验证 contact 被 `JSON.stringify` 后发送 |
| `updateUserInfo()` — 返回数据解析 | 验证响应中的 contact 被正确反序列化 |

### 第三层：前端 OssAction 层

文件：`apps/frontend/app/shared/modules/oss/oss.action.ts`

基于已有 `oss.action.test.ts` 的 mock 框架（已 mock `UserApi.updateUserInfo` 和 `compressorjs`）：

| 测试 | 说明 |
|------|------|
| `updateUserInfo` — 有 blob 头像 | 验证 uploadAvatar → OSS PUT → 调用 UserApi.updateUserInfo 传入新 key |
| `updateUserInfo` — 无 blob 头像 | avatar 为普通 URL，跳过上传，直接调用 UserApi |
| `updateUserInfo` — 上传失败 | fetch PUT 返回非 ok，验证错误被抛出 |

### 第四层：前端页面组件

文件：`apps/frontend/app/features/user-info/routes/user-info.tsx`

使用 `@testing-library/react`，遵循已有 setup（jsdom + jest-dom matchers）：

| 测试 | 说明 |
|------|------|
| 渲染显示模式 | 验证 loader 数据中的 name、email、github 等字段正确展示为只读文本 |
| 点击编辑按钮 | 表单出现，字段预填正确 |
| 编辑后保存 | mock `OssAction.updateUserInfo`，验证调用参数正确 |
| 取消编辑 | 恢复为编辑前值 |
| 保存时 loading 遮罩 | 乐观更新触发后验证 spinning 元素存在 |
| 保存失败回滚 | mock 返回 reject，验证值回滚到原值 |

### 第五层：E2E 测试

文件：`apps/frontend/tests/e2e/user-info.spec.ts`

Mock backend 增加如下端点，数据与前端 `UserInfo` interface 对齐：

```
GET  /api/cms/user-info → { code:'0000', data: { name:'Admin', contact:'{"email":"admin@test.com","github":"admin"}', occupation:'Developer', avatar:'', aboutMe:'About me', abstract:'Abstract' } }
POST /api/cms/user-info/update → 返回更新后的数据（同结构）
```

E2E 场景：

1. 登录 → 导航到用户信息页 → 验证字段展示
2. 点击编辑 → 修改用户名 → 保存 → 验证页面显示新值
3. 再次点击编辑 → 取消 → 验证恢复

## 实施顺序

1. 后端测试补充（边缘用例）
2. 前端 API 接口测试
3. 前端 OssAction 层测试
4. 前端页面组件测试
5. Mock backend 添加 user-info 端点
6. E2E 测试编写
7. 全量运行验证

## 文件清单

### 新增

- `apps/frontend/app/api/interfaces/user-api.test.ts`
- `apps/frontend/app/features/user-info/routes/user-info.test.tsx`
- `apps/frontend/tests/e2e/user-info.spec.ts`

### 修改

- `apps/backend/src/features/cms/user-info/user-info.service.test.ts` — 补充边缘用例
- `apps/backend/src/features/cms/user-info/user-info.route.test.ts` — 补充校验失败等用例
- `apps/frontend/app/shared/modules/oss/oss.action.test.ts` — 补充 updateUserInfo 用例
- `apps/frontend/tests/e2e/mock-backend.mjs` — 添加 user-info 端点

## 风险

- 页面组件使用 `useOptimisticObject`、`createZForm` 等自定义 hook，测试中需要合理 mock 或 stub
- `ImageUpload` 组件依赖 OSS 流程，单元测试中应 mock 其行为，不测试真正上传
- E2E 的 user-info mock 数据需要与前端表单 Schema 保持字段一致
