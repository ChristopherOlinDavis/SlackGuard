import { PrismaClient } from "@prisma/client";
import type {
  SlackLogEntry,
  SlackIntegrationLogsResponse,
  ScanResult,
} from "~/types/domain";

const prisma = new PrismaClient();

/**
 * Delay utility for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch all integration logs with pagination and rate limiting
 */
async function fetchIntegrationLogs(
  accessToken: string
): Promise<SlackLogEntry[]> {
  const allLogs: SlackLogEntry[] = [];
  let currentPage = 1;
  let totalPages = 1;

  const RATE_LIMIT_DELAY = 3000; // 3 seconds between requests

  while (currentPage <= totalPages) {
    const url = new URL("https://slack.com/api/team.integrationLogs");
    url.searchParams.append("page", currentPage.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch integration logs: ${response.statusText}`
      );
    }

    const data: SlackIntegrationLogsResponse = await response.json();

    if (!data.ok) {
      throw new Error(
        `Slack API error: ${data.error || "Unknown error"}`
      );
    }

    allLogs.push(...data.logs);

    // Update pagination info
    if (data.paging) {
      totalPages = data.paging.pages;
    }

    // Rate limiting: delay before fetching next page
    if (currentPage < totalPages) {
      await delay(RATE_LIMIT_DELAY);
    }

    currentPage++;
  }

  return allLogs;
}

/**
 * Parse scopes and determine if app is Classic
 * Classic apps have the 'bot' scope
 */
function isClassicApp(scopeString: string | undefined): boolean {
  if (!scopeString) return false;

  const scopes = scopeString.split(",").map((s) => s.trim());
  return scopes.includes("bot");
}

/**
 * Parse scope string into array
 */
function parseScopes(scopeString: string | undefined): string[] {
  if (!scopeString) return [];
  return scopeString.split(",").map((s) => s.trim());
}

/**
 * Process logs and extract app information
 */
function processLogs(logs: SlackLogEntry[]): Map<string, {
  id: string;
  name: string;
  scopes: string[];
  isClassic: boolean;
  addedAt: Date;
  serviceType?: string;
  status: "ACTIVE" | "REMOVED";
}> {
  const apps = new Map<string, {
    id: string;
    name: string;
    scopes: string[];
    isClassic: boolean;
    addedAt: Date;
    serviceType?: string;
    status: "ACTIVE" | "REMOVED";
  }>();

  // Sort logs by date to process them chronologically
  const sortedLogs = logs.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const log of sortedLogs) {
    const appId = log.app_id || log.service_id;
    if (!appId) continue;

    const appName = log.app_type || log.service_type || "Unknown App";

    if (log.change_type === "added") {
      const scopes = parseScopes(log.scope);
      apps.set(appId, {
        id: appId,
        name: appName,
        scopes,
        isClassic: isClassicApp(log.scope),
        addedAt: new Date(log.date),
        serviceType: log.service_type,
        status: "ACTIVE",
      });
    } else if (log.change_type === "removed") {
      // Mark app as removed
      const existingApp = apps.get(appId);
      if (existingApp) {
        apps.set(appId, {
          ...existingApp,
          status: "REMOVED",
        });
      }
    }
  }

  return apps;
}

/**
 * Main scan function
 */
export async function scanWorkspace(workspaceId: string): Promise<ScanResult> {
  // Fetch workspace from database
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new Error(`Workspace not found: ${workspaceId}`);
  }

  // Fetch integration logs from Slack
  const logs = await fetchIntegrationLogs(workspace.accessToken);

  // Process logs to extract apps
  const processedApps = processLogs(logs);

  // Prepare data for database insertion
  const appsToInsert = Array.from(processedApps.values());

  // Use transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Upsert apps to database (idempotent)
    for (const app of appsToInsert) {
      await tx.installedApp.upsert({
        where: {
          workspaceId_appId: {
            workspaceId: workspace.id,
            appId: app.id,
          },
        },
        update: {
          appName: app.name,
          scopes: app.scopes,
          isClassic: app.isClassic,
          status: app.status,
          serviceType: app.serviceType,
        },
        create: {
          workspaceId: workspace.id,
          appId: app.id,
          appName: app.name,
          scopes: app.scopes,
          isClassic: app.isClassic,
          addedAt: app.addedAt,
          status: app.status,
          serviceType: app.serviceType,
        },
      });
    }
  });

  // Calculate metrics (only count ACTIVE apps)
  const activeApps = appsToInsert.filter((app) => app.status === "ACTIVE");
  const classicApps = activeApps.filter((app) => app.isClassic);
  const modernApps = activeApps.filter((app) => !app.isClassic);

  // Create audit record
  const today = new Date().toISOString().split("T")[0];
  const idempotencyKey = `ws_${workspaceId}_${today}`;

  await prisma.riskAudit.upsert({
    where: { idempotencyKey },
    update: {
      classicCount: classicApps.length,
      modernCount: modernApps.length,
    },
    create: {
      workspaceId: workspace.id,
      idempotencyKey,
      classicCount: classicApps.length,
      modernCount: modernApps.length,
    },
  });

  // Prepare scan result
  const scanResult: ScanResult = {
    classicApps: classicApps.length,
    modernApps: modernApps.length,
    apps: activeApps.map((app) => ({
      id: app.id,
      name: app.name,
      isClassic: app.isClassic,
      scopes: app.scopes,
    })),
  };

  return scanResult;
}

/**
 * Get latest scan result for a workspace
 */
export async function getLatestScanResult(
  workspaceId: string
): Promise<ScanResult | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      installedApps: {
        where: { status: "ACTIVE" },
      },
      riskAudits: {
        orderBy: { scanDate: "desc" },
        take: 1,
      },
    },
  });

  if (!workspace) {
    return null;
  }

  const latestAudit = workspace.riskAudits[0];

  if (!latestAudit) {
    return null;
  }

  return {
    classicApps: latestAudit.classicCount,
    modernApps: latestAudit.modernCount,
    apps: workspace.installedApps.map((app) => ({
      id: app.appId,
      name: app.appName,
      isClassic: app.isClassic,
      scopes: app.scopes,
    })),
  };
}
