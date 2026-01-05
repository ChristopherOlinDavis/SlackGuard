import type {
  SlackLogEntry,
  SlackIntegrationLogsResponse,
  ScanResult,
} from "~/types/domain";
import { prisma } from "~/lib/prisma.server";
import { decrypt, isEncrypted } from "~/lib/encryption.server";
import { sendDriftAlertEmail, type DriftAlertData } from "~/lib/email.server";

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
  encryptedAccessToken: string
): Promise<SlackLogEntry[]> {
  // Decrypt the access token before use
  const accessToken = isEncrypted(encryptedAccessToken)
    ? decrypt(encryptedAccessToken)
    : encryptedAccessToken; // Fallback for migration period

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
 * Check if log entry should be ignored (false positive prevention)
 */
function shouldIgnoreApp(log: SlackLogEntry): boolean {
  // Ignore incoming webhooks (legacy but not the Nov 2026 target)
  if (log.service_type === "incoming-webhook") {
    return true;
  }

  // Ignore if scope is ONLY incoming-webhook
  if (log.scope === "incoming-webhook") {
    return true;
  }

  // Ignore if scope is ONLY commands (slash commands)
  if (log.scope === "commands") {
    return true;
  }

  return false;
}

/**
 * Parse scopes and determine if app is Classic
 * Classic apps have the 'bot' scope WITHOUT granular scopes
 * This reduces false positives for apps that are transitioning
 */
function isClassicApp(scopeString: string | undefined): boolean {
  if (!scopeString) return false;

  const scopes = scopeString.split(",").map((s) => s.trim());

  // Check if app has 'bot' scope
  const hasBotScope = scopes.includes("bot");

  if (!hasBotScope) return false;

  // List of granular OAuth scopes that indicate a modern app
  const granularScopes = [
    "chat:write",
    "chat:write.public",
    "chat:write.customize",
    "channels:read",
    "channels:write",
    "groups:read",
    "groups:write",
    "im:read",
    "im:write",
    "mpim:read",
    "mpim:write",
    "users:read",
    "users:read.email",
    "users:write",
    "team:read",
    "files:read",
    "files:write",
  ];

  // If the app has bot scope AND any granular scopes, it's transitioning (not purely classic)
  const hasGranularScopes = scopes.some((scope) => granularScopes.includes(scope));

  // Classic = has 'bot' scope WITHOUT granular scopes
  return hasBotScope && !hasGranularScopes;
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
    // Skip entries that should be ignored (webhooks, slash commands, etc.)
    if (shouldIgnoreApp(log)) {
      continue;
    }

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
 * Check if workspace can perform a scan
 */
export async function canWorkspaceScan(workspaceId: string): Promise<{
  canScan: boolean;
  reason?: string;
}> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    return { canScan: false, reason: "Workspace not found" };
  }

  // PRO tier can always scan
  if (workspace.subscriptionTier === "PRO") {
    return { canScan: true };
  }

  // FREE tier can only scan once
  if (workspace.subscriptionTier === "FREE") {
    if (workspace.hasUsedFreeScan) {
      return {
        canScan: false,
        reason: "Free tier allows only one scan. Upgrade to PRO for unlimited scans.",
      };
    }
    return { canScan: true };
  }

  return { canScan: true };
}

/**
 * Detect drift from previous scan
 */
async function detectDrift(
  workspaceId: string,
  currentApps: Map<string, {
    id: string;
    name: string;
    scopes: string[];
    isClassic: boolean;
    addedAt: Date;
    serviceType?: string;
    status: "ACTIVE" | "REMOVED";
  }>
): Promise<{
  newClassicApps: string[];
  removedApps: string[];
  scopeChanges: Array<{ appId: string; oldScopes: string[]; newScopes: string[] }>;
}> {
  // Get previous apps from database
  const previousApps = await prisma.installedApp.findMany({
    where: { workspaceId },
  });

  const newClassicApps: string[] = [];
  const removedApps: string[] = [];
  const scopeChanges: Array<{ appId: string; oldScopes: string[]; newScopes: string[] }> = [];

  // Build a map of previous apps
  const previousAppsMap = new Map(
    previousApps.map((app) => [app.appId, app])
  );

  // Detect new classic apps
  for (const [appId, app] of currentApps) {
    const previousApp = previousAppsMap.get(appId);

    if (app.status === "ACTIVE" && app.isClassic) {
      // New classic app detected
      if (!previousApp || !previousApp.isClassic) {
        newClassicApps.push(appId);
      }
    }

    // Detect scope changes
    if (previousApp && app.status === "ACTIVE") {
      const scopesChanged =
        JSON.stringify(previousApp.scopes.sort()) !== JSON.stringify(app.scopes.sort());

      if (scopesChanged) {
        scopeChanges.push({
          appId,
          oldScopes: previousApp.scopes,
          newScopes: app.scopes,
        });
      }
    }
  }

  // Detect removed apps
  for (const previousApp of previousApps) {
    const currentApp = currentApps.get(previousApp.appId);
    if (!currentApp || currentApp.status === "REMOVED") {
      if (previousApp.status === "ACTIVE") {
        removedApps.push(previousApp.appId);
      }
    }
  }

  return { newClassicApps, removedApps, scopeChanges };
}

/**
 * Main scan function
 */
export async function scanWorkspace(workspaceId: string): Promise<ScanResult> {
  // Check if workspace can scan
  const { canScan, reason } = await canWorkspaceScan(workspaceId);

  if (!canScan) {
    throw new Error(reason || "Cannot perform scan");
  }

  // Fetch workspace from database
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new Error(`Workspace not found: ${workspaceId}`);
  }

  // Add realistic delay for better UX (makes scan feel more substantial)
  // In production, the actual API calls provide natural delay
  // For demo/testing with local data, this creates a better perception
  const REALISTIC_SCAN_DELAY = 1500; // 1.5 seconds
  await delay(REALISTIC_SCAN_DELAY);

  // Fetch integration logs from Slack
  const logs = await fetchIntegrationLogs(workspace.accessToken);

  // Process logs to extract apps
  const processedApps = processLogs(logs);

  // Detect drift from previous scan
  const drift = await detectDrift(workspaceId, processedApps);

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

    // Mark free scan as used if this is a FREE tier workspace
    if (workspace.subscriptionTier === "FREE" && !workspace.hasUsedFreeScan) {
      await tx.workspace.update({
        where: { id: workspace.id },
        data: { hasUsedFreeScan: true },
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

  // Save scan history with drift information
  await prisma.scanHistory.create({
    data: {
      workspaceId: workspace.id,
      classicCount: classicApps.length,
      modernCount: modernApps.length,
      totalApps: activeApps.length,
      newClassicApps: drift.newClassicApps,
      removedApps: drift.removedApps,
      scopeChanges: drift.scopeChanges.length > 0 ? drift.scopeChanges : undefined,
    },
  });

  // Send drift alert email if PRO tier and drift detected
  const hasDrift =
    drift.newClassicApps.length > 0 ||
    drift.removedApps.length > 0 ||
    drift.scopeChanges.length > 0;

  if (hasDrift && workspace.subscriptionTier === "PRO" && workspace.adminEmail) {
    // Get previous apps for drift alert email context
    const previousApps = await prisma.installedApp.findMany({
      where: { workspaceId },
    });

    // Build drift alert data
    const driftAlertData: DriftAlertData = {
      workspaceName: workspace.name,
      newClassicApps: drift.newClassicApps.map((appId) => {
        const app = processedApps.get(appId);
        return {
          name: app?.name || appId,
          scope: app?.scopes.join(", ") || "",
        };
      }),
      removedClassicApps: drift.removedApps.map((appId) => {
        const app = previousApps.find((a) => a.appId === appId);
        return { name: app?.appName || appId };
      }),
      scopeEscalations: drift.scopeChanges.map((change) => {
        const app = processedApps.get(change.appId);
        return {
          name: app?.name || change.appId,
          oldScope: change.oldScopes.join(", "),
          newScope: change.newScopes.join(", "),
        };
      }),
      dashboardUrl: `${process.env.APP_URL || "http://localhost:3000"}/dashboard?workspaceId=${workspace.id}`,
    };

    // Send email asynchronously (don't block scan result)
    sendDriftAlertEmail(workspace.adminEmail, driftAlertData).catch((error) => {
      console.error("Failed to send drift alert email:", error);
    });
  }

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

/**
 * Get scan history for trend tracking
 */
export async function getScanHistory(workspaceId: string, limit: number = 30) {
  return await prisma.scanHistory.findMany({
    where: { workspaceId },
    orderBy: { scanDate: "desc" },
    take: limit,
  });
}

/**
 * Get workspace subscription info
 */
export async function getWorkspaceSubscription(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      hasUsedFreeScan: true,
    },
  });

  return workspace;
}
