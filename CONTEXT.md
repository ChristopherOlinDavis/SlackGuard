# SlackGuard - AI Context File

> **Quick Reference**: This file provides AI assistants with rapid context about the SlackGuard codebase.

## 🎯 Project Overview

**Type**: SaaS Platform
**Purpose**: Slack app compliance monitoring for Nov 2026 deprecation deadline
**Business Model**: Freemium (FREE → PRO at $49/month)
**Stack**: Remix + Prisma + PostgreSQL + Tailwind CSS + TypeScript

## 🏗️ Architecture

### Core Concept
Scans Slack workspaces via `team.integrationLogs` API to detect "Classic Apps" (deprecated `bot` scope) vs "Modern Apps" (granular OAuth scopes).

### 🚨 Scope of Truth (Detection Logic)

**The "Red" Criteria (Classic App):**
- **Must Have**: scope includes `bot`
- **Must NOT Have**: Granular permissions (e.g., `chat:write`, `users:read`, `channels:read`)
- **Reasoning**: Apps with BOTH `bot` and `chat:write` are hybrid/modernized. Only "pure" bot-scope apps are at risk.

**The "Ignore" List (False Positive Prevention):**
- **Incoming Webhooks**: Ignore if `service_type` is `incoming-webhook` or scope is ONLY `incoming-webhook`. (Legacy, but not the Nov 2026 breakage target).
- **Slash Commands**: Ignore if scope is ONLY `commands`.
- **Slackbot/System**: Ignore logs where `user_name` is "Slackbot" or "System".

### Database Schema (Prisma)

```
Workspace (multi-tenant)
├── subscriptionTier: FREE | PRO
├── stripeCustomerId: String?
├── hasUsedFreeScan: boolean
├── InstalledApp[] (apps with scopes + status)
├── RiskAudit[] (daily snapshots)
└── ScanHistory[] (time-series for trends)
```

## 📁 File Structure

```
app/
├── lib/
│   ├── prisma.server.ts          # Singleton Prisma client
│   └── stripe.server.ts          # Stripe Checkout & Webhook handlers
├── services/
│   ├── scanner.server.ts         # Core scanning + scope parsing logic
│   └── monitoring.server.ts      # Drift detection jobs
├── routes/
│   ├── dashboard.tsx             # Main UI (subscription-aware)
│   ├── api.stripe.checkout.ts    # Endpoint to initiate PRO upgrade
│   └── export-csv.tsx            # PRO-only CSV export
├── components/Dashboard/
│   └── TrafficLight.tsx          # Blurred UI for FREE tier
└── types/domain.ts               # TypeScript interfaces
```

## 🔑 Key Features

### Freemium Hook
- FREE tier: One scan, blurred app names (psychological gap → conversion)
- PRO tier: Unlimited scans, full details, CSV export, drift detection

### Subscription Logic
```typescript
// app/services/scanner.server.ts:153
canWorkspaceScan() checks:
- PRO → always allowed
- FREE → only if !hasUsedFreeScan
```

### Drift Detection (Retention Metric)
```typescript
// app/services/scanner.server.ts:187
detectDrift() compares current vs previous scans:
- 🔴 Bad Drift: New "Classic" app installed (Alert Admin)
- 🟢 Good Drift: "Classic" app removed or migrated (Celebrate Progress)
- 🟡 Warning: Scope escalation on existing app
```

### UI Gating (Blurred Preview)
```tsx
// app/components/Dashboard/TrafficLight.tsx:105
FREE tier: .slice(0, 3) + filter: blur-sm + overlay CTA
PRO tier: Full access + CSV export button
```

## 🚀 Critical Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `scanWorkspace()` | scanner.server.ts | Main scan with rate limiting (Tier 2) |
| `isClassicApp()` | scanner.server.ts | Strict detection logic (excludes webhooks) |
| `canWorkspaceScan()` | scanner.server.ts | Subscription gate |
| `generateStripeCheckout()` | stripe.server.ts | Creates Stripe Session for Upgrade |
| `detectDrift()` | scanner.server.ts | Compares snapshots for alerts |
| `TrafficLight` | TrafficLight.tsx | Subscription-aware UI renderer |

## 📊 Data Flow

```
User → /dashboard?workspaceId=X
  ↓
loader checks subscription
  ↓
canWorkspaceScan() → enforces limits
  ↓
scanWorkspace() → Slack API (team.integrationLogs)
  ↓
processLogs() → filter by change_type: 'added'
  ↓
isClassicApp() → Apply "Scope of Truth"
  ↓
detectDrift() → compare vs previous scan
  ↓
Prisma transaction:
  - upsert InstalledApp
  - create ScanHistory
  - mark hasUsedFreeScan (if FREE)
  ↓
TrafficLight renders with tier-based UI
```

## 🔧 Environment Variables

```env
DATABASE_URL="postgresql://..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_PRO="price_xxx"
SLACK_CLIENT_ID="..."
SLACK_CLIENT_SECRET="..."
```

## 🐛 Common Gotchas

1. **Rate Limiting**: Slack Tier 2 is 20 req/min. You MUST await 3000ms between pagination calls in scanner.server.ts.
2. **Enterprise Grid**: `team.integrationLogs` only returns data for the specific `team_id`. Do not assume it scans the whole Org.
3. **Webhook Confusion**: AI often flags "Incoming Webhook" as "Classic." Explicitly check `service_type` to ignore these.
4. **Free Tier Lockout**: Ensure the "Upgrade" button in TrafficLight.tsx actually redirects to `/api/stripe/checkout`.
5. **Prisma Singleton**: Always import from `~/lib/prisma.server.ts` to avoid connection exhaustion
6. **CSV Export**: PRO-only (403 for FREE tier)

## 🧪 Testing Checklist

- [ ] **False Positive Test**: Create a Webhook-only app; ensure it does NOT show up as Red.
- [ ] **Pagination Test**: Mock a response with `paging.pages: 3`; verify 3s delay between fetches.
- [ ] **Free Tier**: Verify "App Names" are unreadable (blurred) but "Counts" are visible.
- [ ] **Drift**: Install a classic app → Scan → Remove it → Scan again. Verify "Good Drift" is recorded.
- [ ] FREE tier: One scan allowed, then blocked
- [ ] PRO tier: Unlimited scans, full access
- [ ] Detection: `bot` only → Classic, `bot` + `chat:write` → Modern

## 📝 AI Assistant Instructions

### Tone Check
- When explaining "Red" risks, be authoritative but calm.
- **Bad**: "Your workspace is broken and dangerous."
- **Good**: "Action required: 3 apps rely on deprecated scopes that will cease functioning in Nov 2026."

### Logic Check
- Always verify `isClassicApp` includes the check `!scopes.includes('chat:write')` to avoid flagging modernized hybrid apps.

## 💡 Code Patterns

### Subscription Check Pattern
```typescript
const subscription = await getWorkspaceSubscription(workspaceId);
if (subscription.subscriptionTier === "FREE") {
  // limit features
}
```

### Tier-Aware Rendering
```tsx
const isFree = subscriptionTier === "FREE";
{isFree ? <BlurredPreview /> : <FullAccess />}
```

### Idempotent Database Ops
```typescript
await prisma.installedApp.upsert({
  where: { workspaceId_appId: { workspaceId, appId } },
  update: { ... },
  create: { ... }
});
```

## 🚦 Quick Debug Commands

```bash
# Type check
npm run typecheck

# Database push (no migrations)
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed demo data
npm run db:seed

# Reset and seed
npm run db:reset

# Dev server
npm run dev
```

## 🎯 Next Implementation Tasks

See [ENHANCEMENTS.md](./ENHANCEMENTS.md) for detailed backlog.

**Priority:**
1. Stripe integration for real payments
2. Email service (SendGrid/AWS SES) for alerts
3. Cron job setup for drift detection
4. Slack OAuth for workspace authorization

## 💡 AI Assistant Tips

- Always check subscription tier before allowing features
- Use `~/lib/prisma.server.ts` for database access
- Freemium conversion is core to business model (keep FREE limited)
- Drift detection = recurring value = subscription retention
- CSV export = high-value IT manager feature
- Never flag incoming webhooks or slash commands as Classic apps

---

**Last Updated**: 2026-01-05
**Branch**: `claude/slackguard-lite-scanner-38Erz`
**Production Ready**: No (needs Stripe + email integration)
