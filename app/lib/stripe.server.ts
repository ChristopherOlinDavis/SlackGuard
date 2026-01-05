import Stripe from "stripe";
import { prisma } from "~/lib/prisma.server";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

/**
 * Create or retrieve Stripe customer for workspace
 */
export async function getOrCreateStripeCustomer(workspaceId: string): Promise<string> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Return existing customer ID if available
  if (workspace.stripeCustomerId) {
    return workspace.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    metadata: {
      workspaceId: workspace.id,
      teamId: workspace.teamId,
    },
    description: `SlackGuard - ${workspace.name}`,
  });

  // Save customer ID to database
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Create Stripe Checkout Session for PRO upgrade
 */
export async function createCheckoutSession(
  workspaceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const customerId = await getOrCreateStripeCustomer(workspaceId);

  if (!process.env.STRIPE_PRICE_ID_PRO) {
    throw new Error("STRIPE_PRICE_ID_PRO is not configured");
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID_PRO,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      workspaceId,
    },
    subscription_data: {
      metadata: {
        workspaceId,
      },
    },
  });

  return session;
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  signature: string,
  body: string
): Promise<void> {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;

      if (!workspaceId) {
        console.error("No workspaceId in checkout session metadata");
        return;
      }

      // Upgrade workspace to PRO
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          subscriptionTier: "PRO",
          subscriptionStatus: "ACTIVE",
        },
      });

      console.log(`[Stripe] Workspace ${workspaceId} upgraded to PRO`);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find workspace by Stripe customer ID
      const workspace = await prisma.workspace.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (workspace) {
        // Downgrade to FREE
        await prisma.workspace.update({
          where: { id: workspace.id },
          data: {
            subscriptionTier: "FREE",
            subscriptionStatus: "CANCELLED",
          },
        });

        console.log(`[Stripe] Workspace ${workspace.id} downgraded to FREE`);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const workspace = await prisma.workspace.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (workspace) {
        // Update subscription status based on Stripe status
        let subscriptionStatus: "ACTIVE" | "CANCELLED" | "TRIAL" = "ACTIVE";

        if (subscription.status === "canceled" || subscription.status === "incomplete_expired") {
          subscriptionStatus = "CANCELLED";
        } else if (subscription.status === "trialing") {
          subscriptionStatus = "TRIAL";
        }

        await prisma.workspace.update({
          where: { id: workspace.id },
          data: { subscriptionStatus },
        });

        console.log(
          `[Stripe] Workspace ${workspace.id} subscription status updated to ${subscriptionStatus}`
        );
      }
      break;
    }

    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }
}

/**
 * Create Stripe Billing Portal session
 */
export async function createBillingPortalSession(
  workspaceId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const customerId = await getOrCreateStripeCustomer(workspaceId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

export { stripe };
