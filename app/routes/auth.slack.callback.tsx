import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/prisma.server";
import { encrypt } from "~/lib/encryption.server";

/**
 * Slack OAuth Callback - Step 2: Exchange code for access token
 *
 * This endpoint receives the authorization code from Slack and exchanges it
 * for an access token. It then creates/updates the workspace record in the database.
 *
 * Required environment variables:
 * - SLACK_CLIENT_ID: Your Slack app's client ID
 * - SLACK_CLIENT_SECRET: Your Slack app's client secret
 * - SLACK_REDIRECT_URI: Your OAuth callback URL
 * - ENCRYPTION_KEY: 32-byte hex string for encrypting access tokens
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  // const state = url.searchParams.get("state"); // TODO: Validate CSRF state

  // Handle OAuth errors
  if (error) {
    return redirect(`/?error=slack_oauth_${error}`);
  }

  if (!code) {
    return redirect("/?error=missing_code");
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Response("Slack OAuth is not configured", { status: 500 });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error("Slack OAuth token exchange failed:", tokenData.error);
      return redirect(`/?error=token_exchange_failed`);
    }

    // Extract workspace and token info
    const {
      access_token,
      team: { id: teamId, name: teamName },
      authed_user,
    } = tokenData;

    // Encrypt the access token before storing
    const encryptedToken = encrypt(access_token);

    // Create or update workspace in database
    const workspace = await prisma.workspace.upsert({
      where: { teamId },
      create: {
        teamId,
        name: teamName,
        accessToken: encryptedToken,
        adminEmail: authed_user?.email || null, // Store admin email for drift alerts
        subscriptionTier: "FREE",
        subscriptionStatus: "ACTIVE",
        hasUsedFreeScan: false,
      },
      update: {
        name: teamName,
        accessToken: encryptedToken,
        adminEmail: authed_user?.email || null,
      },
    });

    console.log(`Workspace authenticated: ${workspace.name} (${workspace.id})`);

    // Redirect to dashboard with success message
    return redirect(`/dashboard?workspaceId=${workspace.id}&installed=true`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return redirect("/?error=oauth_failed");
  }
}
