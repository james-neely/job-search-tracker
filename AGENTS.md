# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 15 app using React 19, TypeScript, Bun, and Drizzle ORM. Pages and route handlers live under `src/app`, feature UI under `src/components/*`, and database code under `src/db/schemas`, `src/db/queries`, and `src/db/index.ts`. Generated SQL migrations are stored in `drizzle/`. Static assets belong in `public/`, and uploaded files are stored under `data/uploads/`.

## Build, Test, and Development Commands
Use Bun for local work:

- `bun install`: install dependencies.
- `bun run dev`: start the local dev server with Turbopack on `0.0.0.0:3000`.
- `bun run build`: create a production build.
- `bun run start`: run the production server.
- `bun run db:push`: apply the current Drizzle schema to the SQLite database.
- `bun run db:generate`: generate migration files in `drizzle/`.
- `bun run db:studio`: inspect the database in Drizzle Studio.
- `docker compose up`: run the app in the containerized dev setup.

## Coding Style & Naming Conventions
TypeScript runs in `strict` mode; keep new code fully typed and prefer the `@/*` import alias over deep relative paths. Follow the existing style: 2-space indentation, double quotes, semicolons, and PascalCase for React components such as `ApplicationForm.tsx`. Use camelCase for functions and kebab-case for schema files such as `application-tasks.ts`. Lint with `npx eslint .`; the repo uses the Next.js config in `eslint.config.mjs`.

## Testing Guidelines
There is no automated test suite committed yet. Until one is added, treat `bun run build` and `npx eslint .` as the minimum verification for every change. For data-model work, also run `bun run db:generate` or `bun run db:push` and verify the affected flow manually. Place future tests next to the feature they cover or under `tests/`, and name them after the unit or route being exercised.

## Commit & Pull Request Guidelines
Recent history uses short Conventional Commit subjects such as `fix: move themeColor from metadata to viewport export`. Keep commits focused and use prefixes like `fix:`, `feat:`, or `chore:`. Pull requests should include a brief summary, note schema or environment changes, link related issues, and attach screenshots for UI updates.

## Security & Configuration Tips
Keep secrets in local environment files and never commit API keys. SQLite defaults to `data/app.db` through `DB_PATH`; preserve that location unless deployment requires an override.
