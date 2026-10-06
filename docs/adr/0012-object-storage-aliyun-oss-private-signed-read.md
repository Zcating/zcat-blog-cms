---
status: accepted
---

# 对象存储迁往阿里云 OSS，读取地址改为预签名

线上对象存储一直是七牛云的两个私有桶（`zcating-cms-oss-overseas` / `zcating-cms-aticles-overseas`，分别绑 `oss.zcating.icu` 与 `oss-articles.zcating.icu`），而 ADR-0010 选定的 RustFS 本地方案从未上线。两者契约互不兼容：七牛的 AK/SK 是 40 字符自有格式，与 ADR-0007 起的显式变量白名单对不上；照片域名只有 HTTP，HTTPS 不可用；RustFS 那套 `env_file: .env.deploy` 编排也与仓库现行 compose 无关。同一件事在仓库里有三种写法，是时候只留一种。

## 决策

- 对象存储改为**阿里云 OSS**，桶 `zcating-cms-oss`，区域 `oss-cn-guangzhou`。区域创建后不可改；账号未完成 ICP 备案，因此**不能**绑定自定义域名，读取地址只能是默认的 `*.oss-cn-guangzhou.aliyuncs.com`。
- 桶为**私有**。读取一律使用后端签发的**预签名 GET URL**，不存在可匿名 GET 的稳定读地址。
- 保留防盗链：Referer 白名单为 `zcating.icu` / `www.zcating.icu` / `cms.zcating.icu` / `api.zcating.icu`，并**必须勾选「允许空 Referer」**。
- 桶上配置 CORS：源为 `https://zcating.icu` / `https://www.zcating.icu` / `https://cms.zcating.icu`，方法 `PUT, GET, HEAD`。
- 单桶 + 前缀（`photos/`、`user/`）。沿用库里既有的对象键，数据形状不变。
- **历史对象不迁移。** 165 个七牛对象（82 原图 + 82 缩略图 + 1 头像）与对应的 82 行 `photo` 一并丢弃；12 个相册的 `name` / `description` 是纯数据库数据，保留并把 `coverId` 置空。
- ADR-0010 的「RustFS 公共读 + `image-proxy` 无签名转发」随之作废。

## 理由

选私有桶而非公共读，是为了让防盗链有意义：公共读意味着任何拿到地址的人都能直接取走图片，Referer 白名单形同虚设。代价是每次读取都要签一次名，且读地址随时会过期——因此这个决定直接推翻了 `CONTEXT.md` 中「对象 URL = 无签名、可匿名 GET」的定义（已同步更新）。

选阿里云而非继续用七牛，是因为继续下去要把两套互不兼容的凭据格式、两套域名、两套 ACL 语义一起带进新部署。选单桶而非沿用双桶，是因为仓库现行契约只有单个 `OSS_BUCKET`，且 82 个对象键本就带 `photos/` 前缀。

不迁移历史对象，是因为本次目标是先让新存储链路端到端跑通，而不是保住一批旧照片；把「先部署验证、再删旧数据」作为顺序，保留了完整回滚窗口。

## 后果

- `bootstrap-oss.ts` 的建桶与 `public-read` 策略失去意义：桶已存在且为私有，这两步没有执行对象。
- `apps/blog/app/server/oss/image-proxy.ts` 删除，`OSS_INTERNAL_URL` 随之移除。
- `apps/frontend` 里把裸对象键直接当 `src` 的写法（`photo-card.tsx`）本就取不到图，新方案下改为消费后端返回的预签名地址。
- **「允许空 Referer」是硬依赖。** 预签名 GET 由后端在响应时签发，请求最终由浏览器发出；任何服务端侧转发都没有 Referer 头。控制台漏勾这一项，读路径会全量 403，而代码里没有任何东西能提示这一点。
- **客户端：改用 `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`**，已实测通过。`apps/backend/scripts/verify-oss.ts` 对 3 个 region 候选 × 2 种端点形态 × 2 种寻址方式共 12 种组合做了真实预签名往返验证，得到三条结论：
  1. 虚拟主机寻址下，预签名 PUT → 真实 PUT → 预签名 GET → 字节一致 → 删除 → 404 全链路通过。
  2. **path-style 寻址被阿里云拒绝**（`SecondLevelDomainForbidden`，HTTP 403）。因此不得设置 `forcePathStyle`，也没有第二种寻址方式可选。
  3. **阿里云不校验签名中的 region。** 三个候选（`oss-cn-guangzhou` / `cn-guangzhou` / `us-east-1`）在发现阶段返回完全相同的 `x-oss-request-id`，说明 region 字段不承载语义，填任何值都能签通。
- **不要重新启用 nginx 缓存。** 三份 vhost 各自声明了 `proxy_cache_path`，但没有任何 `location` 使用 `proxy_cache`，因此缓存当前是关闭的。预签名读取 URL 会过期，一旦启用缓存，被缓存的 HTML 会向浏览器派发已过期的图片地址，且失败是静默的。
- `api.zcating.icu.conf` 在 nginx 层手工补了 CORS 响应头。新架构下浏览器不再跨域直连 API（CMS 走自己的服务端函数，博客走自身同源的 `/api`），这段配置不再有作用。**已决：保持原样不改**。若日后有人重新打开跨域直连，需要注意后端也会发出自己的 `Access-Control-Allow-Origin`，届时会出现重复响应头而被浏览器拒绝。
- `zcating.icu.conf` 的 `proxy_set_header Host 103.84.110.53` 写死裸 IP，而另外两份 vhost 用的是 `$http_host`。**已决：保持原样不改**。博客容器收到的 `Host` 因此是裸 IP，依赖 Host 生成绝对地址的逻辑要自己绕开。
- **写入路径现在强制「裸键入库、签名地址出库」这一分离。** 此前照片与头像的写 DTO（`CreatePhotoDtoSchema` / `UpdatePhotoDtoSchema` 的 `url` 与 `thumbnailUrl`、`UserInfoSchema.avatar`、上传配置的 `key`）一律是裸 `z.string()`，因此把完整 URL 或预签名 URL 当对象键提交会被原样写进数据库：预签名地址一小时后失效，行数据静默变成死链。**已决：在 DTO 层拒绝非裸键形状**（含 scheme、查询串、片段、`..` 段、前导 `/`、反斜杠、空白与控制字符），而非归一化——归一化会静默纠正上游错误，让真实缺陷无从发现。这不构成兼容性破坏：被拒绝的那类输入在迁移前同样产生损坏值（旧代码会拼成 `<publicUrl>/<bucket>/<你的URL>`），本次只是系统第一次对一个一直无效的输入说不。`avatar` 仍接受 `''`，但其语义是**擦除**而非「不修改」：该字段非可选，body 里省略会触发校验失败，所以 CMS 客户端表达「未改动」的方式是把**当前键原样回传**（`user-info.tsx` 中 `values.avatar.startsWith('blob:') ? values.avatar : userInfo.avatar`），表单字段那个空的 `''` 从不上线。任何真的把 `''` 送到后端的调用方会擦掉已存头像——后端原样写入 `''` 并据此签发，而客户端无法从响应区分「擦除」与「未改动」。
- **`photo.service.deleteById` 改为先删对象、成功后才删行。** 此前两个 `deleteFile` 的返回值被丢弃，而 `ossService.deleteFile` 内部 try/catch 且从不 reject，`false` 是它唯一的失败模式，于是删除失败时路由仍回 `{"code":"0000","message":"成功"}`——行已消失，运维被告知对象也已删除，`ERR0006` 在生产中不可达。**已决：任一 `deleteFile` 返回 `false` 即整体失败并保留该行。** 注意这**不是**原子操作：原图删除成功而缩略图删除失败时，行会留存但原图已消失。该状态可重试收敛（阿里云对删除不存在的 key 返回 204），但不应被描述为事务。