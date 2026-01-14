FROM node:24.12.0-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack install --global pnpm@latest
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
ENV HUSKY=0
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter=blog... install --frozen-lockfile --prefer-offline
RUN pnpm --filter=blog run build
# 清理开发依赖，只保留生产依赖
RUN CI=true pnpm prune --prod --ignore-scripts

FROM base AS blog
WORKDIR /app

# 复制根目录 package.json (维持结构)
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /usr/src/app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# 复制前端项目必要文件
COPY --from=build /usr/src/app/apps/blog/package.json ./apps/blog/package.json
COPY --from=build /usr/src/app/apps/blog/build ./apps/blog/build

# 删除 prepare 脚本防止 husky 报错 (因为生产环境不安装 husky)
RUN npm pkg delete scripts.prepare

# 3. 在生产环境重新安装 blog 的生产依赖
# 这确保了 node_modules 结构正确，且包含所有必要的 bin 文件
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --filter=blog --prod --frozen-lockfile

WORKDIR /app/apps/blog

EXPOSE 1024
CMD [ "pnpm", "run", "start" ]
