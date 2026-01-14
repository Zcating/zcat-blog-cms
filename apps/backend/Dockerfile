FROM node:24.12.0-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack install --global pnpm@latest
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

FROM base AS build
ENV HUSKY=0
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter=backend install --frozen-lockfile
RUN pnpm --filter=backend run build
# 清理开发依赖
RUN CI=true pnpm prune --prod --ignore-scripts

FROM base AS backend
WORKDIR /app

# 1. 复制项目配置和锁文件
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /usr/src/app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# 2. 复制 backend 的 package.json
COPY --from=build /usr/src/app/apps/backend/package.json ./apps/backend/package.json

# 删除 prepare 脚本防止 husky 报错 (因为生产环境不安装 husky)
RUN npm pkg delete scripts.prepare

# 3. 在生产环境重新安装 backend 的生产依赖
# 这确保了 node_modules 结构正确，且包含所有必要的 bin 文件
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --filter=backend --prod --frozen-lockfile

# 4. 复制构建产物和 Prisma 文件
COPY --from=build /usr/src/app/apps/backend/dist ./apps/backend/dist
COPY --from=build /usr/src/app/apps/backend/prisma ./apps/backend/prisma
COPY --from=build /usr/src/app/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts

WORKDIR /app/apps/backend
EXPOSE 9090
# 此时 node_modules 已正确生成，pnpm exec prisma 应该可以工作
CMD [ "sh", "-c", "pnpm exec prisma migrate deploy && pnpm run start" ]
