---
status: accepted
---

# 部署契约由脱敏模板与代码推导的守卫承载

`.env.deploy` 与 `.env.deploy.dev` 被 `.gitignore` 的 `.env.*` 忽略，而 compose 用 `env_file` 为各服务注入环境（backend 服务声明的是 `[.env.deploy.dev, apps/backend/.env.development]`）。这意味着**整个部署契约没有任何版本控制**：新增运行时必需变量是静默的本地改动。ADR-0004 引入的 `BACKEND_API_URL` 正是这样——它从未出现在任何受版本控制的文件里，而缺失时 `env.ts` 会抛错且无 fallback，因此整个博客在 Docker 中全挂；同时单测注入 env 解析器、Playwright 显式设置该变量，**测试全绿**。而干净克隆根本没有该 env 文件，compose 会直接失败。

这两个文件不能直接提交：它们含 `SSH_PASSWORD`、`POSTGRES_PASSWORD`、`SESSION_SECRET`、`MINIO_ACCESS_KEY`、`MINIO_SECRET_KEY`。

## 决策

- 提交一份根目录的脱敏部署模板（`.env.deploy.example`），**只含占位符，绝不含真实值**。
- 增加一个守卫测试，从代码中**解析**出所有运行时读取的变量，断言它们都在模板中声明，且每个**必需**变量都有非空占位值。
- 真实 env 文件继续被忽略，部署时由运维从模板生成。
- 模板本身受版本控制，因此守卫在干净克隆上同样生效。
- 容器在**运行时**取得 `DATABASE_URL` 与 `JWT_SECRET`，不烘焙进镜像层。把 `.env.production` 拷进镜像或用 build arg 会把生产凭据写进镜像层与 registry 缓存，且不可移除——与本决策拒绝把它们写进 git 历史是同一种不可逆性，只是多绕一步。运行时供给也让同一个镜像可跨环境提升。镜像内唯一的 `DATABASE_URL` 是 `prisma generate` 加载 `prisma.config.ts` 所需的构建期占位值，它不建立连接，且位于最终会被丢弃的 build 阶段。

## 理由

不加 gitignore 例外、不提交真实文件，因为那会把生产凭据写入 git 历史且不可逆。仅写文档不足以阻止重复——本次事故发生时文档已经存在，变量仍然缺失。仅加"检查本地 env 文件"的守卫也不够，因为干净克隆上 env 文件不存在，守卫会退化为空转，而干净克隆正是最容易出事的场景。模板与代码推导的守卫必须同时存在：前者提供跨克隆的对照物，后者保证新增变量不会被遗忘。

## 后果

模板可能被误填入真实值。**不**因此只断言变量存在：原决策的顾虑是避免真实值写进快照或测试输出，但"断言该值是占位符"与"断言该值等于某个真实值"是两种不同的断言，前者不可能泄露后者。守卫改为无条件断言每个密钥形状的键取空串或占位符、每个内嵌密码的 URL 同样是占位符，并给这两条各加一个计数断言，使它们无法因删除而变成空转的绿。

原决策的规格本身是缺陷，需记录：它规定扫描 `process.env.*` 与 `import.meta.env.VITE_*`，而这两种模式**看不见任何一处后端读取**——后端经 `required(key)` / `optional(key, …)` 访问器以 `process.env[key]` 动态下标取值（11 处），`loadEnv()` 又藏了 2 处。实测后端共读 19 个变量，原守卫只知 5 个。守卫改为以 TypeScript AST 解析：把 `process.env[key]` 回溯到包含它的函数声明与其字面量调用点，按该函数体是否抛错区分"必需"与"有默认值"，并跟进 `loadEnv()` 绑定、解构、类型断言与 `prisma/config` 的 `env()`。**盲区靠构造关闭而非靠补名字**：新增 `required('X')` 时没有列表需要更新；解析不出的读取一律记为 `unresolved` 并附补救步骤，测试断言 `unresolved` 为空，因而大声失败而不是安静通过。每条规则都有一个合成夹具测试，删掉访问器支持会让 7 条测试转红。

**已知残留，代码无法关闭。** 模板现已可证明完整，但仍**不可直接部署**：`NODE_ENV=production` 下 `CORS_ALLOWED_ORIGINS` 为空意味着拒绝所有来源，干净克隆会启动成功然后不服务任何浏览器流量。存在性可从代码强制，那个值不能。运维必须填写。

**已交付但属实现缺陷、非本决策范围。** `docker-compose.yml` 的 backend 服务原声明 `env_file: [.env.deploy.dev, apps/backend/.env.development]`，而 `scripts/docker-push.ts` 上传的是 `.env.deploy` 与 `apps/backend/.env.production`；compose 对缺失的 `env_file` 硬失败，因此远端部署独立于本决策而损坏。backend 已对齐为 `[.env.deploy, apps/backend/.env.production]`：把 `.env.deploy.dev` 与 `.env.development` 上传到生产机等于把开发凭据放上生产机，与本决策拒绝写入 git 历史是同一种不可逆性。

**残留未修，同一类缺陷。** `cms_pg`、`minio`、`frontend`、`blog` 四个服务仍声明 `env_file: [.env.deploy.dev]`，而 push 不上传该文件。实测 compose 解析整个项目并在**第一个**缺失项即硬失败（顺序为 `cms_pg` 在最前），因此远端 `docker-compose up` 仍然起不来——只修 backend 并不能让远端可用。`cms_pg` 与 `minio` 未一并修改是刻意的：本机的这两个容器正是由本文件创建的（compose 标签 `project.config_files` 指向仓库根的 `docker-compose.yml`，不存在 `docker-compose.dev.yaml`），改动其 `env_file` 会变更 config-hash，使下次 `docker compose up` 以 `.env.deploy` 的 `POSTGRES_PASSWORD` 重建容器，与既有数据卷的密码不符。