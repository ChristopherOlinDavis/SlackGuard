# SlackGuard - Enhancements & Bugfix Tracker

> Track improvements, known issues, and future features for SlackGuard SaaS platform.

## 🚨 Critical (Production Blockers)

### Payment Integration
- [ ] **Stripe Integration** - Replace simulated upgrade flow
  - [ ] Create Stripe customer on workspace creation
  - [ ] Handle subscription webhooks (payment.succeeded, payment.failed)
  - [ ] Implement checkout session
  - [ ] Add billing portal link
  - [ ] Handle subscription cancellation
  - [ ] Prorate upgrades/downgrades
  - **Priority**: P0
  - **Impact**: Revenue generation
  - **Estimate**: 2-3 days

### Email Service
- [ ] **Email Alerts for Drift Detection**
  - [ ] Integrate SendGrid/AWS SES/Resend
  - [ ] Store admin email in Workspace model
  - [ ] Test email deliverability
  - [ ] Add unsubscribe mechanism
  - [ ] Email template testing (mobile/desktop)
  - **Priority**: P0
  - **Impact**: Core PRO feature
  - **Estimate**: 1-2 days
  - **File**: `app/services/monitoring.server.ts:65`

### Authentication
- [ ] **Slack OAuth Flow**
  - [ ] Implement Slack OAuth (Add to Slack button)
  - [ ] Store workspace tokens securely (encrypt in DB)
  - [ ] Handle token refresh
  - [ ] Add workspace team info capture
  - [ ] Session management
  - **Priority**: P0
  - **Impact**: Real workspace authorization
  - **Estimate**: 2 days

### Monitoring/Cron Setup
- [ ] **Production Cron Job**
  - [ ] Choose implementation: Vercel Cron, node-cron, BullMQ
  - [ ] Secure monitoring endpoint with secret token
  - [ ] Set up weekly schedule (Monday 9am)
  - [ ] Add retry logic for failed scans
  - [ ] Monitor job execution (logging/alerts)
  - **Priority**: P0
  - **Impact**: Drift detection won't work without this
  - **Estimate**: 1 day
  - **Reference**: `MONITORING_SETUP.md`

## 🐛 Known Issues / Bugs

### High Priority
- [ ] **Prisma Client Not Generated**
  - **Issue**: Type checking fails, needs `npm install` + `npm run db:generate`
  - **Fix**: Add to README setup instructions
  - **Priority**: P1
  - **Effort**: 5 minutes

- [ ] **CSV Export - Special Characters**
  - **Issue**: App names with quotes may break CSV formatting
  - **Fix**: Proper CSV escaping (replace `"` with `""`)
  - **Priority**: P1
  - **File**: `app/routes/export-csv.tsx:36`
  - **Effort**: 10 minutes

- [ ] **Error Handling - Slack API Failures**
  - **Issue**: No retry logic if Slack API is down
  - **Fix**: Add exponential backoff retry (3 attempts)
  - **Priority**: P1
  - **File**: `app/services/scanner.server.ts:33`
  - **Effort**: 30 minutes

### Medium Priority
- [ ] **Drift Detection - First Scan False Positives**
  - **Issue**: First scan marks all apps as "new" classic apps
  - **Fix**: Skip drift detection if no previous scan exists
  - **Priority**: P2
  - **File**: `app/services/scanner.server.ts:187`
  - **Effort**: 15 minutes

- [ ] **Dashboard - Loading State**
  - **Issue**: No loading indicator during scan
  - **Fix**: Add Remix `useNavigation()` loading state
  - **Priority**: P2
  - **File**: `app/routes/dashboard.tsx`
  - **Effort**: 20 minutes

- [ ] **Timezone Handling**
  - **Issue**: Scan dates stored as UTC, may confuse users
  - **Fix**: Display dates in workspace timezone
  - **Priority**: P2
  - **Effort**: 1 hour

## 🎨 UI/UX Improvements

### High Priority
- [ ] **Trend Chart (Line Graph)**
  - **Feature**: Visualize Classic app count over time
  - **Implementation**: Chart.js or Recharts
  - **Value**: Shows migration progress → justifies subscription
  - **Priority**: P1
  - **File**: New component `app/components/Dashboard/TrendChart.tsx`
  - **Estimate**: 4 hours

- [ ] **Toast Notifications**
  - **Feature**: Success/error toasts for actions (scan started, upgrade complete)
  - **Implementation**: Sonner or React Hot Toast
  - **Priority**: P1
  - **Estimate**: 1 hour

- [ ] **Skeleton Loaders**
  - **Feature**: Replace loading states with skeletons
  - **Value**: Better perceived performance
  - **Priority**: P2
  - **Estimate**: 2 hours

### Medium Priority
- [ ] **Dark Mode**
  - **Feature**: Toggle dark/light theme
  - **Implementation**: Tailwind dark mode classes
  - **Priority**: P2
  - **Estimate**: 3 hours

- [ ] **Mobile Responsive Improvements**
  - **Issue**: Table overflow on mobile
  - **Fix**: Card-based layout for mobile
  - **Priority**: P2
  - **Estimate**: 2 hours

- [ ] **App Detail Modal**
  - **Feature**: Click app name → modal with full scope details, migration guide
  - **Value**: Educational, helps users fix apps
  - **Priority**: P2
  - **Estimate**: 3 hours

## 🚀 Feature Requests

### High Value Features
- [ ] **Migration Guides (In-App Documentation)**
  - **Feature**: Per-app migration instructions
  - **Example**: "Replace `bot` scope with `chat:write` + `users:read`"
  - **Value**: Helps users actually fix their apps
  - **Priority**: P1
  - **Estimate**: 1 week (content creation)

- [ ] **Slack Bot Integration**
  - **Feature**: Send alerts directly in Slack (#it-ops channel)
  - **Value**: Users stay in their workflow
  - **Priority**: P1
  - **Estimate**: 3 days

- [ ] **Team Collaboration (Multi-User)**
  - **Feature**: Invite team members, role-based permissions
  - **Roles**: Admin, Viewer
  - **Value**: Enterprise appeal
  - **Priority**: P1
  - **Estimate**: 1 week

- [ ] **Workspace Comparison**
  - **Feature**: Multi-workspace dashboard for enterprises
  - **Value**: MSP/Enterprise customers managing multiple workspaces
  - **Priority**: P2
  - **Estimate**: 1 week

### Future Enhancements
- [ ] **API Access (REST API)**
  - **Feature**: Programmatic access to scan data
  - **Value**: Enterprise customers, integrations
  - **Priority**: P3
  - **Estimate**: 1 week

- [ ] **Webhook Notifications**
  - **Feature**: POST to customer URL on drift detection
  - **Value**: Integration with PagerDuty, Slack, etc.
  - **Priority**: P3
  - **Estimate**: 2 days

- [ ] **Custom Branding (White-Label)**
  - **Feature**: Enterprise plan with custom logo/colors
  - **Value**: Agency/MSP customers
  - **Priority**: P3
  - **Estimate**: 3 days

- [ ] **Scheduled Scans**
  - **Feature**: User-configurable scan frequency (daily, weekly, monthly)
  - **Value**: Flexibility
  - **Priority**: P3
  - **Estimate**: 2 days

## ⚡ Performance Optimizations

### Database
- [ ] **Connection Pooling**
  - **Current**: Using Prisma singleton (good)
  - **Improvement**: Configure pool size in DATABASE_URL
  - **Priority**: P2
  - **Estimate**: 10 minutes

- [ ] **Database Indexes**
  - **Current**: Only `workspaceId, scanDate` indexed on ScanHistory
  - **Add**: Index on `Workspace.subscriptionTier` for monitoring queries
  - **Priority**: P2
  - **File**: `prisma/schema.prisma`
  - **Estimate**: 5 minutes

- [ ] **Query Optimization**
  - **Issue**: `getLatestScanResult` loads all apps, could be paginated
  - **Fix**: Add pagination to app list
  - **Priority**: P3
  - **Estimate**: 1 hour

### Caching
- [ ] **Redis Caching**
  - **Feature**: Cache scan results (1 hour TTL)
  - **Value**: Reduce database load
  - **Priority**: P3
  - **Estimate**: 1 day

- [ ] **Static Asset Optimization**
  - **Feature**: CDN for images, CSS chunking
  - **Value**: Faster page loads
  - **Priority**: P3
  - **Estimate**: 2 hours

## 🔒 Security Enhancements

### High Priority
- [ ] **Access Token Encryption**
  - **Current**: Stored as plaintext in database
  - **Fix**: Encrypt using `crypto` module or KMS
  - **Priority**: P0
  - **File**: `prisma/schema.prisma:14`
  - **Estimate**: 2 hours

- [ ] **Rate Limiting on Routes**
  - **Feature**: Prevent abuse of `/export-csv`, `/upgrade` endpoints
  - **Implementation**: `express-rate-limit` or Upstash
  - **Priority**: P1
  - **Estimate**: 1 hour

- [ ] **CSRF Protection**
  - **Feature**: CSRF tokens for forms
  - **Implementation**: Remix built-in or custom middleware
  - **Priority**: P1
  - **Estimate**: 1 hour

### Medium Priority
- [ ] **Content Security Policy (CSP)**
  - **Feature**: Add CSP headers
  - **Value**: XSS protection
  - **Priority**: P2
  - **Estimate**: 30 minutes

- [ ] **Audit Logging**
  - **Feature**: Log all admin actions (upgrade, export, scan)
  - **Value**: Compliance, debugging
  - **Priority**: P2
  - **Estimate**: 1 day

## 📊 Analytics & Monitoring

### High Priority
- [ ] **Error Tracking**
  - **Tool**: Sentry or LogRocket
  - **Value**: Catch production bugs
  - **Priority**: P1
  - **Estimate**: 2 hours

- [ ] **Conversion Tracking**
  - **Metrics**: FREE→PRO conversion rate, time-to-upgrade
  - **Tool**: PostHog or Mixpanel
  - **Priority**: P1
  - **Estimate**: 1 day

- [ ] **Usage Analytics**
  - **Metrics**: Scans/week, CSV exports, drift alerts sent
  - **Value**: Product insights
  - **Priority**: P2
  - **Estimate**: 1 day

### Medium Priority
- [ ] **Health Check Endpoint**
  - **Feature**: `/api/health` endpoint for uptime monitoring
  - **Checks**: Database connection, Slack API reachable
  - **Priority**: P2
  - **Estimate**: 30 minutes

- [ ] **Application Monitoring**
  - **Tool**: Datadog or New Relic
  - **Metrics**: Response times, memory usage
  - **Priority**: P3
  - **Estimate**: 1 day

## 📚 Documentation

- [ ] **API Documentation (if API built)**
  - **Tool**: Swagger/OpenAPI
  - **Priority**: P3

- [ ] **Video Onboarding**
  - **Feature**: Loom video showing how to use the platform
  - **Value**: Reduce support burden
  - **Priority**: P2
  - **Estimate**: 2 hours

- [ ] **FAQ Page**
  - **Questions**: "Why is my app marked Classic?", "How do I fix it?"
  - **Priority**: P2
  - **Estimate**: 3 hours

- [ ] **Changelog**
  - **Feature**: Public changelog (releases, features, fixes)
  - **Tool**: Markdown file or headlessui.com/changelog
  - **Priority**: P3
  - **Estimate**: 1 hour

## 🧪 Testing

- [ ] **Unit Tests**
  - **Coverage**: `isClassicApp()`, `detectDrift()`, `canWorkspaceScan()`
  - **Tool**: Vitest
  - **Priority**: P2
  - **Estimate**: 1 day

- [ ] **Integration Tests**
  - **Scenarios**: Full scan flow, subscription gating
  - **Tool**: Playwright or Cypress
  - **Priority**: P3
  - **Estimate**: 2 days

- [ ] **E2E Tests**
  - **Scenarios**: User journey from signup → scan → upgrade
  - **Priority**: P3
  - **Estimate**: 3 days

## 🎯 Growth/Marketing Features

- [ ] **Referral Program**
  - **Feature**: Give 1 month free for referrals
  - **Value**: Viral growth
  - **Priority**: P3
  - **Estimate**: 1 week

- [ ] **Public Success Metrics**
  - **Feature**: "X classic apps detected across Y workspaces"
  - **Value**: Social proof
  - **Priority**: P3
  - **Estimate**: 1 day

- [ ] **Slack App Directory Listing**
  - **Feature**: List in Slack App Directory
  - **Value**: Discovery
  - **Priority**: P2
  - **Estimate**: 1 day (approval time varies)

---

## 📋 Template for New Issues

```markdown
### [FEATURE/BUG] Title

- **Description**: What is the issue/feature?
- **Priority**: P0/P1/P2/P3
- **Impact**: Revenue/UX/Performance/Security
- **Estimate**: X hours/days
- **File(s)**: path/to/file.ts:line
- **Dependencies**: What needs to be done first?
- **Acceptance Criteria**: What defines "done"?
```

---

**Last Updated**: 2026-01-05
**Branch**: `claude/slackguard-lite-scanner-38Erz`
**Total Issues**: 65+
**Critical Path**: Stripe → Email → OAuth → Monitoring
