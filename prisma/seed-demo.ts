/**
 * Demo Seed Script - "The IT Nightmare Scenario"
 *
 * This script creates a realistic demo workspace with:
 * - Classic apps (the villains that will break in Nov 2026)
 * - Modern apps (the heroes)
 * - Edge cases (webhooks, slash commands, transitioning apps)
 * - Scan history showing drift over time
 *
 * Run with: tsx prisma/seed-demo.ts
 */

import { PrismaClient } from "@prisma/client";
import { encrypt } from "../app/lib/encryption.server";

const prisma = new PrismaClient();

async function main() {
  console.log("🎬 Setting the stage for the demo...\n");

  // Clean up existing demo data
  await prisma.workspace.deleteMany({
    where: { teamId: { startsWith: "T_DEMO_" } },
  });

  // Create demo workspace with encrypted mock token
  const mockToken = process.env.ENCRYPTION_KEY
    ? encrypt("xoxb-demo-token-for-presentation")
    : "xoxb-demo-token-for-presentation";

  const workspace = await prisma.workspace.create({
    data: {
      teamId: "T_DEMO_ACME",
      name: "Acme Corp",
      accessToken: mockToken,
      adminEmail: "admin@acmecorp.com",
      subscriptionTier: "FREE",
      subscriptionStatus: "ACTIVE",
      hasUsedFreeScan: true, // Already used free scan
      stripeCustomerId: "cus_demo_stripe_customer",
    },
  });

  console.log(`✅ Created demo workspace: ${workspace.name}`);

  // ============================================================================
  // THE VILLAINS - Classic Apps That Will Break 💀
  // ============================================================================

  const classicApps = [
    {
      appId: "A_JENKINS_2015",
      appName: "Jenkins CI Bot (Legacy)",
      scopes: ["bot"],
      isClassic: true,
      addedAt: new Date("2015-03-15"), // Ancient app from 2015!
      serviceType: "custom_bot",
      status: "ACTIVE" as const,
    },
    {
      appId: "A_JIRA_OLD",
      appName: "JIRA Classic Connector",
      scopes: ["bot"],
      isClassic: true,
      addedAt: new Date("2017-08-22"),
      serviceType: "custom_bot",
      status: "ACTIVE" as const,
    },
    {
      appId: "A_LEGACY_DEPLOY",
      appName: "DeployBot (Deprecated)",
      scopes: ["bot"],
      isClassic: true,
      addedAt: new Date("2018-01-10"),
      serviceType: "custom_bot",
      status: "ACTIVE" as const,
    },
    {
      appId: "A_OLD_STANDUP",
      appName: "StandupBot v1",
      scopes: ["bot"],
      isClassic: true,
      addedAt: new Date("2019-06-05"),
      serviceType: "custom_bot",
      status: "ACTIVE" as const,
    },
  ];

  // ============================================================================
  // THE HEROES - Modern Apps That Are Safe ✨
  // ============================================================================

  const modernApps = [
    {
      appId: "A_PAGERDUTY_NEW",
      appName: "PagerDuty",
      scopes: ["chat:write", "commands", "users:read"],
      isClassic: false,
      addedAt: new Date("2023-05-20"),
      serviceType: "custom_bot",
      status: "ACTIVE" as const,
    },
    {
      appId: "A_ZOOM_MODERN",
      appName: "Zoom for Slack",
      scopes: ["chat:write", "chat:write.public", "commands"],
      isClassic: false,
      addedAt: new Date("2024-01-15"),
      serviceType: "custom_bot",
      status: "ACTIVE" as const,
    },
    {
      appId: "A_NOTION_NEW",
      appName: "Notion",
      scopes: ["channels:read", "chat:write", "commands"],
      isClassic: false,
      addedAt: new Date("2024-03-10"),
      serviceType: "custom_bot",
      status: "ACTIVE" as const,
    },
    {
      appId: "A_GITHUB_V2",
      appName: "GitHub for Slack",
      scopes: ["chat:write", "channels:read", "groups:read", "im:read"],
      isClassic: false,
      addedAt: new Date("2024-07-01"),
      serviceType: "custom_bot",
      status: "ACTIVE" as const,
    },
    {
      appId: "A_GOOGLE_DRIVE",
      appName: "Google Drive",
      scopes: ["chat:write", "files:read", "files:write"],
      isClassic: false,
      addedAt: new Date("2024-09-12"),
      serviceType: "custom_bot",
      status: "ACTIVE" as const,
    },
  ];

  // ============================================================================
  // EDGE CASES - Should Be Ignored/Classified Correctly 🤔
  // ============================================================================

  const edgeCaseApps = [
    {
      appId: "A_WEBHOOK_DEPLOY",
      appName: "Deploy Notification Webhook",
      scopes: ["incoming-webhook"],
      isClassic: false,
      addedAt: new Date("2022-11-15"),
      serviceType: "incoming-webhook",
      status: "ACTIVE" as const,
    },
    {
      appId: "A_SLASH_REMIND",
      appName: "/remind Command",
      scopes: ["commands"],
      isClassic: false,
      addedAt: new Date("2023-02-20"),
      serviceType: "slash_command",
      status: "ACTIVE" as const,
    },
  ];

  // ============================================================================
  // THE REMOVED APP - For Drift Detection Demo 🎭
  // ============================================================================

  const removedApp = {
    appId: "A_REMOVED_BOT",
    appName: "Old Marketing Bot (Removed)",
    scopes: ["bot"],
    isClassic: true,
    addedAt: new Date("2016-04-12"),
    serviceType: "custom_bot",
    status: "REMOVED" as const,
  };

  // Insert all apps
  const allApps = [...classicApps, ...modernApps, ...edgeCaseApps, removedApp];

  for (const app of allApps) {
    await prisma.installedApp.create({
      data: {
        workspaceId: workspace.id,
        ...app,
      },
    });
  }

  console.log(`✅ Created ${classicApps.length} Classic apps (THE VILLAINS 💀)`);
  console.log(`✅ Created ${modernApps.length} Modern apps (THE HEROES ✨)`);
  console.log(`✅ Created ${edgeCaseApps.length} Edge case apps (webhooks, slash commands)`);
  console.log(`✅ Created 1 Removed app (for drift detection demo)`);

  // ============================================================================
  // RISK AUDIT - Historical Audit Logs 📊
  // ============================================================================

  const today = new Date().toISOString().split("T")[0];
  await prisma.riskAudit.create({
    data: {
      workspaceId: workspace.id,
      idempotencyKey: `ws_${workspace.id}_${today}`,
      classicCount: classicApps.length,
      modernCount: modernApps.length + edgeCaseApps.length,
      scanDate: new Date(),
    },
  });

  console.log(`✅ Created risk audit for today`);

  // ============================================================================
  // SCAN HISTORY - Show Trend Over Time 📈
  // ============================================================================

  // 30 days ago: More classic apps (before cleanup started)
  await prisma.scanHistory.create({
    data: {
      workspaceId: workspace.id,
      classicCount: 6, // Had 6 classic apps before
      modernCount: 5,
      totalApps: 11,
      newClassicApps: [],
      removedApps: [],
      scanDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 15 days ago: Removed one classic app (progress!)
  await prisma.scanHistory.create({
    data: {
      workspaceId: workspace.id,
      classicCount: 5,
      modernCount: 5,
      totalApps: 10,
      newClassicApps: [],
      removedApps: ["A_REMOVED_BOT"], // Removed the marketing bot
      scanDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
  });

  // 7 days ago: Added new modern app
  await prisma.scanHistory.create({
    data: {
      workspaceId: workspace.id,
      classicCount: 4,
      modernCount: 6,
      totalApps: 10,
      newClassicApps: [],
      removedApps: [],
      scanDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Today: Current state
  await prisma.scanHistory.create({
    data: {
      workspaceId: workspace.id,
      classicCount: classicApps.length,
      modernCount: modernApps.length + edgeCaseApps.length,
      totalApps: classicApps.length + modernApps.length + edgeCaseApps.length,
      newClassicApps: [],
      removedApps: [],
      scanDate: new Date(),
    },
  });

  console.log(`✅ Created scan history (4 data points showing trend)`);

  // ============================================================================
  // CREATE A PRO DEMO WORKSPACE TOO 🌟
  // ============================================================================

  const proWorkspace = await prisma.workspace.create({
    data: {
      teamId: "T_DEMO_PRO",
      name: "TechCorp (PRO Demo)",
      accessToken: mockToken,
      adminEmail: "cto@techcorp.com",
      subscriptionTier: "PRO",
      subscriptionStatus: "ACTIVE",
      hasUsedFreeScan: true,
      stripeCustomerId: "cus_demo_pro_customer",
    },
  });

  // Add some apps to PRO workspace
  for (const app of [...classicApps.slice(0, 2), ...modernApps.slice(0, 3)]) {
    await prisma.installedApp.create({
      data: {
        workspaceId: proWorkspace.id,
        ...app,
      },
    });
  }

  console.log(`✅ Created PRO demo workspace: ${proWorkspace.name}`);

  // ============================================================================
  // SUMMARY 📋
  // ============================================================================

  console.log("\n🎭 DEMO STAGE IS SET! 🎭\n");
  console.log("═══════════════════════════════════════════════════");
  console.log(`FREE Tier Workspace: ${workspace.name}`);
  console.log(`  ID: ${workspace.id}`);
  console.log(`  Team ID: ${workspace.teamId}`);
  console.log(`  📊 Status: ${classicApps.length} Classic (Red) | ${modernApps.length} Modern (Green)`);
  console.log(`  🎯 Demo URLs:`);
  console.log(`     Dashboard: http://localhost:3000/dashboard?workspaceId=${workspace.id}`);
  console.log(`     Upgrade:   http://localhost:3000/upgrade?workspaceId=${workspace.id}`);
  console.log(`     Export:    http://localhost:3000/export-csv?workspaceId=${workspace.id}`);
  console.log("═══════════════════════════════════════════════════");
  console.log(`PRO Tier Workspace: ${proWorkspace.name}`);
  console.log(`  ID: ${proWorkspace.id}`);
  console.log(`  📊 Full access to all features`);
  console.log(`  🎯 Demo URL:`);
  console.log(`     Dashboard: http://localhost:3000/dashboard?workspaceId=${proWorkspace.id}`);
  console.log("═══════════════════════════════════════════════════");
  console.log("\n💡 TIP: Use the FREE workspace to demo the upgrade flow!");
  console.log("💡 TIP: Use the PRO workspace to demo drift alerts and CSV export!");
  console.log("\n🎬 Ready for your 60-second trailer!\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
