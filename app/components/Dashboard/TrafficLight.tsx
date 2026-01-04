import type { ScanResult } from "~/types/domain";

interface TrafficLightProps {
  scanResult: ScanResult;
}

export default function TrafficLight({ scanResult }: TrafficLightProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          SlackGuard Lite - Deprecation Scanner
        </h1>

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
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">
              Installed Apps
            </h2>
          </div>
          <div className="overflow-x-auto">
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
                  scanResult.apps.map((app) => (
                    <tr
                      key={app.id}
                      className={app.isClassic ? "bg-red-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {app.name}
                        </div>
                        <div className="text-xs text-gray-500">{app.id}</div>
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
                        <div className="text-sm text-gray-900">
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
                                  {scope}
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
          </div>
        </div>
      </div>
    </div>
  );
}
