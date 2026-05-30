# Frontend 鉴权重构设计文档

## 概述

重构 frontend 鉴权机制，使用 React Router V7 middleware 替代当前的 EventCenter 发布订阅模式。

## 问题分析

### 当前架构问题

1. **鉴权逻辑分散**：鉴权检查分布在多个地方
   - `cms-layout.tsx` loader 中调用 `UserApi.userInfo()` 验证
   - `root.tsx` 中通过 `HttpClient.subscribeUnauthEvent()` 订阅 401 事件
   - `http-client.ts` 中通过 EventCenter 发布 401 事件

2. **EventCenter 模式复杂**：发布订阅模式增加了调试难度，容易出现时序问题

3. **未充分利用 React Router V7 特性**：已启用 `v8_middleware` 但未使用

## 解决方案

### 核心思路

使用 React Router V7 服务端 middleware 进行统一鉴权，白名单路由跳过鉴权，其他路由验证 token 有效性。

### 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    React Router                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  1. root.tsx middleware (服务端)               │   │
│  │     - 检查白名单路由                           │   │
│  │     - 调用 UserApi.isValid() 验证 token      │   │
│  │     - 未登录则重定向 /login                 │   │
│  └─────────────────────────────────────────────────┘   │
│                         ↓                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  2. cms-layout loader                          │   │
│  │     - 调用 UserApi.userInfo() 获取用户信息   │   │
│  └─────────────────────────────────────────────────┘   │
│                         ↓                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  3. 组件渲染                                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 详细设计

### 1. 鉴权 Middleware (`app/auth/middleware.ts`)

- 定义白名单路由：`["/", "/login"]`
- 从 Cookie 中提取 token（通过现有的 request-context 机制）
- 调用 `UserApi.isValid()` 验证 token 有效性
- 未登录则 `throw redirect("/login")`
- 验证通过则继续执行

### 2. UserApi 新增 `isValid()` 方法

- 调用 `/api/bff/auth/isValid` 接口（通过现有 BFF 通配转发）
- 返回 `Promise<boolean>`

### 3. 后端新增 `/auth/isValid` 接口

- 轻量级接口，仅验证 token 是否在白名单中
- 返回 `{ code: "0000", valid: boolean }`

### 4. 重构 `root.tsx`

- 导入并应用鉴权 middleware
- 移除 `HttpClient.subscribeUnauthEvent()` 订阅
- 简化 Layout 组件

### 5. 重构 `cms-layout.tsx`

- 保留 loader 调用 `UserApi.userInfo()` 获取用户信息
- 简化 ErrorBoundary

### 6. 简化 `http-client.ts`

- 移除 EventCenter 相关代码
- 401 错误由 middleware 统一处理

## 文件变更清单

### 新增文件

- `app/auth/middleware.ts` - 鉴权 middleware 实现

### 修改文件

- `app/root.tsx` - 应用 middleware，移除事件订阅
- `app/layouts/cms-layout.tsx` - 简化 loader
- `app/api/http/http-client.ts` - 移除 EventCenter 相关代码
- `app/api/interfaces/user-api.ts` - 新增 `isValid()` 方法
- **后端** `apps/backend/src/features/cms/auth/auth.route.ts` - 新增 `/auth/isValid` 接口
- **后端** `apps/backend/src/features/cms/auth/auth.service.ts` - 新增验证方法

### 考虑删除

- `app/api/http/event-center.ts` - 如无其他使用则删除

## 数据流

1. \*\*用户访问受保护路由 → middleware 检查 → 验证通过 → loader 获取用户信息 → 渲染页面
2. \*\*用户访问受保护路由 → middleware 检查 → 验证失败 → 重定向到登录页
3. \*\*用户登录 → 设置 Cookie → 重定向到 dashboard → middleware 验证通过 → 正常访问

## 优势

- ✅ 统一鉴权逻辑集中在一个地方
- ✅ 性能好，服务端直接拦截
- ✅ 代码简洁，移除复杂的事件机制
- ✅ 符合 React Router V7 最佳实践
- ✅ middleware 只验证 token 有效性，用户信息按需获取，更高效