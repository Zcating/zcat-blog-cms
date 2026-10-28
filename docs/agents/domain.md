# 领域文档

工程类技能在探索代码库时，如何消费本仓库的领域文档。

## 探索前先读这些

- **根目录 `CONTEXT.md`**：跨上下文共享的术语与契约（鉴权、API 结果码、后端集成、环境变量等）。
- **根目录 `GLOSSARY-MAP.md`**：指向各上下文的 `GLOSSARY.md`。按主题读取相关的那几份。
- **`docs/adr/`**：系统级决策。阅读与即将动工的领域相关的 ADR。
- **`<上下文>/docs/adr/`**：上下文范围内的决策（如存在）。

若上述文件不存在，**静默继续**。不要提示缺失，也不要预先建议创建它们。`/domain-modeling` 技能（经 `/grill-with-docs` 与 `/improve-codebase-architecture` 进入）会在术语或决策真正落定时按需创建。

## 上下文划分

本仓库是多上下文仓库（根目录存在 `GLOSSARY-MAP.md`）。

| 上下文   | 位置            | 职责范围                         |
| -------- | --------------- | -------------------------------- |
| blog     | `apps/blog`     | 公开博客（SSR 前端、公开照片流） |
| backend  | `apps/backend`  | HTTP API、持久化、对象存储、鉴权 |
| frontend | `apps/frontend` | 管理后台 CMS                     |
| ui       | `packages/ui`   | 共享组件库                       |
| doc      | `packages/doc`  | 组件库文档站点                   |

## 文件结构

```
/
├── CONTEXT.md                        ← 跨上下文共享的术语
├── GLOSSARY-MAP.md                   ← 指向各上下文的 GLOSSARY.md
├── docs/adr/                         ← 系统级决策
│   ├── 0001-frontend-auth-http-only-cookie.md
│   └── 0012-object-storage-aliyun-oss-private-signed-read.md
├── apps/
│   ├── backend/
│   │   ├── GLOSSARY.md               ← 上下文术语表
│   │   └── docs/adr/                 ← 上下文范围内的决策
│   ├── blog/
│   │   └── GLOSSARY.md
│   └── frontend/
│       └── GLOSSARY.md
└── packages/
    ├── ui/
    │   └── GLOSSARY.md
    └── doc/
        └── GLOSSARY.md
```

## 使用术语表中的措辞

当输出中提到某个领域概念时（Issue 标题、重构提案、假设、测试名等），使用 `GLOSSARY.md` 或 `CONTEXT.md` 中定义的术语。不要漂移到术语表明确排除的近义词。

若所需概念尚未出现在术语表中，这是一个信号：要么你在使用项目并不采用的说法（重新审视），要么确实存在空白（记下来交给 `/domain-modeling`）。

## 标出与 ADR 的冲突

若输出与已有 ADR 相抵触，明确点出来，而不是静默覆盖：

> _与 ADR-0007（事件溯源订单）冲突，但值得重新讨论，因为…_