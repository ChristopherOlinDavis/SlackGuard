import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

/**
 * Slack OAuth Install Flow - Step 1: Redirect to Slack
 *
 * This endpoint redirects users to Slack's OAuth authorization page.
 * Slack will ask the user to authorize the app to access their workspace.
 *
 * Required environment variables:
 * - SLACK_CLIENT_ID: Your Slack app's client ID
 * - SLACK_REDIRECT_URI: Your OAuth callback URL (e.g., https://yourdomain.com/auth/slack/callback)
 *
 * Required Slack scopes:
 * - admin.integrations:read (to access team.integrationLogs API)
 * - team:read (to get workspace info)
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Response(
      "Slack OAuth is not configured. Please set SLACK_CLIENT_ID and SLACK_REDIRECT_URI environment variables.",
      { status: 500 }
    );
  }

  // Required scopes for SlackGuard
  const scopes = [
    "admin.integrations:read", // Access to team.integrationLogs API
    "team:read",               // Get workspace info (name, domain)
  ];

  // Generate state parameter for CSRF protection
  // In production, store this in session and validate in callback
  const state = crypto.randomUUID();

  // Build Slack OAuth URL
  const authUrl = new URL("https://slack.com/oauth/v2/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("scope", scopes.join(","));
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  // Redirect to Slack OAuth page
  return redirect(authUrl.toString());
}
