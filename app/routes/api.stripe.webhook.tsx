import { type ActionFunctionArgs } from "@remix-run/node";
import { handleStripeWebhook } from "~/lib/stripe.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  try {
    const body = await request.text();
    await handleStripeWebhook(signature, body);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Webhook handler failed",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
