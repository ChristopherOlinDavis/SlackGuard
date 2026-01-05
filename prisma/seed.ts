import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo workspaces
  const freeWorkspace = await prisma.workspace.upsert({
    where: { teamId: "T01234FREE" },
    update: {},
    create: {
      teamId: "T01234FREE",
      name: "Demo FREE Workspace",
      accessToken: "xoxp-demo-free-token-DO-NOT-USE-IN-PRODUCTION",
      subscriptionTier: "FREE",
      subscriptionStatus: "ACTIVE",
      hasUsedFreeScan: false,
    },
  });

  const proWorkspace = await prisma.workspace.upsert({
    where: { teamId: "T01234PRO" },
    update: {},
    create: {
      teamId: "T01234PRO",
      name: "Demo PRO Workspace",
      accessToken: "xoxp-demo-pro-token-DO-NOT-USE-IN-PRODUCTION",
      subscriptionTier: "PRO",
      subscriptionStatus: "ACTIVE",
      hasUsedFreeScan: true,
    },
  });

  console.log("✅ Created workspaces:", {
    free: freeWorkspace.id,
    pro: proWorkspace.id,
  });

  // Create sample apps for demo workspaces
  const classicApp1 = await prisma.installedApp.upsert({
    where: {
      workspaceId_appId: {
        workspaceId: freeWorkspace.id,
        appId: "A01CLASSIC1",
      },
    },
    update: {},
    create: {
      workspaceId: freeWorkspace.id,
      appId: "A01CLASSIC1",
      appName: "Legacy Bot App",
      scopes: ["bot", "incoming-webhook"],
      isClassic: true,
      status: "ACTIVE",
      addedAt: new Date("2023-01-15"),
    },
  });

  const classicApp2 = await prisma.installedApp.upsert({
    where: {
      workspaceId_appId: {
        workspaceId: freeWorkspace.id,
        appId: "A02CLASSIC2",
      },
    },
    update: {},
    create: {
      workspaceId: freeWorkspace.id,
      appId: "A02CLASSIC2",
      appName: "Old Notification Service",
      scopes: ["bot"],
      isClassic: true,
      status: "ACTIVE",
      addedAt: new Date("2022-06-20"),
    },
  });

  const modernApp1 = await prisma.installedApp.upsert({
    where: {
      workspaceId_appId: {
        workspaceId: freeWorkspace.id,
        appId: "A03MODERN1",
      },
    },
    update: {},
    create: {
      workspaceId: freeWorkspace.id,
      appId: "A03MODERN1",
      appName: "Modern Chat Bot",
      scopes: ["chat:write", "users:read", "channels:read"],
      isClassic: false,
      status: "ACTIVE",
      addedAt: new Date("2024-03-10"),
    },
  });

  const modernApp2 = await prisma.installedApp.upsert({
    where: {
      workspaceId_appId: {
        workspaceId: freeWorkspace.id,
        appId: "A04MODERN2",
      },
    },
    update: {},
    create: {
      workspaceId: freeWorkspace.id,
      appId: "A04MODERN2",
      appName: "Analytics Dashboard",
      scopes: ["users:read", "channels:read", "team:read"],
      isClassic: false,
      status: "ACTIVE",
      addedAt: new Date("2024-08-05"),
    },
  });

  // Add more apps to PRO workspace
  await prisma.installedApp.createMany({
    data: [
      {
        workspaceId: proWorkspace.id,
        appId: "A05CLASSIC3",
        appName: "Legacy Integration Service",
        scopes: ["bot"],
        isClassic: true,
        status: "ACTIVE",
        addedAt: new Date("2021-12-01"),
      },
      {
        workspaceId: proWorkspace.id,
        appId: "A06MODERN3",
        appName: "Workflow Automation",
        scopes: ["chat:write", "files:write", "users:read"],
        isClassic: false,
        status: "ACTIVE",
        addedAt: new Date("2024-05-15"),
      },
      {
        workspaceId: proWorkspace.id,
        appId: "A07MODERN4",
        appName: "Team Calendar",
        scopes: ["channels:read", "users:read"],
        isClassic: false,
        status: "ACTIVE",
        addedAt: new Date("2024-09-20"),
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Created sample apps");

  // Create risk audits
  const today = new Date().toISOString().split("T")[0];

  await prisma.riskAudit.upsert({
    where: { idempotencyKey: `ws_${freeWorkspace.id}_${today}` },
    update: {},
    create: {
      workspaceId: freeWorkspace.id,
      idempotencyKey: `ws_${freeWorkspace.id}_${today}`,
      classicCount: 2,
      modernCount: 2,
      scanDate: new Date(),
    },
  });

  await prisma.riskAudit.upsert({
    where: { idempotencyKey: `ws_${proWorkspace.id}_${today}` },
    update: {},
    create: {
      workspaceId: proWorkspace.id,
      idempotencyKey: `ws_${proWorkspace.id}_${today}`,
      classicCount: 1,
      modernCount: 2,
      scanDate: new Date(),
    },
  });

  console.log("✅ Created risk audits");

  // Create scan history for trend visualization
  const dates = [
    new Date("2025-12-01"),
    new Date("2025-12-08"),
    new Date("2025-12-15"),
    new Date("2025-12-22"),
    new Date("2025-12-29"),
  ];

  for (let i = 0; i < dates.length; i++) {
    await prisma.scanHistory.create({
      data: {
        workspaceId: proWorkspace.id,
        classicCount: 5 - i, // Decreasing trend
        modernCount: i + 2, // Increasing trend
        totalApps: 7,
        newClassicApps: i === 1 ? ["A05CLASSIC3"] : [],
        removedApps: i === 2 ? ["A99REMOVED"] : [],
        scanDate: dates[i],
      },
    });
  }

  console.log("✅ Created scan history (trend data)");

  console.log("\n🎉 Database seeding complete!");
  console.log("\n📊 Demo Workspaces:");
  console.log(`   FREE: ${freeWorkspace.id} (Team: ${freeWorkspace.teamId})`);
  console.log(`   PRO:  ${proWorkspace.id} (Team: ${proWorkspace.teamId})`);
  console.log("\n🔗 Test URLs:");
  console.log(
    `   FREE Dashboard: http://localhost:3000/dashboard?workspaceId=${freeWorkspace.id}`
  );
  console.log(
    `   PRO Dashboard:  http://localhost:3000/dashboard?workspaceId=${proWorkspace.id}`
  );
  console.log(
    `   Upgrade Flow:   http://localhost:3000/upgrade?workspaceId=${freeWorkspace.id}`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
