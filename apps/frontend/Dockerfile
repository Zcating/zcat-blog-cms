FROM node:24.12.0-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack install --global pnpm@latest
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

FROM base AS build
ENV HUSKY=0
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter=ui install --frozen-lockfile
RUN pnpm --filter=ui run build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter=frontend install --frozen-lockfile
RUN pnpm --filter=frontend run build
RUN pnpm deploy --filter=frontend --prod --legacy /prod/frontend

FROM base AS frontend
COPY --from=build /prod/frontend /prod/frontend
WORKDIR /prod/frontend
EXPOSE 3000
CMD [ "sh", "-c", "npm run start" ]
