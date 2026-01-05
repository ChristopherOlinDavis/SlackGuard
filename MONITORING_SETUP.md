# Monitoring & Background Jobs Setup

This document explains how to set up the **Drift Detection** monitoring system for SlackGuard PRO.

## Overview

The monitoring system scans all PRO workspaces weekly to detect:
- **New Classic Apps**: Apps that were recently installed with the deprecated `bot` scope
- **Removed Apps**: Apps that were uninstalled
- **Scope Changes**: Apps whose permissions changed

When drift is detected, the system sends email alerts to workspace admins.

## Implementation Options

### Option 1: Remix Action (Simple)

Create a scheduled action endpoint that can be called by external cron services like **Cron-Job.org** or **EasyCron**.

**File:** `app/routes/api.monitoring.ts`

```typescript
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { scheduledMonitoringJob } from "~/services/monitoring.server";

export async function action({ request }: ActionFunctionArgs) {
  // Verify secret token to prevent unauthorized access
  const authHeader = request.headers.get("Authorization");
  const expectedToken = process.env.MONITORING_SECRET_TOKEN;

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await scheduledMonitoringJob();
  return json(results);
}
```

**Environment Variable:**
```env
MONITORING_SECRET_TOKEN=your-secure-random-token
```

**Cron Setup:**
- URL: `https://your-app.com/api/monitoring`
- Method: POST
- Header: `Authorization: Bearer your-secure-random-token`
- Schedule: Weekly (e.g., every Monday at 9am)

### Option 2: Node.js Cron Job (node-cron)

Install `node-cron`:
```bash
npm install node-cron
```

**File:** `app/cron/scheduler.server.ts`

```typescript
import cron from "node-cron";
import { scheduledMonitoringJob } from "~/services/monitoring.server";

export function startMonitoringScheduler() {
  // Run every Monday at 9:00 AM
  cron.schedule("0 9 * * 1", async () => {
    console.log("[Cron] Running weekly monitoring job");
    await scheduledMonitoringJob();
  });

  console.log("[Cron] Monitoring scheduler started");
}
```

**Update:** `app/entry.server.tsx` (for production only)

```typescript
import { startMonitoringScheduler } from "./cron/scheduler.server";

if (process.env.NODE_ENV === "production") {
  startMonitoringScheduler();
}
```

### Option 3: External Task Queue (BullMQ + Redis)

For production-grade job management:

```bash
npm install bullmq ioredis
```

**File:** `app/jobs/monitoring.worker.ts`

```typescript
import { Worker, Queue } from "bullmq";
import { scheduledMonitoringJob } from "~/services/monitoring.server";

const queue = new Queue("monitoring", {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});

const worker = new Worker(
  "monitoring",
  async (job) => {
    console.log(`[Worker] Processing job ${job.id}`);
    return await scheduledMonitoringJob();
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
    },
  }
);

// Schedule weekly job
export async function scheduleWeeklyMonitoring() {
  await queue.add(
    "weekly-drift-scan",
    {},
    {
      repeat: {
        pattern: "0 9 * * 1", // Every Monday at 9am
      },
    }
  );
}
```

### Option 4: Vercel/Netlify Cron (Serverless)

**Vercel:**

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/monitoring",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

**Netlify:**

Create `netlify.toml`:
```toml
[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/api/monitoring"
  to = "/.netlify/functions/monitoring"
  status = 200

[dev]
  functions = "netlify/functions"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

## Email Service Integration

The monitoring system generates email alerts but needs integration with an email service.

### Recommended Email Providers

1. **SendGrid**
   ```bash
   npm install @sendgrid/mail
   ```

2. **AWS SES**
   ```bash
   npm install @aws-sdk/client-ses
   ```

3. **Resend** (Modern, developer-friendly)
   ```bash
   npm install resend
   ```

### Example Integration (SendGrid)

**File:** `app/services/email.server.ts`

```typescript
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await sgMail.send({
    to,
    from: "alerts@slackguard.com",
    subject,
    html,
  });
}
```

**Update** `app/services/monitoring.server.ts`:

```typescript
import { sendEmail } from "./email.server";

async function sendDriftAlert(...) {
  const emailContent = generateDriftAlertEmail(...);

  await sendEmail({
    to: workspaceAdmin.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });
}
```

## Testing the Monitoring System

### Manual Test

```bash
# Run the monitoring job manually
node -e "require('./app/services/monitoring.server.ts').scheduledMonitoringJob()"
```

### API Test

```bash
curl -X POST https://your-app.com/api/monitoring \
  -H "Authorization: Bearer your-secret-token"
```

## Production Checklist

- [ ] Choose and implement a cron/scheduling solution
- [ ] Set up email service (SendGrid, AWS SES, or Resend)
- [ ] Configure `MONITORING_SECRET_TOKEN` environment variable
- [ ] Test drift detection with a sample workspace
- [ ] Set up error logging/monitoring (Sentry, LogRocket)
- [ ] Configure retry logic for failed scans
- [ ] Set up dead letter queue for failed jobs (if using BullMQ)
- [ ] Add monitoring dashboard to track job execution

## Scaling Considerations

For large deployments:

1. **Rate Limiting**: Respect Slack API rate limits (20 req/min for Tier 2)
2. **Batching**: Process workspaces in batches to avoid memory issues
3. **Parallel Processing**: Use worker pools for concurrent scans
4. **Error Handling**: Implement exponential backoff for failed scans
5. **Database Connection Pooling**: Configure Prisma connection limits

## Security Notes

- Store the `MONITORING_SECRET_TOKEN` securely (use secret manager)
- Validate webhook signatures if using external cron services
- Implement rate limiting on the monitoring endpoint
- Log all monitoring job executions for audit trail
