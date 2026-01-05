import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useNavigation } from "@remix-run/react";
import { getWorkspaceSubscription } from "~/services/scanner.server";
import { prisma } from "~/lib/prisma.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");

  if (!workspaceId) {
    throw new Response("Workspace ID is required", { status: 400 });
  }

  const subscription = await getWorkspaceSubscription(workspaceId);

  if (!subscription) {
    throw new Response("Workspace not found", { status: 404 });
  }

  return json({ workspaceId, subscription });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const workspaceId = formData.get("workspaceId") as string;

  if (!workspaceId) {
    throw new Response("Workspace ID is required", { status: 400 });
  }

  // Simulate upgrade to PRO tier
  // In production, this would integrate with Stripe/payment provider
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      subscriptionTier: "PRO",
      subscriptionStatus: "ACTIVE",
    },
  });

  // Redirect to dashboard with scan enabled
  return new Response(null, {
    status: 302,
    headers: {
      Location: `/dashboard?workspaceId=${workspaceId}&scan=true`,
    },
  });
}

export default function Upgrade() {
  const { workspaceId, subscription } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isUpgrading = navigation.state === "submitting";

  if (subscription.subscriptionTier === "PRO") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You're already on PRO!
          </h1>
          <p className="text-gray-600 mb-6">
            You have access to all premium features.
          </p>
          <a
            href={`/dashboard?workspaceId=${workspaceId}`}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upgrade to SlackGuard PRO
          </h1>
          <p className="text-xl text-gray-600">
            Take control of your Slack compliance before Nov 2026
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* FREE Tier */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">FREE</h2>
            <p className="text-3xl font-bold text-gray-900 mb-6">
              $0<span className="text-lg text-gray-600">/month</span>
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">One-time free scan</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">
                  Classic vs Modern app counts
                </span>
              </li>
              <li className="flex items-start text-gray-400">
                <svg
                  className="h-6 w-6 text-gray-300 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>Full app list (blurred)</span>
              </li>
              <li className="flex items-start text-gray-400">
                <svg
                  className="h-6 w-6 text-gray-300 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>CSV exports</span>
              </li>
              <li className="flex items-start text-gray-400">
                <svg
                  className="h-6 w-6 text-gray-300 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>Unlimited scans</span>
              </li>
              <li className="flex items-start text-gray-400">
                <svg
                  className="h-6 w-6 text-gray-300 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>Trend tracking</span>
              </li>
              <li className="flex items-start text-gray-400">
                <svg
                  className="h-6 w-6 text-gray-300 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>Drift detection & alerts</span>
              </li>
            </ul>
            <div className="text-center text-sm text-gray-500">
              Current Plan
            </div>
          </div>

          {/* PRO Tier */}
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-2xl p-8 border-2 border-orange-600 transform scale-105">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">PRO</h2>
              <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-xs font-bold">
                RECOMMENDED
              </span>
            </div>
            <p className="text-3xl font-bold text-white mb-6">
              $49<span className="text-lg text-orange-100">/month</span>
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-white mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white font-semibold">
                  Unlimited scans
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-white mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white font-semibold">
                  Full app list with details
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-white mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white font-semibold">
                  CSV export (Red List)
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-white mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white font-semibold">
                  Historical trend tracking
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-white mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white font-semibold">
                  Weekly drift detection
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-white mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white font-semibold">
                  Email alerts for new classic apps
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-white mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white font-semibold">
                  Priority support
                </span>
              </li>
            </ul>
            <Form method="post">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <button
                type="submit"
                disabled={isUpgrading}
                className="w-full bg-white text-orange-600 font-bold py-4 px-6 rounded-lg hover:bg-orange-50 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpgrading ? "Upgrading..." : "Upgrade to PRO Now"}
              </button>
            </Form>
            <p className="text-xs text-orange-100 mt-4 text-center">
              30-day money-back guarantee • Cancel anytime
            </p>
          </div>
        </div>

        <div className="text-center">
          <a
            href={`/dashboard?workspaceId=${workspaceId}`}
            className="text-gray-600 hover:text-gray-900 underline"
          >
            Maybe later
          </a>
        </div>
      </div>
    </div>
  );
}
