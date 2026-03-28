# AGENTS.md

本文档定义了 AI AGENT 在本项目中必须遵循的工作规范。
所有任务请求都会隐式应用这些规则。

## 强制规则【必须遵循】

1. 文件命名规则：烤肉串命名法（kebab-case）
2. 请调用 using-superpower 对任务进行规划，然后再实施。
3. 生成代码必须调用 code-review-expert 进行代码评审，并根据意见进行修改。
4. 有不确定的内容和资料时，禁止调用训练集的内容，必须通过 CONTEXT7-MCP 查阅资料。
5. 思考任务的并行性，调用 subagent 管理上下文，/parallel 是个好工具。

## 项目指南

以下是项目简称对应的目录

- 博客: apps/blog
- 服务端: apps/backend
- 管理后台: apps/frontend
- 组件库: packages/ui
- 组件库文档: packages/doc

执行对应项目的需求，请加载具体项目的 AGENTS.md

- 博客: apps/blog/AGENTS.md
- 服务端: apps/backend/AGENTS.md
- 管理后台: apps/frontend/AGENTS.md
- 组件库: packages/ui/AGENTS.md
- 组件库文档: packages/doc/AGENTS.md


## 测试指南

- 调用 playwright-best-practices 编写 e2e 测试用例，确保测试用例能够正常运行。
- 请保证所有的 e2e 测试通过都能完全通过，mock/real。

## 智能体指南

为保持上下文干净，请拉起具体的 subagent 发起子任务，可以结合 dispatching-parallel-agent

- product-expert: 设涉及调研任务使用用
- backend-expert: 后端子任务可以调用
- frontend-expert: 前端子任务可以调用
- testing-expert: 测试子任务可以调用
- code-review-expert: 代码评审

## 工具箱

/brain -> 调用 brainstroming
/superpower -> 调用 using-superpowers
/debug -> 调用 systematic-debugging
/parallel -> 调用 dispatching-parallel-agent
/verify -> 调用 verification-before-completion
/review -> 调用 requesting-code-review 和 test-driven-development
/pua -> 调用 pua skill
/test -> 调用 webapp-testing
