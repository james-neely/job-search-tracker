# Job Search Tracker

A full-stack web application for managing and organizing your job search. Track applications, prepare for interviews with AI-powered tools, and monitor your progress from a central dashboard.

## Features

- **Application Management** - Create, update, and track job applications with status history, salary info, interview dates, and notes
- **Dashboard** - Overview stats, status breakdown, and recent activity at a glance
- **AI-Powered Tools** - Interview preparation, company research, and resume tailoring powered by xAI
- **Document Storage** - Upload and manage resumes, cover letters, and other documents per application
- **Company Links** - Save relevant URLs (career pages, LinkedIn, etc.) for each application

## Tech Stack

- **Framework**: Next.js 15 with React 19 and TypeScript
- **UI**: Material UI (MUI) v6
- **Database**: SQLite with Drizzle ORM
- **AI**: xAI via Vercel AI SDK
- **Runtime**: Bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- An xAI API key (configured in the app's settings page)

### Local Development

```bash
bun install
bun run db:push
bun run dev
```

The app will be available at `http://localhost:3000`.

### Docker (Development)

```bash
docker compose up
```

The app will be available at `http://localhost:3001`.

### Docker (Production)

The production image uses the `production` target in the Dockerfile and does not include dev dependencies like `drizzle-kit`. You need to initialize the database schema separately before starting the app.

1. Build the production and dev images:

```bash
docker build --target production -t job-search-tracker .
docker build --target dev -t job-search-tracker-dev .
```

2. Initialize the database schema using the dev image:

```bash
docker run --rm -v job-search-tracker-data:/app/data job-search-tracker-dev bun run db:push
```

3. Start the production container:

```bash
docker run -d --name job-search-tracker \
  -p 3000:3000 \
  -v job-search-tracker-data:/app/data \
  job-search-tracker
```

If the app gets stuck on "Loading settings...", the database tables likely haven't been created. Re-run step 2 and restart the container.

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server with Turbopack |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run db:push` | Push schema changes to the database |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:studio` | Open Drizzle Studio |

## License

This project is licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE) for details.
