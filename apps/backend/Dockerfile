FROM node:24.12.0-slim AS base

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
RUN pnpm deploy --filter=backend --prod --legacy /prod/backend

FROM base AS backend
COPY --from=build /prod/backend /prod/backend
WORKDIR /prod/backend
EXPOSE 9090
CMD [ "sh", "-c", "pnpm run db:deploy:prod && pnpm run start" ]
