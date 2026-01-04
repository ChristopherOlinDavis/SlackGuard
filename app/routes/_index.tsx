import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  // For now, redirect to dashboard with a default workspace ID
  // In production, you would implement proper authentication and workspace selection
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId") || "demo-workspace";

  return redirect(`/dashboard?workspaceId=${workspaceId}`);
}
