import { Resend } from "resend";

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || "SlackGuard <alerts@slackguard.dev>";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@slackguard.dev";

export interface DriftAlertData {
  workspaceName: string;
  newClassicApps: Array<{ name: string; scope: string }>;
  removedClassicApps: Array<{ name: string }>;
  scopeEscalations: Array<{ name: string; oldScope: string; newScope: string }>;
  dashboardUrl: string;
}

/**
 * Send drift alert email to workspace admin
 *
 * @param to - Recipient email address
 * @param data - Drift alert data
 * @returns Promise with send result
 */
export async function sendDriftAlertEmail(
  to: string,
  data: DriftAlertData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured - skipping email send");
      return { success: false, error: "Email service not configured" };
    }

    const hasRedAlerts = data.newClassicApps.length > 0;
    const hasYellowAlerts = data.scopeEscalations.length > 0;
    const hasGreenAlerts = data.removedClassicApps.length > 0;

    // Build email subject
    let subject = "🔴 URGENT: New Classic Slack Apps Detected";
    if (!hasRedAlerts && hasYellowAlerts) {
      subject = "🟡 Warning: Slack App Scope Changes Detected";
    } else if (!hasRedAlerts && !hasYellowAlerts && hasGreenAlerts) {
      subject = "🟢 Good News: Classic Apps Removed from Your Workspace";
    }

    const html = generateDriftAlertHTML(data);
    const text = generateDriftAlertText(data);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
      replyTo: SUPPORT_EMAIL,
    });

    if (result.error) {
      console.error("Failed to send drift alert email:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`Drift alert email sent successfully to ${to}:`, result.data?.id);
    return { success: true };
  } catch (error) {
    console.error("Error sending drift alert email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send welcome email to new PRO subscriber
 */
export async function sendWelcomeEmail(
  to: string,
  workspaceName: string,
  dashboardUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured - skipping email send");
      return { success: false, error: "Email service not configured" };
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to SlackGuard PRO!</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>Thank you for upgrading <strong>${workspaceName}</strong> to SlackGuard PRO! You now have access to:</p>
      <ul>
        <li>✅ Unlimited scans</li>
        <li>✅ Automated weekly drift detection</li>
        <li>✅ Email alerts for new Classic apps</li>
        <li>✅ CSV export of all findings</li>
        <li>✅ Priority support</li>
      </ul>
      <p>Your workspace is now being monitored automatically. You'll receive weekly drift reports if any changes are detected.</p>
      <a href="${dashboardUrl}" class="button">View Your Dashboard</a>
      <p>If you have any questions, just reply to this email.</p>
      <p>Best regards,<br>The SlackGuard Team</p>
    </div>
    <div class="footer">
      <p>SlackGuard - Protect your workspace from the Nov 2026 migration</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
Welcome to SlackGuard PRO!

Thank you for upgrading ${workspaceName} to SlackGuard PRO!

You now have access to:
- Unlimited scans
- Automated weekly drift detection
- Email alerts for new Classic apps
- CSV export of all findings
- Priority support

Your workspace is now being monitored automatically. You'll receive weekly drift reports if any changes are detected.

View your dashboard: ${dashboardUrl}

If you have any questions, just reply to this email.

Best regards,
The SlackGuard Team
    `.trim();

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "🎉 Welcome to SlackGuard PRO",
      html,
      text,
      replyTo: SUPPORT_EMAIL,
    });

    if (result.error) {
      console.error("Failed to send welcome email:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate HTML email template for drift alerts
 */
function generateDriftAlertHTML(data: DriftAlertData): string {
  const hasRedAlerts = data.newClassicApps.length > 0;
  const hasYellowAlerts = data.scopeEscalations.length > 0;
  const hasGreenAlerts = data.removedClassicApps.length > 0;

  let sections = "";

  // Red alerts - New Classic Apps (URGENT)
  if (hasRedAlerts) {
    sections += `
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <h2 style="color: #dc2626; margin-top: 0;">🔴 New Classic Apps Detected (ACTION REQUIRED)</h2>
        <p><strong>These apps will break in November 2026</strong> and need immediate attention:</p>
        <ul>
          ${data.newClassicApps.map(app => `
            <li><strong>${app.name}</strong> - Scope: <code>${app.scope}</code></li>
          `).join("")}
        </ul>
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Contact the app developer to request a Modern app version</li>
          <li>Search for alternative Modern apps in the Slack App Directory</li>
          <li>Plan migration before November 2026</li>
        </ol>
      </div>
    `;
  }

  // Yellow alerts - Scope escalations
  if (hasYellowAlerts) {
    sections += `
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <h2 style="color: #f59e0b; margin-top: 0;">🟡 Scope Changes Detected</h2>
        <p>These apps have changed their permissions:</p>
        <ul>
          ${data.scopeEscalations.map(app => `
            <li>
              <strong>${app.name}</strong><br>
              Old: <code>${app.oldScope}</code><br>
              New: <code>${app.newScope}</code>
            </li>
          `).join("")}
        </ul>
        <p>Review these changes to ensure they're expected.</p>
      </div>
    `;
  }

  // Green alerts - Removed Classic Apps (Good news!)
  if (hasGreenAlerts) {
    sections += `
      <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <h2 style="color: #16a34a; margin-top: 0;">🟢 Classic Apps Removed (Progress!)</h2>
        <p>Great news! These Classic apps have been removed from your workspace:</p>
        <ul>
          ${data.removedClassicApps.map(app => `
            <li>${app.name}</li>
          `).join("")}
        </ul>
        <p>You're making progress towards Nov 2026 compliance! 🎉</p>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ Drift Alert for ${data.workspaceName}</h1>
    </div>
    <div class="content">
      <p>SlackGuard has detected changes in your workspace's Slack apps:</p>
      ${sections}
      <a href="${data.dashboardUrl}" class="button">View Full Report</a>
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <strong>What is SlackGuard?</strong><br>
        We monitor your Slack workspace for Classic apps using the deprecated <code>bot</code> scope that will stop working in November 2026.
      </p>
    </div>
    <div class="footer">
      <p>You're receiving this because you have drift detection enabled for ${data.workspaceName}</p>
      <p>SlackGuard - Protect your workspace from the Nov 2026 migration</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for drift alerts
 */
function generateDriftAlertText(data: DriftAlertData): string {
  let text = `⚡ Drift Alert for ${data.workspaceName}\n\n`;
  text += `SlackGuard has detected changes in your workspace's Slack apps:\n\n`;

  if (data.newClassicApps.length > 0) {
    text += `🔴 NEW CLASSIC APPS DETECTED (ACTION REQUIRED)\n`;
    text += `These apps will break in November 2026:\n\n`;
    data.newClassicApps.forEach(app => {
      text += `  - ${app.name} (Scope: ${app.scope})\n`;
    });
    text += `\nNext Steps:\n`;
    text += `1. Contact the app developer to request a Modern app version\n`;
    text += `2. Search for alternative Modern apps in the Slack App Directory\n`;
    text += `3. Plan migration before November 2026\n\n`;
  }

  if (data.scopeEscalations.length > 0) {
    text += `🟡 SCOPE CHANGES DETECTED\n`;
    text += `These apps have changed their permissions:\n\n`;
    data.scopeEscalations.forEach(app => {
      text += `  - ${app.name}\n`;
      text += `    Old: ${app.oldScope}\n`;
      text += `    New: ${app.newScope}\n`;
    });
    text += `\n`;
  }

  if (data.removedClassicApps.length > 0) {
    text += `🟢 CLASSIC APPS REMOVED (PROGRESS!)\n`;
    text += `Great news! These Classic apps have been removed:\n\n`;
    data.removedClassicApps.forEach(app => {
      text += `  - ${app.name}\n`;
    });
    text += `\nYou're making progress towards Nov 2026 compliance! 🎉\n\n`;
  }

  text += `View full report: ${data.dashboardUrl}\n\n`;
  text += `---\n`;
  text += `You're receiving this because you have drift detection enabled for ${data.workspaceName}\n`;
  text += `SlackGuard - Protect your workspace from the Nov 2026 migration\n`;

  return text;
}
