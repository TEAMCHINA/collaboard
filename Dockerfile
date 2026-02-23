FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Install dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY tsconfig.base.json ./
COPY shared/src shared/src
COPY shared/tsconfig.json shared/
COPY server/src server/src
COPY server/tsconfig.json server/
COPY client/src client/src
COPY client/tsconfig.json client/
COPY client/index.html client/
COPY client/vite.config.ts client/
RUN pnpm build

# Production image
FROM node:22-slim AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN pnpm install --frozen-lockfile --prod

COPY --from=base /app/shared/dist shared/dist
COPY --from=base /app/server/dist server/dist
COPY --from=base /app/client/dist client/dist

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["pnpm", "start"]
