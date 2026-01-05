import type { ScanResult, SubscriptionTier } from "~/types/domain";
import { Link } from "@remix-run/react";

interface TrafficLightProps {
  scanResult: ScanResult;
  subscriptionTier: SubscriptionTier;
  workspaceId: string;
}

export default function TrafficLight({
  scanResult,
  subscriptionTier,
  workspaceId,
}: TrafficLightProps) {
  const isFree = subscriptionTier === "FREE";

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            SlackGuard Lite - Deprecation Scanner
          </h1>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                isFree
                  ? "bg-gray-200 text-gray-800"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {subscriptionTier} Tier
            </span>
            {!isFree && (
              <Link
                to={`/export-csv?workspaceId=${workspaceId}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                Export Red List (CSV)
              </Link>
            )}
          </div>
        </div>

        {/* Traffic Light Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Red Card - Classic Apps */}
          <div className="bg-red-500 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-2">Classic Apps</h2>
                <p className="text-sm opacity-90">
                  Action Required by Nov 2026
                </p>
              </div>
              <div className="text-5xl font-bold">{scanResult.classicApps}</div>
            </div>
            <div className="mt-4 pt-4 border-t border-red-400">
              <p className="text-sm">
                These apps use the deprecated "bot" scope and will break in
                November 2026. Upgrade to granular permissions.
              </p>
            </div>
          </div>

          {/* Green Card - Modern Apps */}
          <div className="bg-green-500 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-2">Modern Apps</h2>
                <p className="text-sm opacity-90">
                  Granular Permissions Active
                </p>
              </div>
              <div className="text-5xl font-bold">{scanResult.modernApps}</div>
            </div>
            <div className="mt-4 pt-4 border-t border-green-400">
              <p className="text-sm">
                These apps use granular OAuth scopes and are ready for the
                future.
              </p>
            </div>
          </div>
        </div>

        {/* Apps List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden relative">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Installed Apps
            </h2>
            {isFree && (
              <span className="text-sm text-orange-600 font-semibold">
                Limited Preview - Upgrade to see details
              </span>
            )}
          </div>
          <div className="overflow-x-auto relative">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    App Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Scopes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scanResult.apps.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No apps found
                    </td>
                  </tr>
                ) : (
                  scanResult.apps
                    .slice(0, isFree ? 3 : undefined)
                    .map((app) => (
                      <tr
                        key={app.id}
                        className={app.isClassic ? "bg-red-50" : ""}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`text-sm font-medium text-gray-900 ${
                              isFree ? "filter blur-sm select-none" : ""
                            }`}
                          >
                            {isFree ? "████████" : app.name}
                          </div>
                          <div
                            className={`text-xs text-gray-500 ${
                              isFree ? "filter blur-sm select-none" : ""
                            }`}
                          >
                            {isFree ? "████████" : app.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              app.isClassic
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {app.isClassic ? "Classic" : "Modern"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`text-sm text-gray-900 ${
                              isFree ? "filter blur-sm select-none" : ""
                            }`}
                          >
                            {app.scopes.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {app.scopes.map((scope, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-2 py-1 text-xs rounded ${
                                      scope === "bot"
                                        ? "bg-red-200 text-red-800 font-semibold"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {isFree ? "████" : scope}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">No scopes</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>

            {/* Free Tier Upgrade CTA Overlay */}
            {isFree && scanResult.apps.length > 0 && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white flex items-end justify-center pb-8">
                <div className="text-center bg-white rounded-lg shadow-xl p-8 max-w-md">
                  <div className="mb-4">
                    <svg
                      className="mx-auto h-12 w-12 text-orange-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {scanResult.apps.length} Apps Detected
                  </h3>
                  <p className="text-gray-600 mb-6">
                    You have {scanResult.classicApps} Classic Apps that need
                    migration. Unlock the full report to see which apps require
                    action.
                  </p>
                  <Link
                    to={`/upgrade?workspaceId=${workspaceId}`}
                    className="block w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105"
                  >
                    Unlock Full Migration Report
                  </Link>
                  <p className="text-xs text-gray-500 mt-4">
                    PRO: Unlimited scans • Full app list • CSV exports • Trend
                    tracking
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
