---
status: accepted
---

# 部署契约由脱敏模板与代码推导的守卫承载

`.env.deploy` 与 `.env.deploy.dev` 被 `.gitignore` 的 `.env.*` 忽略，而 compose 用 `env_file` 为各服务注入环境（backend 服务声明的是 `[.env.deploy.dev, apps/backend/.env.development]`）。这意味着**整个部署契约没有任何版本控制**：新增运行时必需变量是静默的本地改动。ADR-0004 引入的 `BACKEND_API_URL` 正是这样——它从未出现在任何受版本控制的文件里，而缺失时 `env.ts` 会抛错且无 fallback，因此整个博客在 Docker 中全挂；同时单测注入 env 解析器、Playwright 显式设置该变量，**测试全绿**。而干净克隆根本没有该 env 文件，compose 会直接失败。

这两个文件不能直接提交：它们含 `SSH_PASSWORD`、`POSTGRES_PASSWORD`、`SESSION_SECRET`、`OSS_ACCESS_KEY`、`OSS_SECRET_KEY`。

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

## 修订

守卫已被删除。上文关于事故成因的记录保持原样——那是历史，而本 ADR 立起来的原因正是那件事真的发生过。以下记录取代它的设计。

### 验收标准被下调，守卫因此失去性价比

本 ADR 的核心论点是"模板与代码推导的守卫必须同时存在"。这个论点成立于一个前提：漏声明变量的代价是生产事故。新的验收标准被定为**容器或进程启动时缺变量就崩**，代价降级为一次部署失败而非静默损坏。守卫买到的是"在提交时就发现漏声明"，它买的是比新标准更高的一层。

守卫的实际成本也随之暴露。子应用覆盖层出现后，根文件与 `apps/backend/.env.example` 有七个键**有意**两处都声明且取值本就应当不同（`DATABASE_URL`、`PORT`、`ENV`、`CORS_ALLOWED_ORIGINS`、`LOG_LEVEL`、`JWT_SECRET`），而原守卫断言"每个读取恰好在一份模板里声明"——两条规则直接矛盾。重写后的守卫需要在运行时归属、模板作用域、生成标记方向等多处派生规则之间建立自洽，测试从 35 条涨到 64 条，外加一个自建的契约模型。此后**新增一个变量需要理解那套模型**，而模型本身没有任何外部标准可以对照。

### 取代它的是什么

- **必需变量的存在性**：`config.service.ts` 的 `required()` 在进程启动时抛错，这是本仓库早就存在的机制，不需新增任何东西。本次把 `OSS_BUCKET` 从 `optional(..., '')` 提升为 `required()`——它此前为空时容器照常启动、跳过建桶，直到第一次上传图片才报一个与根因无关的 S3 错误，那是这条线上最后一个主动选择不崩的地方。
- **模板是否完整**：不再有任何检查。
- **提交文件里是否只有占位符**：不再有任何检查。守卫的这条规则原本覆盖五份模板，最后一次运行命中了 `apps/backend/.env.example` 里一个已提交的明文密码，那是删除前唯一的红灯。

### 文件与接线

- 根部署模板更名为 `.env.example`，并吸收了原 `.env.deploy.push.example` 的全部内容——**一份模板、一个真实文件**，容器契约与部署凭据同处一室。
- 真实文件由 `scripts/init-env.ts` 从模板生成，挂在 `prepare` 生命周期脚本上，使干净克隆的 `pnpm install` 就产出可用的文件。生成器只填 `JWT_SECRET`（根文件与 `apps/backend/.env` 各一份不同值），对已存在的文件一律跳过，**永远以 0 退出**，并打印仍为空的键名清单。`POSTGRES_PASSWORD` 不生成：postgres 只在初始化空数据目录时读它，已有数据卷会沿用建库当时的密码。
- 每个子项目保留一份 `.env`，**仅本地开发使用**，只写与根文件确实不同的值。`.env.development` 与 `.env.production` 全部合并，Vite 的 `dev:prod` 与 `build:dev` 随之删除；`build` 的 `--mode production` 保留，因为 `import.meta.env.MODE` 是被库代码读取的运行时值。
- 环境数量定为两个：开发与生产。准生产被明确放弃，代价是将来若要引入，需重新决定跨域白名单与数据卷隔离。

### compose 改为显式白名单

五个服务不再声明任何 `env_file`，改为在 `environment:` 下逐项列出 `${VAR}`，由 compose 从项目目录的 `.env` 取值做插值。这不是风格选择：`env_file` 没有白名单，它把文件里每一个键注入每一个声明它的服务，而根文件现在同时持有 `SSH_HOST`、`SSH_USER`、`SSH_PASSWORD` 与 `REMOTE_DIR`。实测确认 `env_file` 会把 SSH 密码送进 `frontend` 与 `blog` 两个容器，而这两个服务与 SSH host 同机，边际风险不高，但那条提权路径本来不存在。

`oss` 服务的 `entrypoint` 保留，它把中性的 `OSS_ACCESS_KEY` / `OSS_SECRET_KEY` 映射为服务端认识的 `RUSTFS_*`——这是 ADR-0010 的决定，与本 ADR 无关。

### 变量面的其他变更

- `NODE_ENV` 由专用键 `ENV` 取代，取值 `DEVELOPMENT` / `PRODUCTION`，缺失默认 `DEVELOPMENT`，比较前 `trim().toUpperCase()`。原因是一次实测：`optional()` 是 `process.env[key] ?? fallback`，**空字符串原样返回**，因此模板里留空 `NODE_ENV=` 会让生产环境走进开发分支——CORS 白名单变成两个 localhost，注册闸门默认开启。同一处语义不一致也存在于 `parseCorsOrigins`（把空串当未设置）与 `parseAllowRegister`（只判 `undefined`）之间。
- `ALLOW_REGISTER` 删除，`config.allowRegister` 改为硬编码 `!isProduction`。闸门本身保留在 `auth.service.ts`，`REGISTER_LIMIT` 分支不变。
- 删除的零引用键：`SESSION_SECRET`、`JWT_EXPIRES_IN`（`auth.service.ts` 硬编码 `{ expiresIn: '1d' }`）、`MINIO_*` 九项、`OSS_PHOTO_BUCKET` / `OSS_PHOTO_DOMAIN` / `OSS_ARTICLE_BUCKET` / `OSS_ARTICLE_DOMAIN` 四项。后者尤其值得记一笔：真实文件里并存着三套互不相同的对象存储键集，而守卫从未读过这些文件。

### 被接受的代价

- **没有任何机制检查各文件之间是否一致。** 漏填表现为容器起不来，而不是在提交时被拦下。这只在文件数量降到四个之后才可接受——守卫的很大一部分工作量正是在替多份文件买保险，保险一撤，文件数量本身就得降下来。
- **提交真实凭据进 git 不再被任何测试拦截。** 这条与本 ADR 立论的不可逆性论证直接冲突，接受它是一次明确的取舍。
- **`POSTGRES_PASSWORD` 与 `DATABASE_URL` 里的密码是同一份凭据的两个副本**，代码无法强制一致。Docker 文档确认这不是 env 问题而是状态同步问题：卷一旦初始化，密码就是建库当时那个值。
- **`ENV` 写成任何无法识别的取值会静默按开发模式运行**，例如 `ENV=staging`。这是为了"不崩"而付出的代价，与上面第三条同类。