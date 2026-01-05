# 🎬 SlackGuard Demo Guide

This guide will help you create a **killer 60-second demo video** that converts viewers into users.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Phase 1: Stage Manager Test](#phase-1-stage-manager-test)
- [Phase 2: Glossy Polish](#phase-2-glossy-polish)
- [Phase 3: The Recording](#phase-3-the-recording)
- [Recording Tools](#recording-tools)
- [Editing Tips](#editing-tips)

---

## 🚀 Quick Start

```bash
# 1. Set up demo data
npm run demo:seed

# 2. Start the dev server
npm run dev

# 3. Open demo landing page
npm run demo:open
# Or manually: http://localhost:3000/demo

# 4. You're ready to record!
```

---

## Phase 1: Stage Manager Test (Local Validation)

### The Problem with Real Data

Real Slack workspaces are often boring or sparse for demos. You need **dramatic, story-driven data** that shows the problem (Red) and the solution (Green) clearly.

### Solution: Demo Seed Script

The `seed-demo.ts` script creates two perfect demo workspaces:

**1. Acme Corp (FREE Tier)**
- **The Villain**: 4 Classic apps from 2015-2019 (Jenkins Bot, JIRA Classic, etc.)
- **The Hero**: 5 Modern apps with granular scopes (PagerDuty, Zoom, GitHub, etc.)
- **The Edge Cases**: Webhooks and slash commands (correctly ignored)
- **The Story**: Shows a workspace that needs cleanup before Nov 2026

**2. TechCorp (PRO Tier)**
- Full feature access
- CSV export enabled
- Drift detection and email alerts active
- Perfect for showing the "after upgrade" experience

### What Gets Created

```
📊 Demo Data Summary:
├── 2 Workspaces (FREE and PRO)
├── 11 Apps per workspace
│   ├── 4 Classic Apps (Red) - The villains 💀
│   ├── 5 Modern Apps (Green) - The heroes ✨
│   ├── 2 Edge Cases (webhooks, slash commands)
│   └── 1 Removed App (for drift detection)
├── Risk Audit (today's scan results)
└── Scan History (4 data points showing trend)
```

### Testing the OAuth Flow (Optional)

If you want to demo real OAuth integration:

```bash
# 1. Install ngrok (or use localtunnel)
brew install ngrok  # Mac
# or
npm install -g localtunnel

# 2. Expose localhost to the internet
ngrok http 3000
# Note the public URL: https://abc123.ngrok.io

# 3. Configure Slack App
# - Go to https://api.slack.com/apps
# - Set Redirect URL: https://abc123.ngrok.io/auth/slack/callback
# - Copy Client ID and Secret to .env

# 4. Test the flow
# Navigate to: https://abc123.ngrok.io/auth/slack/install
```

**For most demos, skip this step.** The seeded data is perfect for recording.

---

## Phase 2: Glossy Polish

### Pre-Recording Checklist

**Browser Cleanup:**
- ✅ Clear browsing history
- ✅ Hide bookmarks bar (⌘+Shift+B on Mac)
- ✅ Close unnecessary tabs
- ✅ Use incognito/private mode (fresh start)

**Desktop Cleanup:**
- ✅ Close all unnecessary apps
- ✅ Enable Do Not Disturb mode
- ✅ Hide desktop icons (if visible in recording)
- ✅ Set wallpaper to neutral color (less distracting)

**Audio Setup:**
- ✅ Test microphone levels
- ✅ Use a quiet room
- ✅ Consider background music (subtle, royalty-free)

### UI Features Already Built-In

The demo is pre-polished with these features:

1. **🚨 Animated 2026 Badge**: Red card has a pulsing "EOL: Nov 16, 2026" badge
2. **⏱️ Realistic Scan Delay**: 1.5-second delay makes scans feel substantial
3. **🔒 Blurred Names**: FREE tier automatically blurs app names (freemium hook)
4. **🎨 Traffic Light Design**: Red/Green cards are instantly understandable

---

## Phase 3: The Recording

### The 60-Second Script

**Target Length:** 55-65 seconds (YouTube shorts max: 60s)

**Structure:**

| Time | Section | Script | Visual |
|------|---------|--------|--------|
| **0:00-0:10** | **The Hook** | "On November 16, 2026, Slack breaks all legacy bot apps. Do you know which of your 500 integrations will stop working?" | Screen showing the demo homepage or dashboard with the 2026 badge visible |
| **0:10-0:25** | **The Action** | "SlackGuard scans your entire integration log in seconds." | Click "Scan Workspace" → Show loading spinner (1.5s) → Traffic light appears |
| **0:25-0:40** | **The Reveal** | "It instantly separates Modern apps from Legacy apps. Here we see 'Jenkins Bot' from 2015 is using a deprecated scope." | Pan over the Red card (4 Classic Apps) and Green card (5 Modern Apps) |
| **0:40-0:50** | **The Solution** | "Click 'Export Report' to get a CSV for your engineering team to fix it." | Show CSV export in action (download animation) |
| **0:50-0:60** | **The Close** | "Don't wait for the blackout. Scan your workspace for free today at SlackGuard.dev" | Show upgrade page with pricing or FREE scan CTA |

### Camera Movement Guide

Use these techniques to keep the video dynamic:

1. **Zoom In**: When clicking important buttons (Scan, Export, Upgrade)
2. **Slow Pan**: When revealing the Traffic Light cards (Red → Green)
3. **Quick Cut**: Between different pages (Dashboard → Upgrade)
4. **Cursor Trails**: If using Screen Studio, enable cursor highlighting

---

## Recording Tools

### 1. Screen Studio (Mac) - **RECOMMENDED** 💎

**Price:** $89 one-time
**Why:** Auto-zooms on clicks, cursor highlighting, professional export
**Best For:** Final product demos, investor pitches

```bash
# Install
brew install --cask screen-studio

# Settings to enable:
- Auto-zoom on clicks: ✅
- Cursor highlighting: ✅
- Background blur: ✅
- Export resolution: 1080p or 4K
```

### 2. OBS Studio (Free) 🎥

**Price:** Free
**Why:** Open-source, powerful, cross-platform
**Best For:** Live demos, webinars, technical presentations

```bash
# Install
brew install --cask obs  # Mac
# or download from https://obsproject.com

# Recommended settings:
- Canvas resolution: 1920x1080
- Output: MP4 (H.264)
- Bitrate: 4500 kbps
```

### 3. Loom (Easy) 🎬

**Price:** Free (up to 25 videos)
**Why:** Browser-based, instant sharing
**Best For:** Quick internal demos, team presentations

```bash
# Install browser extension:
https://chrome.google.com/webstore/detail/loom

# Use for:
- Internal team demos
- Quick investor updates
- User feedback sessions
```

### 4. QuickTime (Mac Built-in) 📹

**Price:** Free (comes with Mac)
**Why:** Simple, no setup required
**Best For:** Basic screen recordings

```bash
# Record:
⌘ + Shift + 5  # Opens screenshot/recording toolbar
```

---

## Editing Tips

### Video Editing Software

**DaVinci Resolve (Free):**
- Professional color grading
- Free version is feature-complete
- Best for: Final polish

**iMovie (Mac, Free):**
- Simple, intuitive interface
- Best for: Quick edits

**CapCut (Free):**
- Mobile-friendly
- Auto-captions
- Best for: Social media videos

### Editing Checklist

**Speed Adjustments:**
- ✅ Speed up typing/navigation (1.5x-2x)
- ✅ Slow down key moments (0.5x-0.75x)
  - Traffic light reveal
  - CSV export button click
  - Upgrade page appearance

**Enhancements:**
- ✅ Add subtle zoom when showing Red/Green cards
- ✅ Add text overlays for key numbers ("4 Classic Apps")
- ✅ Add arrow annotations pointing to the 2026 badge
- ✅ Add background music (keep it subtle, around 20% volume)

**Audio:**
- ✅ Record voiceover separately (cleaner audio)
- ✅ Remove background noise (use Audacity/Adobe Audition)
- ✅ Normalize audio levels
- ✅ Add subtle sound effects for clicks (optional)

**Captions:**
- ✅ Add auto-generated captions (CapCut or YouTube)
- ✅ Manually fix any errors
- ✅ Use large, readable font

---

## Demo URLs Cheatsheet

```bash
# Demo landing page (start here!)
http://localhost:3000/demo

# FREE Tier Workspace
Dashboard:  http://localhost:3000/dashboard?workspaceId=<FREE_WORKSPACE_ID>
Upgrade:    http://localhost:3000/upgrade?workspaceId=<FREE_WORKSPACE_ID>

# PRO Tier Workspace
Dashboard:  http://localhost:3000/dashboard?workspaceId=<PRO_WORKSPACE_ID>
CSV Export: http://localhost:3000/export-csv?workspaceId=<PRO_WORKSPACE_ID>

# OAuth Flow (if testing with real Slack)
Install:    http://localhost:3000/auth/slack/install
```

**Tip:** The demo landing page shows the actual workspace IDs and provides quick links. Just run `npm run demo:seed` and visit `/demo`!

---

## Recording Day Workflow

### 1 Hour Before Recording

```bash
# 1. Refresh demo data (clean slate)
npm run demo:seed

# 2. Start dev server
npm run dev

# 3. Open demo page and test all flows
open http://localhost:3000/demo
```

### During Recording

1. **Take 1-3 practice runs** to memorize the flow
2. **Record 3-5 takes** (you'll pick the best one)
3. **Keep the energy high** (even if it's just voiceover)
4. **Don't stop for small mistakes** (fix in editing)

### After Recording

1. **Watch the raw footage** (take notes on what to fix)
2. **Pick the best take** (or combine multiple takes)
3. **Edit ruthlessly** (every second counts in a 60s video)
4. **Get feedback** (show to 2-3 people before publishing)

---

## Distribution Checklist

Once you have the perfect 60-second video:

**YouTube:**
- ✅ Upload as YouTube Short (vertical or square format)
- ✅ Title: "Slack is breaking legacy apps in Nov 2026 😱"
- ✅ Description: Include link to SlackGuard
- ✅ Tags: slack, saas, compliance, devops, it-management

**Twitter/X:**
- ✅ Upload directly (native video gets more engagement)
- ✅ Tweet: "In 9 months, Slack breaks all legacy bot apps. Here's how to find yours in 10 seconds 🧵"

**LinkedIn:**
- ✅ Target IT managers and CTOs
- ✅ Post during business hours (Tuesday-Thursday, 9-11am)

**Product Hunt:**
- ✅ Include video in launch post
- ✅ Schedule launch for Tuesday-Thursday (best days)

**Hacker News:**
- ✅ Submit as "Show HN: Tool to scan Slack workspaces for deprecated apps"
- ✅ Include video in comments

---

## Troubleshooting

### "Demo workspaces not showing in /demo"

```bash
# Re-run the seed script
npm run demo:seed
```

### "Scan is too fast / too slow"

Edit the delay in `app/services/scanner.server.ts`:

```typescript
const REALISTIC_SCAN_DELAY = 1500; // Adjust this value (milliseconds)
```

### "I want to re-record without reseeding"

The demo data persists until you:
- Run `npm run demo:seed` again (replaces existing data)
- Run `npm run db:reset` (clears entire database)

---

## Final Tips for a Killer Demo

1. **Show, don't tell**: Less talking, more visual action
2. **Focus on the problem**: "Your apps will break" is more compelling than "Here's a cool feature"
3. **Use real-world examples**: "Jenkins Bot from 2015" feels tangible
4. **Create urgency**: "November 2026" is a deadline that matters
5. **Make it shareable**: 60 seconds is the perfect length for social media

---

**Need help?** Open an issue on GitHub or contact support@slackguard.dev

**Ready to record?** Run `npm run demo:seed` and let's make a killer demo! 🎬
