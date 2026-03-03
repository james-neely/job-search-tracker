FROM oven/bun:1 AS base
WORKDIR /app
RUN apt-get update && apt-get install -y fonts-freefont-ttf && rm -rf /var/lib/apt/lists/*

# Development stage
FROM base AS dev
COPY package.json bun.lock* ./
RUN bun install || true
COPY . .
RUN mkdir -p data/uploads
EXPOSE 3000
CMD ["sh", "-c", "bun install && bun run db:push && bun run dev"]

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
COPY --from=build /app/node_modules/pdf-parse ./node_modules/pdf-parse
COPY --from=build /app/node_modules/pdfjs-dist ./node_modules/pdfjs-dist
COPY --from=build /app/node_modules/@napi-rs ./node_modules/@napi-rs
COPY --from=build /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts
RUN mkdir -p data/uploads
EXPOSE 3000
CMD ["sh", "-c", "bun scripts/migrate.ts && bun server.js"]
