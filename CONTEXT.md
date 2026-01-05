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

### Key Detection Logic
```typescript
// app/services/scanner.server.ts:77
isClassicApp = has 'bot' scope AND no granular scopes (chat:write, users:read, etc.)
```

**Why?** Reduces false positives. Apps with BOTH `bot` + granular scopes are transitioning (not urgent).

### Database Schema (Prisma)

```
Workspace (multi-tenant)
├── subscriptionTier: FREE | PRO
├── hasUsedFreeScan: boolean
├── InstalledApp[] (apps with scopes)
├── RiskAudit[] (daily snapshots)
└── ScanHistory[] (time-series for trends)
```

## 📁 File Structure

```
app/
├── lib/
│   └── prisma.server.ts          # Singleton Prisma client
├── services/
│   ├── scanner.server.ts         # Core scanning + drift detection
│   └── monitoring.server.ts      # Background jobs + email alerts
├── routes/
│   ├── dashboard.tsx             # Main UI (subscription-aware)
│   ├── upgrade.tsx               # Pricing page
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

### Drift Detection
```typescript
// app/services/scanner.server.ts:187
detectDrift() compares current vs previous scans:
- newClassicApps[] (new risky apps installed)
- removedApps[] (apps uninstalled)
- scopeChanges[] (permission changes)
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
| `scanWorkspace()` | scanner.server.ts:259 | Main scan with rate limiting |
| `canWorkspaceScan()` | scanner.server.ts:153 | Subscription gate |
| `detectDrift()` | scanner.server.ts:187 | Change detection |
| `runWeeklyDriftDetection()` | monitoring.server.ts:17 | Background job |
| `TrafficLight` | TrafficLight.tsx:10 | Subscription-aware UI |

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
isClassicApp() → detect bot scope without granular
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

## 🎨 UI/UX Strategy

### Conversion Psychology
```
FREE user sees:
"You have 12 Classic Apps" ← urgency
App names: ████████ (blurred) ← need to know
Big orange CTA: "Unlock Full Migration Report"
```

### PRO Value Props
- Unlimited scans
- Full app visibility
- CSV export (IT manager reports)
- Weekly drift detection
- Email alerts

## 🔧 Environment Variables

```env
DATABASE_URL="postgresql://..."
SESSION_SECRET="..."
MONITORING_SECRET_TOKEN="..." (for cron endpoint)
```

## 🐛 Common Gotchas

1. **Prisma Singleton**: Always import from `~/lib/prisma.server.ts` to avoid connection exhaustion
2. **Rate Limiting**: 3s delay between Slack API pagination (Tier 2 = 20 req/min)
3. **FREE Tier Gate**: Check `hasUsedFreeScan` before allowing scan
4. **CSV Export**: PRO-only (403 for FREE tier)
5. **Drift Detection**: Only runs for PRO workspaces in monitoring job

## 🧪 Testing Checklist

- [ ] FREE tier: One scan allowed, then blocked
- [ ] FREE tier: App names blurred, CTA shown
- [ ] PRO tier: Unlimited scans, full access
- [ ] CSV export: Works for PRO, 403 for FREE
- [ ] Detection: `bot` only → Classic, `bot` + `chat:write` → Modern
- [ ] Drift: Detects new classic apps

## 📝 Code Patterns

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

---

**Last Updated**: 2026-01-05
**Branch**: `claude/slackguard-lite-scanner-38Erz`
**Production Ready**: No (demo mode, needs Stripe + email integration)
