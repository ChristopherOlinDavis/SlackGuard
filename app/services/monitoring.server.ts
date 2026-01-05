import { scanWorkspace } from "./scanner.server";
import { prisma } from "~/lib/prisma.server";

/**
 * Background job to scan all PRO workspaces for drift detection
 * This should be called by a cron job or scheduled task
 */
export async function runWeeklyDriftDetection() {
  console.log("[Monitoring] Starting weekly drift detection...");

  // Get all PRO workspaces
  const proWorkspaces = await prisma.workspace.findMany({
    where: {
      subscriptionTier: "PRO",
      subscriptionStatus: "ACTIVE",
    },
  });

  console.log(`[Monitoring] Found ${proWorkspaces.length} PRO workspaces`);

  const results = [];

  for (const workspace of proWorkspaces) {
    try {
      console.log(`[Monitoring] Scanning workspace: ${workspace.name} (${workspace.id})`);

      // Run scan
      const scanResult = await scanWorkspace(workspace.id);

      // Get the latest scan history
      const latestHistory = await prisma.scanHistory.findFirst({
        where: { workspaceId: workspace.id },
        orderBy: { scanDate: "desc" },
      });

      if (latestHistory) {
        const hasNewClassicApps = latestHistory.newClassicApps.length > 0;
        const hasRemovedApps = latestHistory.removedApps.length > 0;
        const hasScopeChanges = latestHistory.scopeChanges !== null;

        const alertNeeded = hasNewClassicApps || hasRemovedApps || hasScopeChanges;

        if (alertNeeded) {
          console.log(`[Monitoring] ALERT: Drift detected for workspace ${workspace.name}`);

          // Send email alert
          await sendDriftAlert(workspace, latestHistory);
        }

        results.push({
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          scanDate: latestHistory.scanDate,
          alertSent: alertNeeded,
          newClassicApps: latestHistory.newClassicApps.length,
          removedApps: latestHistory.removedApps.length,
          scopeChanges: hasScopeChanges,
        });
      }
    } catch (error) {
      console.error(
        `[Monitoring] Error scanning workspace ${workspace.name}:`,
        error
      );
      results.push({
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  console.log("[Monitoring] Weekly drift detection completed");
  return results;
}

/**
 * Send drift alert email to workspace admin
 * In production, integrate with SendGrid, AWS SES, or similar
 */
async function sendDriftAlert(
  workspace: { id: string; name: string; teamId: string },
  scanHistory: {
    newClassicApps: string[];
    removedApps: string[];
    scopeChanges: any;
    classicCount: number;
    scanDate: Date;
  }
) {
  console.log(`[Email] Sending drift alert to workspace: ${workspace.name}`);

  // Fetch details of new classic apps
  const newClassicAppDetails = await prisma.installedApp.findMany({
    where: {
      workspaceId: workspace.id,
      appId: { in: scanHistory.newClassicApps },
    },
  });

  // In production, replace this with actual email service
  const emailContent = generateDriftAlertEmail(
    workspace,
    scanHistory,
    newClassicAppDetails
  );

  // Log email content for demonstration
  console.log("[Email] Email content:", emailContent);

  // TODO: Integrate with email service
  // await sendEmail({
  //   to: workspaceAdmin.email,
  //   subject: emailContent.subject,
  //   html: emailContent.html,
  // });

  return emailContent;
}

/**
 * Generate email content for drift alert
 */
function generateDriftAlertEmail(
  workspace: { name: string },
  scanHistory: {
    newClassicApps: string[];
    removedApps: string[];
    classicCount: number;
    scanDate: Date;
  },
  newClassicAppDetails: Array<{ appName: string; scopes: string[] }>
) {
  const subject = `⚠️ SlackGuard Alert: New Classic Apps Detected in ${workspace.name}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(to right, #f97316, #dc2626); color: white; padding: 20px; border-radius: 8px; }
          .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
          .app-list { background: #f9fafb; padding: 15px; border-radius: 4px; margin: 10px 0; }
          .cta-button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 SlackGuard Drift Alert</h1>
            <p>Weekly scan detected changes in your Slack workspace</p>
          </div>

          <div class="alert-box">
            <h2>⚠️ Action Required</h2>
            <p><strong>${scanHistory.newClassicApps.length}</strong> new Classic Apps detected</p>
            <p>Total Classic Apps: <strong>${scanHistory.classicCount}</strong></p>
            <p>Scan Date: ${scanHistory.scanDate.toLocaleDateString()}</p>
          </div>

          ${
            newClassicAppDetails.length > 0
              ? `
          <h3>New Classic Apps Detected:</h3>
          <div class="app-list">
            ${newClassicAppDetails
              .map(
                (app) => `
              <div style="margin-bottom: 10px;">
                <strong>${app.appName}</strong><br>
                <small>Scopes: ${app.scopes.join(", ")}</small>
              </div>
            `
              )
              .join("")}
          </div>
          `
              : ""
          }

          ${
            scanHistory.removedApps.length > 0
              ? `
          <p><strong>${scanHistory.removedApps.length}</strong> apps were removed from your workspace.</p>
          `
              : ""
          }

          <p>
            <strong>Why this matters:</strong> Classic Slack Apps will stop working in November 2026.
            These apps need to be migrated to use granular permissions.
          </p>

          <a href="https://slackguard.example.com/dashboard" class="cta-button">
            View Full Report →
          </a>

          <div class="footer">
            <p>This is an automated alert from SlackGuard PRO.</p>
            <p>You're receiving this because you have drift detection enabled for ${workspace.name}.</p>
            <p>To unsubscribe or modify alert settings, visit your dashboard.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}

/**
 * Export function to be called by cron job
 */
export async function scheduledMonitoringJob() {
  console.log("[Cron] Starting scheduled monitoring job");

  try {
    const results = await runWeeklyDriftDetection();
    console.log(`[Cron] Monitoring job completed. Processed ${results.length} workspaces`);
    return { success: true, results };
  } catch (error) {
    console.error("[Cron] Monitoring job failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
