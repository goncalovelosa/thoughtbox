# Cloud Run worker image (prototype — not part of root monolith build)
FROM node:22-slim

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
EXPOSE 8080
CMD ["pnpm", "exec", "tsx", "src/index.ts"]
