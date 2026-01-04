# SlackGuard Lite - Deprecation Scanner

A scanner to detect "Classic Slack Apps" (Legacy) that will break in November 2026.

## Overview

SlackGuard Lite uses the Slack API `team.integrationLogs` endpoint to identify apps that use deprecated permissions. Apps containing the deprecated `bot` scope are flagged as "Classic" (Red), while apps with granular permissions (e.g., `chat:write`) are "Modern" (Green).

## Tech Stack

- **Remix** (Node.js) - Full-stack web framework
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Database
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Features

- ✅ Detects Classic vs Modern Slack Apps
- ✅ Visual traffic light dashboard (Red/Green cards)
- ✅ Rate-limited API calls (respects Slack Tier 2 limits)
- ✅ Pagination support for large workspaces
- ✅ Idempotent database operations
- ✅ Risk audit history tracking
- ✅ Multi-tenancy support

## Database Schema

### Models

- **Workspace**: Stores workspace information and access tokens
- **InstalledApp**: Tracks all installed apps with their scopes and status
- **RiskAudit**: Historical audit logs of scan results

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Slack workspace with Standard/Plus plan (for `team.integrationLogs` API access)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd SlackGuard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/slackguard"
   SESSION_SECRET="your-secret-key-here"
   ```

4. Set up the database:
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

### Running a Scan

Navigate to `/dashboard?workspaceId=<workspace-id>&scan=true` to trigger a new scan.

### Viewing Results

Navigate to `/dashboard?workspaceId=<workspace-id>` to view the latest scan results.

## Detection Logic

### Classic Apps (Red)

Apps are classified as "Classic" if they contain the `bot` scope. These apps will break in November 2026 and require migration to granular permissions.

### Modern Apps (Green)

Apps using granular OAuth scopes (e.g., `chat:write`, `users:read`) are ready for the future and don't require action.

## API Rate Limiting

The scanner implements a 3-second delay between pagination requests to respect Slack's Tier 2 rate limits (20 requests/minute).

## Architecture

### Backend Services

- **scanner.server.ts**: Core scanning logic
  - Fetches integration logs from Slack API
  - Handles pagination with rate limiting
  - Parses scopes and detects classic apps
  - Saves results to database with idempotency

### Frontend Components

- **TrafficLight.tsx**: Dashboard visualization
  - Red card for Classic apps (Action Required)
  - Green card for Modern apps (Compliant)
  - Table view with app details and scopes

### Database Operations

- Uses Prisma transactions for atomicity
- Upsert operations ensure idempotency
- Unique constraints prevent duplicate entries
- Audit trail with daily idempotency keys

## Development

### Type Checking

```bash
npm run typecheck
```

### Database Migrations

```bash
npm run db:migrate
```

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
SlackGuard/
├── app/
│   ├── components/
│   │   └── Dashboard/
│   │       └── TrafficLight.tsx
│   ├── routes/
│   │   ├── _index.tsx
│   │   └── dashboard.tsx
│   ├── services/
│   │   └── scanner.server.ts
│   ├── types/
│   │   └── domain.ts
│   ├── entry.client.tsx
│   ├── entry.server.tsx
│   ├── root.tsx
│   └── tailwind.css
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

## Contributing

This is a backend and frontend implementation based on the SlackGuard Lite specification. For issues or enhancements, please follow the contribution guidelines.

## License

MIT
