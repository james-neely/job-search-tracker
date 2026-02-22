FROM oven/bun:1 AS base
WORKDIR /app

# Development stage
FROM base AS dev
COPY package.json bun.lock* ./
RUN bun install || true
COPY . .
RUN mkdir -p data/uploads
EXPOSE 3000
CMD ["bun", "run", "dev"]

# Build stage
FROM base AS build
COPY package.json bun.lock* ./
RUN bun install
COPY . .
RUN bun run build

# Production stage
FROM base AS production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
RUN mkdir -p data/uploads
EXPOSE 3000
CMD ["bun", "server.js"]
