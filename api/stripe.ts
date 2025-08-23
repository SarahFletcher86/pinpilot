// Serverless endpoint for Stripe webhooks at: /api/stripe
// Verifies the signature and handles subscription lifecycle events.

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

// Read raw body so Stripe signature verification works
async function getRawBody(req: any): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    req.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).send("Method Not Allowed");
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers["stripe-signature"];

  if (!webhookSecret || !sig) {
    res.status(400).send("Missing Stripe webhook secret or signature header");
    return;
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig as string, webhookSecret);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err?.message);
    res.status(400).send(`Webhook Error: ${err?.message || "invalid signature"}`);
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // A checkout finished — usually first time someone becomes Pro.
        const session = event.data.object as Stripe.Checkout.Session;

        // Example fields you may want:
        // const customerId = session.customer as string | null;
        // const subscriptionId = session.subscription as string | null;
        // const email = session.customer_details?.email ?? null;

        // TODO: Upsert user in Supabase: plan='pro', store customerId & subscriptionId
        // await upsertUserFromCheckout({ email, customerId, subscriptionId });

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        // Example fields:
        // const customerId = sub.customer as string;
        // const status = sub.status; // 'active', 'trialing', 'canceled', etc.
        // const priceId = sub.items.data[0]?.price?.id;

        // TODO: Sync subscription status/plan in Supabase
        // await updateUserSubscription({ customerId, status, priceId, subId: sub.id });

        break;
      }

      default: {
        // Not a type we care about right now
        // console.log(`Unhandled event type ${event.type}`);
      }
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("❌ Webhook handler error:", err);
    res.status(500).json({ ok: false, error: err?.message || "Unknown error" });
  }
}