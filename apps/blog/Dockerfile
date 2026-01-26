FROM node:24.12.0-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack install --global pnpm@latest
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
ENV HUSKY=0
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter=ui install --frozen-lockfile
RUN pnpm --filter=ui run build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter=blog install --frozen-lockfile
RUN pnpm --filter=blog run build
RUN pnpm deploy --filter=blog --prod --lagacy /prod/blog

FROM base AS blog
COPY --from=build /prod/blog /prod/blog
WORKDIR /prod/blog
EXPOSE 1024
CMD [ "sh", "-c", "pnpm run start" ]
