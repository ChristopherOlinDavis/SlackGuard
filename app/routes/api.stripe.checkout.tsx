import { json, type ActionFunctionArgs } from "@remix-run/node";
import { createCheckoutSession } from "~/lib/stripe.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const workspaceId = formData.get("workspaceId") as string;

  if (!workspaceId) {
    return json({ error: "Workspace ID is required" }, { status: 400 });
  }

  try {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const successUrl = `${baseUrl}/dashboard?workspaceId=${workspaceId}&upgraded=true`;
    const cancelUrl = `${baseUrl}/upgrade?workspaceId=${workspaceId}&cancelled=true`;

    const session = await createCheckoutSession(
      workspaceId,
      successUrl,
      cancelUrl
    );

    // Redirect to Stripe Checkout
    return json({ url: session.url });
  } catch (error) {
    console.error("[Stripe Checkout] Error:", error);
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session",
      },
      { status: 500 }
    );
  }
}
