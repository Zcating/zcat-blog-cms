# 生产切换手册：103.84.110.53 → 现行 compose 契约

本文是一次**尚未执行**的切换操作手册。文中没有任何一步被运行或验证过，所有示例输出均为示意（标注为「示意」）。

适用范围：把宿主机 `103.84.110.53` 上运行了 7 个月的 `cms` 栈，替换为本仓库当前的 `docker-compose.yml` + `.env` 契约。

---

## 1. 前置条件与硬停

以下三项**必须在动手前确认完毕**。前两项是丢数据的失败模式，第三项是本次已知的契约缺口。

### 1.1 硬停：`POSTGRES_PASSWORD` 必须原样沿用

- 生产库真实数据在 Docker 卷 `cms_cms_pg` 里（约 63 MB）。
- 卷一旦初始化，密码就是**建库当时**那个值，之后改 `POSTGRES_PASSWORD` 不生效；新旧密码不一致会导致后端连不上已有库。
- 因此：旧的 `POSTGRES_PASSWORD` **只能读取并复制，不能重新生成**。

操作方式（值不要离开这台机器）：

```bash
ssh root@103.84.110.53
grep '^POSTGRES_PASSWORD=' /opt/cms/.env.deploy
```

- 该值是 secret（16 字符）。**不要**把它粘进仓库、issue、聊天窗口、CI 日志或本文件的任何后续版本。
- 新栈的 `POSTGRES_PASSWORD` 与 `DATABASE_URL` 里的密码必须与它**逐字符相同**，这两处是同一份凭据的两个副本，代码无法强制一致。

### 1.2 硬停：compose 项目名必须保持 `cms`

- 卷的完整名是 `<项目名>_<卷名>`。项目名变了，compose 就去绑另一个卷（新建空卷），数据表现为「消失」，而数据其实还在旧卷里。
- 宿主机工作目录是 `/opt/cms`，compose 默认取目录名作为项目名，因此默认值恰好是 `cms`。
- 本手册所有命令**显式带 `-p cms`**，不依赖目录名推导。这样回滚时也不会因为在别的目录下执行而绑错卷。

```bash
docker volume ls | grep pg
docker volume inspect cms_cms_pg --format '{{.Name}} {{.Mountpoint}}'
```

### 1.3 硬停：`BLOG_SITE_URL` 在当前 compose 里没有注入点

代码事实：

- 博客的 `/robots.txt`、`/rss.xml`、`/sitemap.xml` 三个路由每次请求都读 `BLOG_SITE_URL`，缺失或仅空白时抛 `BlogSiteUrlMissingError`，**返回 HTTP 500**（`apps/blog/app/server/env.ts`）。
- 但仓库根 `docker-compose.yml` 的 `blog` 服务只注入了 `BACKEND_API_URL`（第 79–83 行），**没有 `BLOG_SITE_URL`**；根 `.env.example` 也没有这个键。

结论：**只在宿主机 `.env` 里写 `BLOG_SITE_URL` 不够**，它不会进容器，路由会持续 500。

必须二选一，且这一步涉及改动 compose 文件，超出本手册范围，需要单独决策与实现：

1. 在 `docker-compose.yml` 的 `blog` 服务 `environment:` 下增加 `BLOG_SITE_URL: ${BLOG_SITE_URL}`，并在根 `.env.example` 增加该键（本手册按此假设编排后续步骤）；或
2. 接受 `robots.txt` / `rss.xml` / `sitemap.xml` 持续 500（不推荐，且会让搜索引擎抓取失败）。

**若这一项在切换时尚未解决，就不要开始切换**，或在切换后明确接受第 9 节列出的后果。

### 1.4 其它前置

- 三个镜像必须**先**推到 `103.84.110.53:5000`（详见第 5 节）。镜像不存在时 `pull` 会失败，此时新栈起不来。
- 私有仓库带 **HTTPS + 自签名证书**。Docker 守护进程要信任其 CA，CA 证书路径**必须由运维提供**（未知，见第 10 节），标准位置是 `/etc/docker/certs.d/103.84.110.53:5000/ca.crt`，但本次未确认过实际是否已配置。
- 备份必须先做完（第 5.2 节）。没有备份就没有回滚。

---

## 2. 环境现状

宿主机 `103.84.110.53`：

| 项                | 值                                                                 |
| ----------------- | ------------------------------------------------------------------ |
| 系统              | Ubuntu 22.04                                                       |
| CPU / 内存 / 磁盘 | 1 vCPU / 1.9 GB RAM / 50 GB 磁盘，**仅剩 9.3 GB 空闲（已用 82%）** |
| Docker / Compose  | Docker 28.3.3，Compose **v2.39.1**                                 |
| 其它服务          | nginx（宝塔面板）承载四个站点，宝塔面板 11322，1Panel 8888         |
| 私有仓库          | `registry:2`，监听 `103.84.110.53:5000`，HTTPS + 自签名证书        |

现网 5 个容器，已运行 7 个月：

| 容器           | 端口                             | 说明                         |
| -------------- | -------------------------------- | ---------------------------- |
| `blog`         | 1024                             | 博客                         |
| `cms_backend`  | 9090                             | 后端                         |
| `cms_frontend` | 3000                             | CMS 管理后台                 |
| `cms_pg`       | 5432（`0.0.0.0` 绑定，ufw 已拦） | Postgres 16，卷 `cms_cms_pg` |
| `registry`     | 5000                             | 私有仓库                     |

现网镜像标签：`103.84.110.53:5000/cms_blog:latest`、`.../cms_backend:latest`、`.../cms_frontend:latest`。

### nginx 不动

以下 vhost **完全不动**，切换只是容器重启，新镜像在同一批端口上起来：

- `zcating.icu` / `www.zcating.icu` → `:1024`（博客）
- `api.zcating.icu` → `:9090`（后端）
- `cms.zcating.icu` → `:3000`（CMS）
- `coding.zcating.icu` → 静态

后果：切换窗口内这三个域名会短暂返回 502。**不要**把 nginx 改动混进这次切换。

---

## 3. 契约差异

现网 compose 用**旧**契约，本仓库用**新**契约，**没有一个字段是相同的**。这是本手册存在的原因：失败是静默的（容器起来但服务不工作，或数据看起来消失）。

| 方面            | 现网                                                                                                                                         | 本仓库现行                                                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| env 文件        | `env_file: .env.deploy`                                                                                                                      | 显式 `${VAR}` 白名单，值来自 `.env`                                                                                                                               |
| 变量名          | `NODE_ENV`、`FRONTEND_URL`、`BLOG_URL`、`OSS_PHOTO_BUCKET`、`OSS_PHOTO_DOMAIN`、`OSS_ARTICLE_BUCKET`、`OSS_ARTICLE_DOMAIN`、`JWT_EXPIRES_IN` | `ENV`、`BACKEND_API_URL`、`BLOG_SITE_URL`、`CORS_ALLOWED_ORIGINS`、`LOG_LEVEL`、`JWT_SECRET`、`OSS_ENDPOINT` / `OSS_BUCKET` / `OSS_ACCESS_KEY` / `OSS_SECRET_KEY` |
| Dockerfile 路径 | `apps/*/Dockerfile`                                                                                                                          | 根目录 `Dockerfile.{backend,frontend,blog}`                                                                                                                       |
| 镜像名前缀      | 固定 `103.84.110.53:5000/`                                                                                                                   | `${DOCKER_REGISTRY}`，**值必须以斜杠结尾**                                                                                                                        |
| Postgres 端口   | `0.0.0.0:5432`                                                                                                                               | `127.0.0.1:15400:5432`                                                                                                                                            |
| 对象存储        | compose 里没有（外部七牛）                                                                                                                   | compose 里没有（外部阿里云 OSS）                                                                                                                                  |
| 建桶引导        | 无                                                                                                                                           | `bootstrap-oss` 已整体删除                                                                                                                                        |

注意点：

- Postgres 端口从 `0.0.0.0:5432` 收回到 `127.0.0.1:15400`。这是收紧，容器间通信走 `app-network` 内的 `cms_pg:5432`，不受影响；宿主机上任何直连 `5432` 的运维脚本会失效。
- 镜像名不做拼接补分隔符（`${DOCKER_REGISTRY}cms_blog:latest`），`DOCKER_REGISTRY` 少一个斜杠会拼出 `103.84.110.53:5000cms_blog:latest` 这种非法名，**错误出现在 push 阶段而不是 compose 阶段**。

---

## 4. 变量映射表

### 4.1 从旧 `.env.deploy` 沿用

| 旧键                | 新键                | 值 / 来源                                                                                   | 备注                                                                                |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `POSTGRES_PASSWORD` | `POSTGRES_PASSWORD` | **从宿主机 `/opt/cms/.env.deploy` 读取**                                                    | 16 字符，绑定卷 `cms_cms_pg`。必须复制，禁止重新生成                                |
| —                   | `POSTGRES_DB`       | `zcat_blog_cms`                                                                             | 与 `DATABASE_URL` 的库名一致                                                        |
| —                   | `POSTGRES_USER`     | `blog_cms_user`                                                                             | 与 `DATABASE_URL` 的用户名一致                                                      |
| —                   | `DOCKER_REGISTRY`   | `103.84.110.53:5000/`                                                                       | **末尾斜杠必需**                                                                    |
| —                   | `DATABASE_URL`      | `postgresql://blog_cms_user:<上面读到的密码>@cms_pg:5432/zcat_blog_cms?connect_timeout=300` | 容器内主机名是 compose 服务名 `cms_pg`，端口 `5432`，**不是**宿主机映射端口 `15400` |
| —                   | `PORT`              | `9090`                                                                                      | 缺省回退 9090，写明避免歧义                                                         |

### 4.2 新增变量（宿主机从未有过）

| 新键                   | 值                                         | 说明                                                                                                 |
| ---------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `JWT_SECRET`           | **现场生成，不得从任何地方复制**           | `openssl rand -hex 32`。宿主机没有这个值，别去 `.env.deploy` 里找                                    |
| `OSS_ENDPOINT`         | `https://s3.oss-cn-guangzhou.aliyuncs.com` | **`https://` 前缀是强制的**。缺 scheme 时 AWS SDK 在 import 阶段抛 `Invalid URL`，后端**根本起不来** |
| `OSS_BUCKET`           | `zcating-cms-oss`                          | 桶为私有，无匿名可 GET 的地址                                                                        |
| `OSS_ACCESS_KEY`       | **必须由运维提供**                         | 阿里云凭据                                                                                           |
| `OSS_SECRET_KEY`       | **必须由运维提供**                         | 同上                                                                                                 |
| `CORS_ALLOWED_ORIGINS` | 运维填写                                   | `ENV=PRODUCTION` 且该值为空 = 拒绝**所有**来源，且注册接口关闭。模板刻意留空，代码无法推断           |
| `ENV`                  | `PRODUCTION`                               | 取代 `NODE_ENV`。**任何无法识别的取值会静默按开发模式运行**（例如 `staging`），不报错                |
| `LOG_LEVEL`            | 运维填写，留空回退 `info`                  |                                                                                                      |
| `BACKEND_API_URL`      | `http://backend:9090/api`                  | 容器内网地址；必须含 `/api` 前缀；**不能加 `VITE_` 前缀**                                            |
| `BLOG_SITE_URL`        | `https://zcating.icu`                      | 形如源的地址，不带路径与结尾斜杠。注入点见 1.3                                                       |

### 4.3 删除：旧 `.env.deploy` 中无等价物

这些键**不要**搬进新 `.env`，它们在新契约里已无读取方：

| 旧键                 | 原因                                       |
| -------------------- | ------------------------------------------ |
| `NODE_ENV`           | 由 `ENV` 取代                              |
| `FRONTEND_URL`       | 无等价                                     |
| `BLOG_URL`           | 由 `BLOG_SITE_URL` 取代                    |
| `OSS_PHOTO_BUCKET`   | 由单一 `OSS_BUCKET` 取代                   |
| `OSS_PHOTO_DOMAIN`   | 桶私有，读取走预签名 URL，不存在对外基地址 |
| `OSS_ARTICLE_BUCKET` | 同上                                       |
| `OSS_ARTICLE_DOMAIN` | 同上                                       |
| `JWT_EXPIRES_IN`     | 令牌有效期已在代码里硬编码                 |

---

## 5. 部署步骤

顺序固定。每步给出命令、成功标志、验证方式。

### 5.1 记录现网基线（只读，可跳过但建议做）

```bash
cd /opt/cms
docker compose -p cms ps
docker images --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedSince}}' | grep 103.84.110.53
docker volume inspect cms_cms_pg
```

成功标志：三条命令都无报错；`docker volume inspect cms_cms_pg` 存在。记下镜像 ID，回滚时要按 ID 钉住具体镜像。

### 5.2 备份（**不可逆步骤之前必做**）

```bash
cd /opt/cms
TS=$(date +%Y%m%d-%H%M%S)
cp -a docker-compose.yml "docker-compose.yml.bak-${TS}"
cp -a .env.deploy       ".env.deploy.bak-${TS}"
docker exec cms_pg pg_dumpall -U blog_cms_user > "/opt/cms/dump-${TS}.sql"
ls -l "docker-compose.yml.bak-${TS}" ".env.deploy.bak-${TS}" "dump-${TS}.sql"
```

成功标志：三个文件都存在，且 `dump-*.sql` **非空**。

验证：

```bash
head -n 5 "/opt/cms/dump-${TS}.sql"
grep -c 'COPY ' "/opt/cms/dump-${TS}.sql"
```

`COPY` 行数应大于 0。非 0 的 `pg_dumpall` 文件才是备份；空文件不算。

> `pg_dumpall` 本身不改数据，这一步可逆。

### 5.3 推送新镜像（在本地开发机执行，不是在宿主机）

本仓库的推送脚本 `scripts/docker-push.ts` 会用 **Compose v1 的 `docker-compose` 命令**（第 311 行 `baseCmd`）拼远端命令，与本手册要求的 v2 不一致；而且它带 `down` 步骤，会把「停服」和「上传文件」耦合在同一次执行里。**本次不要用这个脚本**，改为分步手动执行，好让每一步都能单独确认。

```bash
docker compose --env-file .env build
docker compose --env-file .env push
```

成功标志：push 输出 3 个 digest。

验证：

```bash
curl -s -k https://103.84.110.53:5000/v2/_catalog
```

（示意）`{"repositories":["cms_blog","cms_backend","cms_frontend"]}`。自签名证书需要 `-k`，或用第 10 节的 CA 路径替换 `-k`。

### 5.4 在宿主机拉取镜像（**切换窗口开始**）

```bash
cd /opt/cms
docker compose -p cms -f docker-compose.yml.old.yml pull 2>/dev/null || true
docker pull 103.84.110.53:5000/cms_backend:latest
docker pull 103.84.110.53:5000/cms_frontend:latest
docker pull 103.84.110.53:5000/cms_blog:latest
```

成功标志：三条 `docker pull` 全部 `Status: Downloaded newer image` 或 `Image is up to date`。

验证：

```bash
docker images 103.84.110.53:5000/cms_backend --format '{{.Repository}}:{{.Tag}} {{.ID}}'
```

若报 `x509: certificate signed by unknown authority`，说明 daemon 未信任仓库 CA。**在这一步解决，不要继续**——此时去改 compose 或改 nginx 都只是掩盖问题。

### 5.5 写新的 `.env`（宿主机）

```bash
cd /opt/cms
umask 077
# 从 /opt/cms/.env.deploy 读取旧密码，就地填入下面这份 .env
vi .env
chmod 600 .env
```

`.env` 内容（`<...>` 处现场填写，**不要**照抄示例占位符）：

```dotenv
ENV=PRODUCTION
PORT=9090
DATABASE_URL=postgresql://blog_cms_user:<从 .env.deploy 读到的密码>@cms_pg:5432/zcat_blog_cms?connect_timeout=300
JWT_SECRET=<openssl rand -hex 32 的输出>
CORS_ALLOWED_ORIGINS=<运维填写>
LOG_LEVEL=
OSS_ENDPOINT=https://s3.oss-cn-guangzhou.aliyuncs.com
OSS_BUCKET=zcating-cms-oss
OSS_ACCESS_KEY=<运维提供>
OSS_SECRET_KEY=<运维提供>
POSTGRES_DB=zcat_blog_cms
POSTGRES_USER=blog_cms_user
POSTGRES_PASSWORD=<与 DATABASE_URL 里完全相同的同一个值>
DOCKER_REGISTRY=103.84.110.53:5000/
BACKEND_API_URL=http://backend:9090/api
BLOG_SITE_URL=https://zcating.icu
```

只被推送脚本读取、与容器无关的 `SSH_*` / `REMOTE_DIR` / `DRY_RUN` / `SKIP_BUILD` **不需要**写进宿主机这份文件（compose 不引用它们）。但请注意根 `.env` 同时存放这些部署凭据与容器契约，这是 ADR-0007 明确接受的代价。

成功标志：文件存在、权限 `600`。

验证（不打印值，只查键是否存在且非空）：

```bash
cd /opt/cms
for k in ENV PORT DATABASE_URL JWT_SECRET OSS_ENDPOINT OSS_BUCKET OSS_ACCESS_KEY OSS_SECRET_KEY \
         POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD DOCKER_REGISTRY BACKEND_API_URL BLOG_SITE_URL; do
  v=$(grep -m1 "^${k}=" .env | cut -d= -f2-)
  if [ -z "$v" ]; then echo "EMPTY  $k"; else echo "OK     $k"; fi
done
grep -q '^DOCKER_REGISTRY=.*/$' .env && echo "OK     DOCKER_REGISTRY 末尾斜杠" || echo "BAD    DOCKER_REGISTRY 缺末尾斜杠"
grep -q '^OSS_ENDPOINT=https://' .env && echo "OK     OSS_ENDPOINT 带 https" || echo "BAD    OSS_ENDPOINT 缺 https"
grep -q '^ENV=PRODUCTION$' .env && echo "OK     ENV=PRODUCTION" || echo "BAD    ENV 不是 PRODUCTION"
```

另外确认两处密码一致（只输出布尔结果，不输出值）：

```bash
cd /opt/cms
a=$(grep -m1 '^POSTGRES_PASSWORD=' .env | cut -d= -f2-)
b=$(grep -m1 '^DATABASE_URL=' .env | sed -E 's#.*://[^:]+:([^@]+)@.*#\1#')
[ "$a" = "$b" ] && echo "OK     两处密码一致" || echo "BAD    两处密码不一致"
```

再确认它等于旧库密码：

```bash
cd /opt/cms
old=$(grep -m1 '^POSTGRES_PASSWORD=' .env.deploy.bak-* | cut -d= -f2-)
new=$(grep -m1 '^POSTGRES_PASSWORD=' .env | cut -d= -f2-)
[ "$old" = "$new" ] && echo "OK     与现网密码一致" || echo "BAD    与现网密码不一致，禁止继续"
```

**最后一条输出 `BAD` 就停下，不要往下走。**

### 5.6 替换 compose 文件（**不可逆**）

```bash
cd /opt/cms
cp docker-compose.yml.bak-* docker-compose.yml   # 仅在需要还原旧文件时执行
# 上传本仓库根目录的 docker-compose.yml 到 /opt/cms/docker-compose.yml
ls -l docker-compose.yml
```

新 compose 的服务名是 `cms_pg` / `backend` / `frontend` / `blog`；旧的是 `blog` / `cms_backend` / `cms_frontend` / `cms_pg` / `registry`。**`registry` 服务不在新 compose 里**。

> `registry` 容器怎么办，本次未决。若直接 `docker compose -p cms down`，只会删掉属于项目 `cms` 的容器——`registry` 若属于同名项目会被一并停掉。见第 10 节（未知项）。

验证 compose 解析结果（不启动）：

```bash
cd /opt/cms
docker compose -p cms config --services
docker compose -p cms config | grep -E 'image:|15400|9090|3000|1024'
```

成功标志（示意）：输出为

```
backend
blog
cms_pg
frontend
```

且 `cms_pg` 的端口段是 `127.0.0.1:15400 -> 5432/tcp`，三个应用镜像是 `103.84.110.53:5000/cms_*:latest`。

### 5.7 启动（**不可逆**，窗口内三个域名 502）

```bash
cd /opt/cms
docker compose -p cms up -d
docker compose -p cms ps
```

成功标志：4 个容器 `Up`，`cms_pg` 为 `healthy`。

验证后端能连上库并完成迁移：

```bash
docker compose -p cms logs --tail=50 backend
```

日志里应出现 `prisma migrate deploy` 的迁移记录，且**没有** `Missing required environment variable`。出现该报错说明 `.env` 有空值，回到 5.5。出现 `Invalid OSS_ENDPOINT` 或 `Invalid URL` 说明 `OSS_ENDPOINT` 少了 `https://`。

### 5.8 卷没变

```bash
docker volume inspect cms_cms_pg --format '{{.Name}} {{.Mountpoint}}'
docker volume ls | grep pg
```

成功标志：`cms_cms_pg` 仍是同一个卷，`Mountpoint` 与 5.1 记录的一致，且**没有**多出新卷。多出新卷 = 项目名写错了，按第 7 节回滚。

---

## 6. 验证

全部通过才允许进入第 8 节的数据删除。任一条不通过就停下排查或回滚。

### 6.1 后端健康

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9090/api/health
curl -s http://127.0.0.1:9090/api/health
```

断言：HTTP `200`；响应体恰为 `{"status":"ok"}`（`apps/backend/src/app.ts` 第 31 行）。

外网等价物：

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://api.zcating.icu/api/health
```

### 6.2 公开博客接口

```bash
curl -s 'http://127.0.0.1:9090/api/blog/photo/list?page=1&pageSize=1'
```

断言（逐条，全部为真）：

- `.code` == `"0000"`
- `.message` == `"success"`
- `.data.total` 为整数且 **`>= 82`**（清理前现存 82 行 `photo`）
- `.data.page` == `1`、`.data.pageSize` == `1`、`.data.totalPages` >= 82
- `.data.data[0].signedUrl` 是字符串，且以 `https://zcating-cms-oss.oss-cn-guangzhou.aliyuncs.com/` 开头
- `.data.data[0].signedUrl` 含 `X-Amz-Signature=` 与 `X-Amz-Expires=`
- `.data.data[0].signedThumbnailUrl` 同样满足以上两条

`signedUrl` / `signedThumbnailUrl` 是这一版新增字段（`blog.service.ts` 第 31–34 行，DTO 见 `blog.schema.ts` 第 21–22 行）。**这两个字段存在且是 OSS 预签名地址，是「后端拿到了正确凭据并成功签发」的判据**；旧契约里根本没有它们。

再验文章侧未被波及：

```bash
curl -s 'http://127.0.0.1:9090/api/blog/article/list?page=1&pageSize=1'
```

断言：`.code` == `"0000"`，`.data.total` > 0。文章的 11 张技术图以绝对 URL 写在 markdown 里，走的是七牛文章桶（`oss-articles.zcating.icu`），不经过 OSS 签名，因此本接口的字段形态不应变化。

### 6.3 取一个预签名读 URL 并做字节长度校验

```bash
SIGNED=$(curl -s 'http://127.0.0.1:9090/api/blog/photo/list?page=1&pageSize=1' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["data"][0]["signedUrl"])')
curl -sS -o /dev/null -w 'code=%{http_code} bytes=%{size_download}\n' "$SIGNED"
```

断言：`code=200` 且 `bytes` **大于 0**。`bytes=0` 说明拿到的是空响应或被中途拦截，不是成功。

### 6.4 遗留照片行返回 404 是预期，不是签名缺陷

清理尚未执行时，`cms_cms_pg` 里的 `photo` 行仍指向七牛时代的对象键。这些键**从不存在于阿里云 OSS**，所以后端签出来的 URL 语法完全合法、签名完全正确，只是对象不存在：

```bash
curl -sS -o /tmp/oss-body -w 'code=%{http_code}\n' "$SIGNED"
cat /tmp/oss-body
```

（示意）`code=404`，响应体含 `<Code>NoSuchKey</Code>`。

**这是预期，直到第 8 节的删除被执行。** 区分方法很明确，不要混为一谈：

| 现象                            | 含义                                                                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `404` + `NoSuchKey`             | 签名正确，对象不存在。**清理前的预期结果**                                                                                             |
| `403` + `SignatureDoesNotMatch` | **签名真的坏了**：`OSS_ACCESS_KEY` / `OSS_SECRET_KEY` 配错，或 `OSS_ENDPOINT` 的 region 与实际桶不符。这是故障，回第 5.5 节            |
| `403` 全量、无 XML 体           | 防盗链「允许空 Referer」没勾选。命令行的 `curl` 无 Referer，因此这一条会让所有预签名读取失败——这是硬依赖，控制台漏勾代码里没有任何提示 |

> 排查这一条时，若要给 `curl` 加 Referer，用 `-H 'Referer: https://zcating.icu/'`。加与不加的差别本身就是「防盗链没勾允许空 Referer」的判据。

### 6.5 三个 vhost 通

```bash
for h in https://zcating.icu/ https://cms.zcating.icu/ https://api.zcating.icu/api/health; do
  printf '%s -> ' "$h"; curl -s -o /dev/null -w '%{http_code}\n' "$h"
done
```

断言：三者均 `200`（或 `301`/`308` 重定向到规范域名）。

### 6.6 博客 feeds（受 1.3 约束）

```bash
for p in robots.txt rss.xml sitemap.xml; do
  printf '%s -> ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "https://zcating.icu/$p"
done
```

断言：三者均 `200`，且响应体中出现 `https://zcating.icu`，**不出现** `blog.zcat.example`。

任一返回 `500` → `BLOG_SITE_URL` 没进容器，回到 1.3。**不要**靠改代码加 fallback 绕过。

### 6.7 记录验收结论

把 6.1–6.6 的实际输出记进工单，并明确写下「进入第 8 节 / 不进入」。第 8 节的删除没有回滚。

---

## 7. 回滚

前提：5.2 的两个备份与 dump 都在。

### 7.1 触发条件

出现下列任一情况，立即回滚，不要边跑边查：

- 6.1 健康检查不通过，或后端日志出现 `Missing required environment variable`
- 6.2 中 `.code` != `"0000"`，或 `signedUrl` 缺 `X-Amz-Signature=`
- 5.8 发现多出新卷（项目名写错）
- `docker compose -p cms ps` 里 `cms_pg` 反复重启 / 非 healthy

### 7.2 回滚步骤

```bash
cd /opt/cms
docker compose -p cms down          # 注意：绝对不要加 -v
cp -a "docker-compose.yml.bak-<TS>" docker-compose.yml
cp -a ".env.deploy.bak-<TS>"       .env.deploy
docker compose -p cms up -d
docker compose -p cms ps
```

**`docker compose -p cms down -v` 会删掉 `cms_cms_pg`，数据不可恢复。** 回滚命令里不要出现 `-v`。

**`-p cms` 在回滚时同样必须存在。** 写成 `docker compose down` 或换个目录执行，会绑到另一个项目名、连不到 `cms_cms_pg`，然后你会同时失去服务和数据——这正是本文档最需要防的失败模式。

### 7.3 镜像钉回旧版本

新镜像标签是 `latest`，已被覆盖，因此不能只靠 `pull`/`up` 回到旧镜像。用 5.1 记下的镜像 ID：

```bash
docker tag <旧 cms_backend 镜像 ID> 103.84.110.53:5000/cms_backend:latest
docker tag <旧 cms_frontend 镜像 ID> 103.84.110.53:5000/cms_frontend:latest
docker tag <旧 cms_blog 镜像 ID> 103.84.110.53:5000/cms_blog:latest
docker compose -p cms up -d --force-recreate backend frontend blog
```

`--force-recreate` 不可省：镜像 ID 变了，但标签没变，不强制重建会继续用已存在的容器。

> `latest` 标签本身就是这次事故的成因之一。若 5.1 没有记下镜像 ID，回滚就退化为「回到任意某个 latest」。这是本次已知的操作缺口。

### 7.4 回滚后

```bash
curl -s http://127.0.0.1:9090/api/health
docker volume inspect cms_cms_pg >/dev/null && echo "卷仍在"
```

数据层没有变动（整个流程只读 `cms_cms_pg`），因此不需要 `pg_restore`。只有在第 8 节已经执行过的情况下才需要，那属于另一回事。

---

## 8. 部署后数据清理清单

**闸门：仅在第 6 节全部通过、且结论已记录之后执行。**

顺序是硬约束：**先部署并验证新栈，再删旧数据。** 先删的话，切换窗口里生产相册直接坏掉，而且失去完整回滚窗口。

以下均为**不可逆**。

### 8.1 Qiniu 侧（照片）

| 项       | 内容                                         |
| -------- | -------------------------------------------- |
| 桶       | `zcating-cms-oss-overseas`                   |
| 绑定域名 | `oss.zcating.icu`（**只有 HTTP，无 HTTPS**） |
| 对象数   | 165（82 原图 + 82 缩略图 + 1 头像）          |

```bash
# 对象清空在七牛控制台操作，无可用 CLI 凭据。执行前人工二次确认桶名。
```

成功标志：控制台对象数归零。

### 8.2 数据库侧

**必须先处理引用关系，再删行**，否则相册封面指向已不存在的照片行。

```bash
cd /opt/cms
docker exec -it cms_pg psql -U blog_cms_user -d zcat_blog_cms -c 'SELECT count(*) FROM photo;'
docker exec -it cms_pg psql -U blog_cms_user -d zcat_blog_cms -c 'SELECT count(*) FROM photo_album WHERE "coverId" IS NOT NULL;'
docker exec -it cms_pg psql -U blog_cms_user -d zcat_blog_cms -c 'SELECT id FROM user_info WHERE id = 1 AND avatar IS NOT NULL;'
```

（示意）三行分别返回 `82`、`12`、`1`。

按顺序执行：

```sql
-- 1) 相册封面置空：保留 name / description / available，仅清 coverId
UPDATE photo_album SET "coverId" = NULL WHERE "coverId" IS NOT NULL;

-- 2) 清用户头像
UPDATE user_info SET avatar = NULL WHERE id = 1;

-- 3) 最后删照片行
DELETE FROM photo;
```

逐步验证：

```sql
SELECT count(*) FROM photo;                              -- 期望 0
SELECT count(*) FROM photo_album WHERE "coverId" IS NOT NULL;  -- 期望 0
SELECT count(*) FROM photo_album;                        -- 期望 12，相册本身保留
SELECT avatar FROM user_info WHERE id = 1;               -- 期望空
SELECT count(*) FROM article;                            -- 期望不变
```

逐条断言：第 1 条为 `0`；第 2 条为 `0`；第 3 条为 `12`；第 4 条为空；第 5 条与删除前一致。

清理后回到 6.4 复验：此时 6.2 的 `.data.total` 应为 `0`，`data.data` 为空数组，`code` 仍为 `"0000"`。空列表不是错误。

### 8.3 不要碰的

- **文章存储完全不动，无例外。** 七牛桶 `zcating-cms-aticles-overseas`，域名 `oss-articles.zcating.icu`，11 张技术图以绝对 URL 写在文章 markdown 内。维护者已明确本次不处理。
- 两个域名、两个桶彼此独立，删照片侧不影响文章侧。
- 之所以在这里写死一句：部署窗口里「顺手把另一套也清掉」正是最容易被做出来、也最难挽回的动作。

---

## 9. 已知缺陷与暂缓项

以下都是**已知的、被接受的现状**，不是本次切换引入的回归，不要在部署窗口里「顺手修」。

1. **`og:url` / `rel: canonical` / JSON-LD 仍指向占位域名。** 博客里 3 处 `const SITE = 'https://blog.zcat.example'` 是硬编码的（`_blog/index.tsx` 第 20 行、`post-board.tsx` 第 9 行、`post-board_.$id.tsx` 第 12 行）。维护者被当面说明过取舍并选择保留。因此部署后：`robots.txt` / `rss.xml` / `sitemap.xml` 内容正确（走 `BLOG_SITE_URL`），而 `og:url` 仍指向 `blog.zcat.example`。**这是预期，不要在切换中改。**
2. **`BLOG_SITE_URL` 无 compose 注入点。** 见 1.3。这是本次切换最可能撞上的实际问题。
3. **`api.zcating.icu.conf` 的手工 CORS 头保留。** 新架构下浏览器不再跨域直连 API，这段配置不再起作用，但**已决保持原样**。若日后有人重新打开跨域直连，后端也会发自己的 `Access-Control-Allow-Origin`，会出现重复响应头而被浏览器拒绝。
4. **`zcating.icu.conf` 的 `proxy_set_header Host 103.84.110.53` 写死裸 IP。** 另外两份 vhost 用 `$http_host`。**已决保持原样。** 博客容器收到的 `Host` 是裸 IP，依赖 Host 生成绝对地址的逻辑要自己绕开。
5. **不要启用 nginx 缓存。** 三份 vhost 各自声明了 `proxy_cache_path`，但没有任何 `location` 使用 `proxy_cache`，缓存当前是关闭的。预签名读 URL 会过期，一旦启用缓存，被缓存的 HTML 会向浏览器派发已过期的图片地址，**失败是静默的**。
6. **`ENV` 写成无法识别的值会静默按开发模式运行**（例如 `staging`）：CORS 白名单变成两个 localhost，注册闸门默认开启。已接受的代价。
7. **`POSTGRES_PASSWORD` 与 `DATABASE_URL` 里的密码是同一份凭据的两个副本**，代码无法强制一致。已接受的代价。
8. **阿里云 OSS 不校验签名中的 region。** 任意 region 值都能签通。因此「签名能签发」不等于「region 配对了」，6.4 里 region 相关的判断只能靠真实取回对象来确认。

---

## 10. 容量约束

| 约束     | 值                             | 直接后果 |
| -------- | ------------------------------ | -------- |
| 磁盘空闲 | **9.3 GB / 50 GB（已用 82%）** | 见下     |
| CPU      | 1 vCPU                         | 见下     |
| 内存     | 1.9 GB                         | 见下     |

### 磁盘

宿主机同时跑 nginx（四个站点）、宝塔面板、1Panel、私有仓库与本栈，且只剩 9.3 GB。

- **不要在宿主机 `docker compose build`。** 现网 compose 用的是拉预构建镜像，根 Dockerfile 的构建阶段要装全量依赖与两个前端产物，在这台机器上既慢又可能撑爆磁盘。构建在本地开发机做（第 5.3 节），宿主机只 `pull`。
- **不要 `docker image prune -a`。** 旧镜像正是回滚路径（7.3）。要清空间，先 `docker system df` 看清楚再动，且只清 dangling 层。
- `pg_dumpall` 的产物（63 MB 量级的库，dump 会更大一些）在 9.3 GB 里放得下，但**不要**顺手做多次全库 dump。
- 拉 3 个镜像前先 `docker system df` 评估。这 3 个镜像是 Node 24 alpine + 生产依赖的量级。

### 内存

1.9 GB 要同时装下 nginx、两个面板、registry、Postgres、backend、frontend、blog。

- 启动期不要并行跑任何构建或测试。
- 如果 `cms_pg` 因内存压力反复 OOM，表现为 `docker compose -p cms ps` 里一直 restarting；此时**先查内存再谈别的**，不要改 compose 参数。
- `docker compose -p cms up -d` 一次性拉起 4 个容器，瞬时内存峰值高于逐个拉起。若观察到 OOM，可按 `cms_pg` → `backend` → `frontend` → `blog` 的顺序分次 `up -d`。

### CPU

1 vCPU 下，前端（TanStack Start）与博客（TanStack Start）首屏 SSR 会明显慢于本地。这是预期，不是故障；**不要**因为「慢」就在部署窗口里改 SSR 相关配置。

---

## 11. 未知项（必须由运维提供，本次无法从仓库推定）

以下内容在本手册中**没有给出值**，也不应被猜测：

| 未知项                                                             | 为什么不能推定                                                             | 影响                                                  |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| 新 `JWT_SECRET`                                                    | 必须现场随机生成，禁止从任何地方复制                                       | 后端启动即崩                                          |
| 阿里云 `OSS_ACCESS_KEY` / `OSS_SECRET_KEY`                         | 凭据，只能由账号持有人提供                                                 | 后端启动即崩                                          |
| `CORS_ALLOWED_ORIGINS` 的具体值                                    | 代码内置默认在生产下是「拒绝所有来源」，无法推断该放行哪些源               | 浏览器流量全被拒                                      |
| registry 自签名 CA 证书的实际路径与是否已配置                      | 未确认 daemon 是否已信任                                                   | `docker pull` x509 失败                               |
| `registry` 容器在切换中的归属                                      | 它不在新 compose 里；若属项目 `cms`，`docker compose -p cms down` 会停掉它 | 可能导致 5.4 无法拉取                                 |
| 旧镜像的 ID                                                        | 只有 5.1 在宿主机上实际执行后才有                                          | 不记录则回滚无法钉回旧镜像（见 7.3）                  |
| `LOG_LEVEL`                                                        | 运维选择，代码可回退 `info`                                                | 无阻塞                                                |
| 本机 103.84.110.53 的 `docker-compose`（v1）是否为别名、是否可执行 | 未确认                                                                     | 本手册一律用 v2 的 `docker compose`，不使用 v1 二进制 |

---

## 附：本文档的事实来源

- 契约与代码事实：`docker-compose.yml`、`.env.example`、`Dockerfile.{backend,frontend,blog}`、`apps/backend/src/common/config.service.ts`、`apps/backend/src/common/oss.service.ts`、`apps/backend/prisma/schema.prisma`、`apps/backend/src/features/public/blog/blog.{route,service,schema}.ts`、`apps/backend/src/app.ts`、`apps/blog/app/server/env.ts`
- 决策背景：`docs/adr/0007-deployment-contract-template-and-guard.md`、`docs/adr/0012-object-storage-aliyun-oss-private-signed-read.md`、`docs/adr/0004-backend-url-one-concept-two-representations.md`、`docs/adr/0011-homepage-mixed-waterfall-and-public-photo-feed.md`
- 宿主机现状、现网容器与卷、Qiniu 侧数据量、nginx 决策：由运维提供，**未经本次独立核实**