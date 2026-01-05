import { type LoaderFunctionArgs } from "@remix-run/node";
import { getLatestScanResult, getWorkspaceSubscription } from "~/services/scanner.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");

  if (!workspaceId) {
    throw new Response("Workspace ID is required", { status: 400 });
  }

  // Check subscription
  const subscription = await getWorkspaceSubscription(workspaceId);

  if (!subscription || subscription.subscriptionTier === "FREE") {
    throw new Response("CSV export is only available for PRO tier", {
      status: 403,
    });
  }

  // Get scan result
  const scanResult = await getLatestScanResult(workspaceId);

  if (!scanResult) {
    throw new Response("No scan results available", { status: 404 });
  }

  // Filter for classic apps only (Red List)
  const classicApps = scanResult.apps.filter((app) => app.isClassic);

  // Generate CSV
  const csvHeader = "App ID,App Name,Scopes,Status\n";
  const csvRows = classicApps
    .map((app) => {
      const scopes = app.scopes.join("; ");
      return `"${app.id}","${app.name}","${scopes}","Action Required"`;
    })
    .join("\n");

  const csv = csvHeader + csvRows;

  // Return CSV file
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="slackguard-red-list-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
