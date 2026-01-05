# SlackGuard - Deployment Guide

Complete guide for deploying SlackGuard to production.

## 🎯 Deployment Checklist

Before deploying to production, ensure:

- [ ] Stripe integration complete
- [ ] Email service configured
- [ ] Slack OAuth implemented
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Access tokens encrypted
- [ ] Rate limiting enabled
- [ ] Error tracking configured (Sentry)
- [ ] SSL/TLS certificates configured
- [ ] Monitoring cron job set up

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Remix)

**Pros**: Easy deployment, serverless, built-in CDN
**Cons**: Requires serverless-compatible database (connection pooling)

#### Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Configure Database**
   - Use connection pooling (PgBouncer or Prisma Data Proxy)
   - Update `DATABASE_URL` with connection pooler URL

3. **Environment Variables**
   ```bash
   vercel env add DATABASE_URL production
   vercel env add SESSION_SECRET production
   vercel env add STRIPE_SECRET_KEY production
   # ... add all from .env.example
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

5. **Set up Cron Jobs**

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

6. **Database Migrations**
   ```bash
   # Run once after deploy
   npx prisma migrate deploy
   ```

### Option 2: Railway

**Pros**: Built-in PostgreSQL, easy database management
**Cons**: Less mature than Vercel

#### Setup

1. **Create Railway Account**
   - Visit railway.app

2. **Create New Project**
   - Connect GitHub repository
   - Add PostgreSQL service

3. **Configure Environment**
   - Railway auto-populates `DATABASE_URL`
   - Add other variables from `.env.example`

4. **Deploy**
   - Push to GitHub main branch
   - Railway auto-deploys

5. **Run Migrations**
   ```bash
   railway run npx prisma migrate deploy
   ```

### Option 3: Fly.io

**Pros**: Full control, supports long-running processes
**Cons**: More complex setup

#### Setup

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Initialize App**
   ```bash
   fly launch
   ```

3. **Add PostgreSQL**
   ```bash
   fly postgres create
   fly postgres attach <postgres-app-name>
   ```

4. **Set Environment Variables**
   ```bash
   fly secrets set SESSION_SECRET=xxx
   fly secrets set STRIPE_SECRET_KEY=xxx
   # ... etc
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

6. **Scale**
   ```bash
   fly scale count 2  # For high availability
   ```

### Option 4: Self-Hosted (VPS/Docker)

**Pros**: Full control, cost-effective at scale
**Cons**: More maintenance

#### Setup

**Prerequisites**:
- Ubuntu 22.04 LTS
- Docker & Docker Compose
- Nginx (reverse proxy)

1. **Create `Dockerfile`**
   ```dockerfile
   FROM node:20-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .
   RUN npm run build
   RUN npx prisma generate

   EXPOSE 3000

   CMD ["npm", "start"]
   ```

2. **Create `docker-compose.yml`**
   ```yaml
   version: '3.8'

   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=postgresql://user:pass@db:5432/slackguard
         - NODE_ENV=production
       env_file:
         - .env
       depends_on:
         - db

     db:
       image: postgres:14
       environment:
         POSTGRES_DB: slackguard
         POSTGRES_USER: user
         POSTGRES_PASSWORD: strongpassword
       volumes:
         - postgres_data:/var/lib/postgresql/data

   volumes:
     postgres_data:
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name slackguard.example.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **SSL with Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d slackguard.example.com
   ```

5. **Deploy**
   ```bash
   docker-compose up -d
   ```

6. **Cron Job for Monitoring**
   ```bash
   crontab -e

   # Add:
   0 9 * * 1 curl -X POST http://localhost:3000/api/monitoring \
     -H "Authorization: Bearer $MONITORING_SECRET_TOKEN"
   ```

## 🔒 Environment Configuration

### Production Environment Variables

**Critical**:
```env
NODE_ENV=production
APP_URL=https://slackguard.example.com
DATABASE_URL=postgresql://... (with SSL mode)
SESSION_SECRET=<64-char-random-string>
```

**Stripe**:
```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID_PRO=price_xxx
```

**Email** (choose one):
```env
# SendGrid
SENDGRID_API_KEY=SG.xxx

# OR AWS SES
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1

# OR Resend
RESEND_API_KEY=re_xxx
```

**Slack OAuth**:
```env
SLACK_CLIENT_ID=xxx.xxx
SLACK_CLIENT_SECRET=xxx
SLACK_SIGNING_SECRET=xxx
```

**Monitoring**:
```env
MONITORING_SECRET_TOKEN=<random-token>
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Generate Secure Secrets

```bash
# Session secret (64 characters)
openssl rand -base64 48

# Monitoring token (32 characters)
openssl rand -hex 32
```

## 📊 Database Setup

### Initial Migration

```bash
# Development
npm run db:push

# Production (recommended)
npx prisma migrate deploy
```

### Database Connection Pooling

For serverless (Vercel):
```env
# Use Prisma Data Proxy or PgBouncer
DATABASE_URL="postgresql://user:pass@pooler.example.com/db?pgbouncer=true&connection_limit=1"
```

### Database Backups

**Automated Backups** (Railway/Fly.io):
- Built-in daily backups

**Self-Hosted**:
```bash
# Daily backup cron
0 2 * * * pg_dump slackguard > /backups/slackguard-$(date +\%Y\%m\%d).sql
```

## 🔍 Monitoring Setup

### Health Checks

Create `/app/routes/api.health.tsx`:
```typescript
import { json } from "@remix-run/node";
import { prisma } from "~/lib/prisma.server";

export async function loader() {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    return json({ status: "healthy", timestamp: new Date().toISOString() });
  } catch (error) {
    return json(
      { status: "unhealthy", error: "Database connection failed" },
      { status: 503 }
    );
  }
}
```

### Uptime Monitoring

**Options**:
- UptimeRobot (free)
- Pingdom
- Better Stack

Monitor:
- `https://your-app.com/api/health` every 5 minutes

### Error Tracking (Sentry)

1. **Install Sentry**
   ```bash
   npm install @sentry/remix
   ```

2. **Configure** (see Sentry docs for Remix integration)

## 🚦 Performance Optimization

### Production Build

```bash
# Build optimized bundle
npm run build

# Check bundle size
du -sh build/
```

### CDN Configuration

For static assets:
- Use Vercel Edge Network (automatic)
- Or CloudFlare CDN

### Database Optimizations

```sql
-- Add indexes (already in schema.prisma)
CREATE INDEX idx_scan_history_workspace_date
  ON "ScanHistory"(workspaceId, scanDate);

-- Connection pooling
ALTER SYSTEM SET max_connections = 100;
```

## 🔐 Security Hardening

### SSL/TLS

- **Vercel**: Automatic
- **Self-hosted**: Use Certbot (Let's Encrypt)

### Security Headers

Add to `app/entry.server.tsx`:
```typescript
responseHeaders.set("X-Frame-Options", "DENY");
responseHeaders.set("X-Content-Type-Options", "nosniff");
responseHeaders.set("Referrer-Policy", "no-referrer");
responseHeaders.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
```

### Rate Limiting

```bash
npm install express-rate-limit
```

See ENHANCEMENTS.md for implementation.

## 📈 Scaling Considerations

### Horizontal Scaling

- **Vercel**: Automatic
- **Fly.io**: `fly scale count 3`
- **Self-hosted**: Add load balancer (Nginx, HAProxy)

### Database Scaling

- **Read Replicas**: For heavy read workloads
- **Connection Pooling**: PgBouncer
- **Caching**: Redis for scan results

## 🐛 Troubleshooting

### Build Failures

```bash
# Clear build cache
rm -rf build/ node_modules/
npm install
npm run build
```

### Database Connection Issues

- Check `DATABASE_URL` format
- Verify SSL mode: `?sslmode=require`
- Test connection: `npx prisma db pull`

### Prisma Errors

```bash
# Regenerate client
npx prisma generate

# Reset database (DANGER)
npx prisma db push --force-reset
```

## 📞 Post-Deployment

### Verification Checklist

- [ ] App loads at production URL
- [ ] Database migrations applied
- [ ] Can create FREE workspace
- [ ] FREE scan works
- [ ] Upgrade flow works (with Stripe test mode)
- [ ] CSV export works for PRO
- [ ] Monitoring cron job runs
- [ ] Error tracking captures errors
- [ ] Email alerts send successfully
- [ ] SSL certificate valid

### Rollback Plan

```bash
# Vercel
vercel rollback

# Fly.io
fly releases
fly deploy --image <previous-image>

# Docker
docker-compose down
git checkout <previous-commit>
docker-compose up -d
```

---

**Last Updated**: 2026-01-05
**Production Status**: Demo mode (needs Stripe + Email integration)
**Recommended Platform**: Vercel (for Remix) or Railway (for simplicity)
