FROM node:24.12.0-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack install --global pnpm@latest
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
ENV HUSKY=0
# 安装所有依赖用于构建
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter=frontend install --frozen-lockfile --prefer-offline
# 执行构建
RUN pnpm --filter=frontend run build
# 清理开发依赖，只保留生产依赖
RUN CI=true pnpm prune --prod --ignore-scripts


FROM base AS frontend
WORKDIR /app

# 复制根目录 package.json (维持结构)
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /usr/src/app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# 复制前端项目必要文件
COPY --from=build /usr/src/app/apps/frontend/package.json ./apps/frontend/package.json
COPY --from=build /usr/src/app/apps/frontend/build ./apps/frontend/build

# 删除 prepare 脚本防止 husky 报错 (因为生产环境不安装 husky)
RUN npm pkg delete scripts.prepare

# 3. 在生产环境重新安装 frontend 的生产依赖
# 这确保了 node_modules 结构正确，且包含所有必要的 bin 文件
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --filter=frontend --prod --frozen-lockfile


# 设置工作目录
WORKDIR /app/apps/frontend
EXPOSE 3000
CMD [ "pnpm", "run", "start" ]
