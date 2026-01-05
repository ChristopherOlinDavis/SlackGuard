import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import TrafficLight from "~/components/Dashboard/TrafficLight";
import {
  scanWorkspace,
  getLatestScanResult,
  getWorkspaceSubscription,
  canWorkspaceScan,
} from "~/services/scanner.server";
import type { ScanResult, WorkspaceSubscription } from "~/types/domain";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const shouldScan = url.searchParams.get("scan") === "true";

  if (!workspaceId) {
    throw new Response("Workspace ID is required", { status: 400 });
  }

  let scanResult: ScanResult | null = null;
  let subscription: WorkspaceSubscription | null = null;

  try {
    // Get subscription info
    subscription = await getWorkspaceSubscription(workspaceId);

    if (!subscription) {
      throw new Error("Workspace not found");
    }

    // Check if workspace can scan
    const { canScan, reason } = await canWorkspaceScan(workspaceId);

    if (shouldScan) {
      if (!canScan) {
        return json({
          scanResult: null,
          subscription,
          workspaceId,
          error: reason || "Cannot perform scan",
          scanLimitReached: true,
        });
      }

      // Trigger a new scan
      scanResult = await scanWorkspace(workspaceId);
    } else {
      // Get the latest scan result
      scanResult = await getLatestScanResult(workspaceId);
    }

    if (!scanResult && canScan) {
      // No scan results found, trigger a scan
      scanResult = await scanWorkspace(workspaceId);
    }

    return json({
      scanResult,
      subscription,
      workspaceId,
      error: null,
      scanLimitReached: false,
    });
  } catch (error) {
    console.error("Error scanning workspace:", error);
    return json(
      {
        scanResult: null,
        subscription,
        workspaceId,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        scanLimitReached: false,
      },
      { status: 500 }
    );
  }
}

export default function Dashboard() {
  const { scanResult, error, subscription, workspaceId, scanLimitReached } =
    useLoaderData<typeof loader>();

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {scanLimitReached ? "Free Scan Limit Reached" : "Error"}
          </h1>
          <p className="text-gray-700 mb-6">{error}</p>
          {scanLimitReached && (
            <a
              href={`/upgrade?workspaceId=${workspaceId}`}
              className="block w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-lg text-center transition"
            >
              Upgrade to PRO for Unlimited Scans
            </a>
          )}
        </div>
      </div>
    );
  }

  if (!scanResult || !subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-gray-700">No scan results available.</p>
        </div>
      </div>
    );
  }

  return (
    <TrafficLight
      scanResult={scanResult}
      subscriptionTier={subscription.subscriptionTier}
      workspaceId={workspaceId}
    />
  );
}
