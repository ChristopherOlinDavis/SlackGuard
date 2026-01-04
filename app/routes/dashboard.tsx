import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import TrafficLight from "~/components/Dashboard/TrafficLight";
import { scanWorkspace, getLatestScanResult } from "~/services/scanner.server";
import type { ScanResult } from "~/types/domain";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const shouldScan = url.searchParams.get("scan") === "true";

  if (!workspaceId) {
    throw new Response("Workspace ID is required", { status: 400 });
  }

  let scanResult: ScanResult | null = null;

  try {
    if (shouldScan) {
      // Trigger a new scan
      scanResult = await scanWorkspace(workspaceId);
    } else {
      // Get the latest scan result
      scanResult = await getLatestScanResult(workspaceId);
    }

    if (!scanResult) {
      // No scan results found, trigger a scan
      scanResult = await scanWorkspace(workspaceId);
    }

    return json({ scanResult, error: null });
  } catch (error) {
    console.error("Error scanning workspace:", error);
    return json(
      {
        scanResult: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

export default function Dashboard() {
  const { scanResult, error } = useLoaderData<typeof loader>();

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!scanResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-gray-700">No scan results available.</p>
        </div>
      </div>
    );
  }

  return <TrafficLight scanResult={scanResult} />;
}
