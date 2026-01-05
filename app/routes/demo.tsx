import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Find demo workspaces
  const demoWorkspaces = await prisma.workspace.findMany({
    where: {
      teamId: {
        startsWith: "T_DEMO_",
      },
    },
    include: {
      installedApps: {
        where: { status: "ACTIVE" },
      },
    },
  });

  return json({ demoWorkspaces });
}

export default function Demo() {
  const { demoWorkspaces } = useLoaderData<typeof loader>();

  if (demoWorkspaces.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-2xl bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎬 Demo Mode - Setup Required
          </h1>
          <p className="text-gray-700 mb-6">
            No demo data found. Run the demo seed script to set up the stage:
          </p>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-6">
            <code>npm run demo:seed</code>
          </div>
          <p className="text-sm text-gray-600">
            This will create two demo workspaces with realistic data for your
            presentation.
          </p>
        </div>
      </div>
    );
  }

  const freeWorkspace = demoWorkspaces.find((w) => w.subscriptionTier === "FREE");
  const proWorkspace = demoWorkspaces.find((w) => w.subscriptionTier === "PRO");

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🎬 SlackGuard Demo Mode
          </h1>
          <p className="text-xl text-gray-700">
            Stage is set! Choose your demo scenario below.
          </p>
        </div>

        {/* Demo Workspaces */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* FREE Tier Demo */}
          {freeWorkspace && (
            <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-orange-500">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold">{freeWorkspace.name}</h2>
                  <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-bold">
                    FREE TIER
                  </span>
                </div>
                <p className="text-orange-100">
                  Perfect for demonstrating the upgrade flow
                </p>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    📊 Demo Data:
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center">
                      <span className="text-red-500 mr-2">🔴</span>
                      {
                        freeWorkspace.installedApps.filter((a) => a.isClassic)
                          .length
                      }{" "}
                      Classic Apps (from 2015!)
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">🟢</span>
                      {
                        freeWorkspace.installedApps.filter((a) => !a.isClassic)
                          .length
                      }{" "}
                      Modern Apps
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">✨</span>
                      Blurred app names (freemium hook)
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">🎯</span>
                      Upgrade CTA visible
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <Link
                    to={`/dashboard?workspaceId=${freeWorkspace.id}`}
                    className="block w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-lg text-center transition"
                  >
                    View Dashboard
                  </Link>
                  <Link
                    to={`/upgrade?workspaceId=${freeWorkspace.id}`}
                    className="block w-full bg-orange-100 text-orange-700 hover:bg-orange-200 font-semibold py-3 px-6 rounded-lg text-center transition"
                  >
                    View Upgrade Page
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* PRO Tier Demo */}
          {proWorkspace && (
            <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-purple-500">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold">{proWorkspace.name}</h2>
                  <span className="bg-white text-purple-600 px-3 py-1 rounded-full text-sm font-bold">
                    PRO TIER
                  </span>
                </div>
                <p className="text-purple-100">
                  Full feature access & CSV export
                </p>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    📊 Demo Data:
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center">
                      <span className="text-red-500 mr-2">🔴</span>
                      {
                        proWorkspace.installedApps.filter((a) => a.isClassic)
                          .length
                      }{" "}
                      Classic Apps
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">🟢</span>
                      {
                        proWorkspace.installedApps.filter((a) => !a.isClassic)
                          .length
                      }{" "}
                      Modern Apps
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">✅</span>
                      Full app details visible
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">📥</span>
                      CSV export enabled
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <Link
                    to={`/dashboard?workspaceId=${proWorkspace.id}`}
                    className="block w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
                  >
                    View Dashboard
                  </Link>
                  <Link
                    to={`/export-csv?workspaceId=${proWorkspace.id}`}
                    className="block w-full bg-purple-100 text-purple-700 hover:bg-purple-200 font-semibold py-3 px-6 rounded-lg text-center transition"
                  >
                    Export CSV
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recording Checklist */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">🎥</span>
            60-Second Recording Checklist
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Before Recording:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <input type="checkbox" className="mt-1 mr-2" />
                  <span>Clear browser history & hide bookmarks bar</span>
                </li>
                <li className="flex items-start">
                  <input type="checkbox" className="mt-1 mr-2" />
                  <span>Close unnecessary tabs & apps</span>
                </li>
                <li className="flex items-start">
                  <input type="checkbox" className="mt-1 mr-2" />
                  <span>Enable Do Not Disturb (no notifications)</span>
                </li>
                <li className="flex items-start">
                  <input type="checkbox" className="mt-1 mr-2" />
                  <span>Use Screen Studio or OBS for recording</span>
                </li>
                <li className="flex items-start">
                  <input type="checkbox" className="mt-1 mr-2" />
                  <span>Test audio levels (clear voiceover)</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Recording Script:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="font-mono text-orange-600 mr-2">0:00</span>
                  <span>Hook: "Nov 2026, Slack breaks legacy bots..."</span>
                </li>
                <li className="flex items-start">
                  <span className="font-mono text-orange-600 mr-2">0:10</span>
                  <span>Click "Scan Workspace" (show loading)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-mono text-orange-600 mr-2">0:25</span>
                  <span>Reveal: "4 Classic apps will break"</span>
                </li>
                <li className="flex items-start">
                  <span className="font-mono text-orange-600 mr-2">0:40</span>
                  <span>Show CSV export (for IT teams)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-mono text-orange-600 mr-2">0:50</span>
                  <span>CTA: "Scan your workspace free today"</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Tips */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-4">💡 Pro Recording Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-1">Screen Studio (Mac):</p>
              <p className="text-blue-100">
                Auto-zooms on clicks, looks incredibly professional. Worth the
                investment.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">OBS Studio (Free):</p>
              <p className="text-blue-100">
                Open-source, powerful, but requires manual setup. Great for
                live demos.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">Loom (Easy):</p>
              <p className="text-blue-100">
                Quick browser-based recording. Perfect for internal demos to
                investors.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p className="text-sm">
            🎭 Demo data created by{" "}
            <code className="bg-gray-200 px-2 py-1 rounded">
              npm run demo:seed
            </code>
          </p>
          <p className="text-xs mt-2">
            Tip: Refresh demo data anytime by re-running the seed script
          </p>
        </div>
      </div>
    </div>
  );
}
