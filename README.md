# SlackGuard - Compliance & Monitoring Platform

A **subscription-based SaaS platform** to help IT teams track and manage their Slack app compliance before the November 2026 deadline.

## Overview

SlackGuard uses the Slack API `team.integrationLogs` endpoint to identify apps that use deprecated permissions. Apps containing the deprecated `bot` scope **without granular scopes** are flagged as "Classic" (Red), while apps with modern granular permissions (e.g., `chat:write`) are "Modern" (Green).

### 🆕 SaaS Transformation

SlackGuard has evolved from a one-time diagnostic tool into a **subscription-based compliance platform** with:

- **Freemium Model**: One free scan to hook users, then upgrade to PRO for unlimited monitoring
- **Trend Tracking**: Track migration progress over time (Red apps decreasing month-over-month)
- **Drift Detection**: Weekly automated scans detect new classic apps or scope changes
- **Email Alerts**: Get notified when new risky apps are installed
- **CSV Exports**: Download Red Lists for IT manager reporting

## Tech Stack

- **Remix** (Node.js) - Full-stack web framework
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Database
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Features

### Core Scanning
- ✅ Detects Classic vs Modern Slack Apps
- ✅ **Refined Detection Logic**: Checks for `bot` scope WITHOUT granular scopes (reduces false positives)
- ✅ Visual traffic light dashboard (Red/Green cards)
- ✅ Rate-limited API calls (respects Slack Tier 2 limits)
- ✅ Pagination support for large workspaces

### Subscription Features
- ✅ **Freemium Hook**: One-time free scan for all workspaces
- ✅ **Blurred Preview**: Free tier sees counts but app names are blurred
- ✅ **Upgrade CTA**: Prominent "Unlock Full Migration Report" button
- ✅ **CSV Export**: PRO tier can export Red List for IT reporting
- ✅ **Unlimited Scans**: PRO tier removes scan limits

### Monitoring & Trend Tracking
- ✅ **Scan History**: Track migration progress over time
- ✅ **Drift Detection**: Detect new classic apps, removed apps, and scope changes
- ✅ **Background Jobs**: Framework for weekly automated scans
- ✅ **Email Alerts**: Notify admins when drift is detected (email service integration ready)

### Security & Authentication
- ✅ **Slack OAuth Integration**: Secure workspace authorization flow
- ✅ **Token Encryption**: AES-256-GCM encryption for access tokens
- ✅ **Encrypted Storage**: All sensitive tokens encrypted at rest

### Email & Notifications
- ✅ **Drift Alert Emails**: Automated alerts for new classic apps, removed apps, and scope changes
- ✅ **Welcome Emails**: Onboarding email for new PRO subscribers
- ✅ **Beautiful HTML Templates**: Professional email designs with traffic light categorization
- ✅ **Resend Integration**: Modern, developer-friendly email service

### Technical Excellence
- ✅ Idempotent database operations
- ✅ Multi-tenancy support with subscription tiers
- ✅ Transaction-based data consistency
- ✅ Type-safe with TypeScript throughout
- ✅ Production-ready Stripe integration
- ✅ Secure OAuth callback handling

## Subscription Tiers

### FREE Tier
- ✅ One-time free scan
- ✅ See Classic vs Modern app counts (Red/Green cards)
- ⚠️ App names and details are blurred (only first 3 shown)
- ❌ No CSV exports
- ❌ No additional scans without upgrade

### PRO Tier ($49/month)
- ✅ **Unlimited scans**
- ✅ Full app list with details
- ✅ CSV export (Red List)
- ✅ Historical trend tracking
- ✅ Weekly drift detection
- ✅ Email alerts for new classic apps
- ✅ Priority support

## Database Schema

### Models

- **Workspace**: Stores workspace information, access tokens, and **subscription tier**
- **InstalledApp**: Tracks all installed apps with their scopes and status
- **RiskAudit**: Historical audit logs of scan results (daily idempotency)
- **ScanHistory**: Time-series data for trend tracking and drift detection

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

   Edit `.env` and configure the **required** variables:

   **Database:**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/slackguard"
   ```

   **Encryption (REQUIRED):**
   ```bash
   # Generate a secure 32-byte encryption key:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Then add to `.env`:
   ```env
   ENCRYPTION_KEY="your_64_character_hex_string"
   ```

   **Slack OAuth (REQUIRED for production):**
   - Create a Slack app at https://api.slack.com/apps
   - Add OAuth scopes: `admin.integrations:read`, `team:read`
   - Set redirect URL to: `https://yourdomain.com/auth/slack/callback`
   ```env
   SLACK_CLIENT_ID="your_client_id"
   SLACK_CLIENT_SECRET="your_client_secret"
   SLACK_REDIRECT_URI="https://yourdomain.com/auth/slack/callback"
   ```

   **Email Service (REQUIRED for drift alerts):**
   - Create account at https://resend.com
   - Verify your sending domain
   ```env
   RESEND_API_KEY="re_..."
   FROM_EMAIL="SlackGuard <alerts@yourdomain.com>"
   SUPPORT_EMAIL="support@yourdomain.com"
   ```

   **Stripe (REQUIRED for PRO subscriptions):**
   - Create account at https://stripe.com
   - Create a recurring price/product
   - Set up webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
   ```env
   STRIPE_SECRET_KEY="sk_live_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   STRIPE_PRICE_ID_PRO="price_..."
   ```

   **Application URL:**
   ```env
   APP_URL="https://yourdomain.com"
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

### Authentication Flow

1. **Install the Slack App:**
   - Navigate to `/auth/slack/install`
   - User is redirected to Slack OAuth consent page
   - After authorization, user is redirected back with access token
   - Access token is **encrypted** and stored securely

2. **Callback Handling:**
   - OAuth callback creates/updates workspace in database
   - Admin email is captured for drift alerts
   - User is redirected to dashboard automatically

### Dashboard
Navigate to `/dashboard?workspaceId=<workspace-id>` to view results or trigger a scan.

**First-time users (FREE tier):**
- Automatically triggers one free scan
- Shows Red/Green counts with blurred app names
- Displays "Unlock Full Migration Report" CTA

**PRO users:**
- Full access to app details
- Can export CSV
- Can trigger unlimited scans with `?scan=true`
- Receives automated drift alert emails

### Upgrade Flow
Navigate to `/upgrade?workspaceId=<workspace-id>` to see pricing and upgrade to PRO.

**Simulated Upgrade:**
Currently implements a demo upgrade flow. In production, integrate with Stripe or another payment provider.

### CSV Export (PRO only)
Navigate to `/export-csv?workspaceId=<workspace-id>` to download the Red List as CSV.

### Monitoring Setup
See [MONITORING_SETUP.md](./MONITORING_SETUP.md) for detailed instructions on setting up weekly drift detection and email alerts.

## Detection Logic

### Classic Apps (Red) - Refined Logic

Apps are classified as "Classic" if they meet BOTH criteria:
1. ✅ Contain the `bot` scope
2. ❌ Do NOT have any granular OAuth scopes (e.g., `chat:write`, `users:read`)

**Why the refinement?**
This reduces false positives. Apps that have BOTH `bot` and granular scopes are likely in transition and won't break immediately. Pure classic apps (only `bot` scope) are the highest priority.

### Modern Apps (Green)

Apps using exclusively granular OAuth scopes are ready for the future and don't require action.

### Transitioning Apps

Apps with BOTH `bot` and granular scopes are classified as Modern (not flagged as high-priority red) but should still be reviewed.

## API Rate Limiting

The scanner implements a 3-second delay between pagination requests to respect Slack's Tier 2 rate limits (20 requests/minute).

## Architecture

### Backend Services

- **scanner.server.ts**: Core scanning logic
  - Fetches integration logs from Slack API
  - **Decrypts access tokens** before API calls
  - Handles pagination with rate limiting
  - **Refined detection**: Checks for `bot` scope WITHOUT granular scopes
  - **Free tier logic**: Enforces one-time scan limit
  - **Drift detection**: Compares current vs previous scans
  - **Sends drift alert emails** for PRO workspaces
  - Saves results to database with idempotency
  - Exports: `scanWorkspace`, `getLatestScanResult`, `canWorkspaceScan`, `getScanHistory`

- **encryption.server.ts**: Token encryption/decryption
  - AES-256-GCM encryption for access tokens
  - Secure key management via environment variables
  - Migration support for plaintext tokens
  - Exports: `encrypt`, `decrypt`, `isEncrypted`, `migrateToken`

- **email.server.ts**: Email notification service
  - Drift alert emails with traffic light categorization
  - Welcome emails for new PRO subscribers
  - Beautiful HTML/text templates
  - Resend API integration
  - Exports: `sendDriftAlertEmail`, `sendWelcomeEmail`

- **stripe.server.ts**: Payment processing
  - Checkout session creation
  - Webhook event handling (subscription lifecycle)
  - Customer management
  - Billing portal integration
  - Exports: `createCheckoutSession`, `handleStripeWebhook`, `createBillingPortalSession`

- **monitoring.server.ts**: Background job framework
  - Weekly drift detection for PRO workspaces
  - Email alert generation
  - Exports: `runWeeklyDriftDetection`, `scheduledMonitoringJob`

### Authentication Routes

- **auth.slack.install.tsx**: OAuth installation flow
  - Redirects to Slack OAuth consent page
  - CSRF protection with state parameter

- **auth.slack.callback.tsx**: OAuth callback handler
  - Exchanges authorization code for access token
  - Encrypts and stores access token
  - Captures admin email for notifications
  - Creates/updates workspace in database

### Frontend Components

- **TrafficLight.tsx**: Dashboard visualization
  - Subscription-aware UI (FREE vs PRO)
  - Red/Green cards for Classic/Modern app counts
  - **Blurred preview** for FREE tier users
  - **Upgrade CTA overlay** for FREE tier
  - CSV export button for PRO tier
  - Full table view with app details and scopes

### Routes

- **dashboard.tsx**: Main dashboard with loader
  - Checks subscription tier
  - Enforces scan limits
  - Passes subscription data to component

- **upgrade.tsx**: Pricing page and simulated upgrade flow
  - Compares FREE vs PRO tiers
  - Simulates subscription upgrade (Stripe integration ready)

- **export-csv.tsx**: CSV export endpoint (PRO only)
  - Generates downloadable Red List CSV

### Database Operations

- Uses Prisma transactions for atomicity
- Upsert operations ensure idempotency
- Unique constraints prevent duplicate entries
- Audit trail with daily idempotency keys
- **ScanHistory** tracks trends over time

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
│   │       └── TrafficLight.tsx          # Subscription-aware dashboard UI
│   ├── routes/
│   │   ├── _index.tsx                    # Home route (redirects to dashboard)
│   │   ├── dashboard.tsx                 # Main dashboard with scan logic
│   │   ├── upgrade.tsx                   # Pricing & upgrade flow
│   │   └── export-csv.tsx                # CSV export endpoint (PRO only)
│   ├── services/
│   │   ├── scanner.server.ts             # Core scanning + drift detection
│   │   └── monitoring.server.ts          # Background jobs & email alerts
│   ├── types/
│   │   └── domain.ts                     # TypeScript interfaces
│   ├── entry.client.tsx
│   ├── entry.server.tsx
│   ├── root.tsx
│   └── tailwind.css
├── prisma/
│   └── schema.prisma                     # DB schema with subscriptions
├── MONITORING_SETUP.md                   # Cron job setup guide
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

## SaaS Roadmap & Next Steps

### Production Readiness

- [ ] **Payment Integration**: Integrate Stripe for real subscription management
- [ ] **Email Service**: Connect SendGrid, AWS SES, or Resend for drift alerts
- [ ] **Monitoring Jobs**: Set up cron jobs or task queue (see [MONITORING_SETUP.md](./MONITORING_SETUP.md))
- [ ] **Authentication**: Add Slack OAuth for workspace authorization
- [ ] **Analytics**: Track conversion rates (FREE → PRO)
- [ ] **Error Monitoring**: Integrate Sentry or LogRocket

### Future Enhancements

- [ ] **Trend Charts**: Visualize migration progress with Chart.js
- [ ] **Team Collaboration**: Multi-user access with role-based permissions
- [ ] **Migration Guides**: In-app documentation for fixing classic apps
- [ ] **Slack Bot Integration**: Get alerts directly in Slack
- [ ] **API Access**: REST API for enterprise customers
- [ ] **White-label**: Custom branding for enterprise plans

### Why This SaaS Model Works

**The Freemium Hook:**
- Free users see "You have 12 Classic Apps" (creates urgency)
- But can't see WHICH apps (blurred names create need)
- This psychological gap drives conversions

**Monthly Subscription Justification:**
- Compliance is ongoing, not one-time
- Drift detection = continuous value
- Track progress month-over-month toward Nov 2026
- IT managers need reporting tools (CSV exports)

**Target Customer:**
- IT Managers at companies with 100+ Slack users
- Standard/Plus Slack plans (have `team.integrationLogs` API)
- Companies with compliance requirements
- Price point: $49/month is easy expense approval

## Contributing

This is a complete SaaS platform implementation. For issues or enhancements, please follow the contribution guidelines.

## License

MIT
