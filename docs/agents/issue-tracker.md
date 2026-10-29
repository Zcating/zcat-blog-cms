# Issue 追踪器：GitHub

本仓库的 Issue 与规格文档存放于 GitHub Issues（仓库 `Zcating/zcat-blog-cms`）。所有操作使用 `gh` CLI。

> `gh` CLI 已通过 winget 安装（用户级，无需管理员权限），并已以账号 `Zcating` 完成认证：凭据存于系统 keyring，令牌权限为 `repo`、`read:org`、`gist`，Git 操作使用 SSH 协议。凭据失效时执行 `gh auth login` 重新认证。

## 约定

- **创建 Issue**：`gh issue create --title "..." --body "..."`。多行正文使用 heredoc。
- **读取 Issue**：`gh issue view <number> --json number,title,body,labels,comments`。
- **列出 Issue**：`gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`，按需附加 `--label` 与 `--state` 过滤。
- **把 Issue 挂为父 Issue 的子 Issue**：`gh issue create --parent <parent> ...`，或事后执行 `gh issue edit <parent> --add-sub-issue <child>`（需 `gh` 2.94+）。更早版本：`gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>`（数据库 id，见下文 **阻塞关系**）。若仓库未启用子 Issue，则在子 Issue 正文首行写 `Part of #<parent>`。
- **评论**：`gh issue comment <number> --body "..."`
- **增删标签**：`gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **关闭**：`gh issue close <number> --comment "..."`

仓库信息可由 `git remote -v` 推断；在克隆目录内执行时 `gh` 会自动完成推断。

## Pull Request 是否作为需求入口

**PRs as a request surface: no.** _（若本仓库把外部 PR 当作功能需求入口，改为 `yes`；`/triage` 会读取该开关。）_

设为 `yes` 时，PR 与 Issue 共用同一套标签与状态流转，只是换成对应的 `gh pr` 命令：

- **读取 PR**：`gh pr view <number> --comments`，差异用 `gh pr diff <number>`。
- **列出待分流的外部 PR**：`gh api --paginate 'repos/{owner}/{repo}/pulls?state=open' --jq '.[] | select(.author_association | IN("OWNER","MEMBER","COLLABORATOR") | not) | {number, title, author: .user.login, author_association, labels: [.labels[].name]}'`。
- **评论 / 打标签 / 关闭**：`gh pr comment`、`gh pr edit --add-label`/`--remove-label`、`gh pr close`。

GitHub 的 Issue 与 PR 共用一个编号空间，因此裸写 `#42` 可能是二者之一：先用 `gh pr view 42`，失败则回退到 `gh issue view 42`。

## 当技能要求「发布到 Issue 追踪器」

创建一个 GitHub Issue。

## 当技能要求「获取对应的 ticket」

按上文 **读取 Issue** 的方式读取。

## 路径探索（Wayfinding）操作

供 `/wayfinder` 使用。**地图（map）**是一个 Issue，其下挂 **子 ticket**。

- **地图**：一个带 `wayfinder:map` 标签的 Issue，正文包含「笔记 / 已定决策 / 未知盲区」三段。`gh issue create --label wayfinder:map`。
- **子 ticket**：以 GitHub 子 Issue 形式挂在地图下的 Issue（见 **把 Issue 挂为父 Issue 的子 Issue**）。若未启用子 Issue，则把子 ticket 加入地图正文的任务列表，并在子 ticket 正文首行写 `Part of #<map>`。标签：`wayfinder:<类型>`（`research`/`prototype`/`grilling`/`task`）。认领后指派给主导开发者。
- **阻塞关系**：以 GitHub 原生 Issue 依赖为准，这是可见且唯一的权威表示。添加一条边：`gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`，其中 `<blocker-db-id>` 是阻塞项的数字 **数据库 id**（`gh api repos/<owner>/<repo>/issues/<n> --jq .id`，_不是_ `#number` 或 `node_id`）。GitHub 通过 `issue_dependencies_summary.blocked_by` 报告尚未关闭的阻塞项（即实时门禁）。若依赖功能不可用，改为在子 ticket 正文首行写 `Blocked by: #<n>, #<n>`。当所有阻塞项关闭，ticket 即解除阻塞。
- **前沿查询**：列出地图下的开放子 ticket（`gh issue list --state open`，范围限定为地图的子 Issue / 任务列表），剔除存在未关闭阻塞项（`issue_dependencies_summary.blocked_by > 0`，或 `Blocked by` 行中仍有开放 Issue）或已有认领人的项；按地图中的顺序取第一个。
- **认领**：`gh issue edit <n> --add-assignee @me`，这是会话中的首次写操作。
- **解决**：`gh issue comment <n> --body "<answer>"`，然后 `gh issue close <n>`，最后把上下文指针（gist + 链接）追加到地图的「已定决策」。