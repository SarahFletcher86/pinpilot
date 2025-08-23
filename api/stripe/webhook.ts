// api/stripe/webhook.ts
import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia",
});

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE as string
);

export const config = { api: { bodyParser: false } };

function readRawBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  let event: Stripe.Event;
  try {
    const sig = req.headers["stripe-signature"] as string;
    const buf = await readRawBody(req);
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email ?? "";
        const subscriptionId = session.subscription as string | undefined;

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = sub.items.data[0]?.price?.id ?? null;

          // upsert user -> plan based on price
          const plan =
            priceId === process.env.PRICE_FOUNDER_MONTHLY
              ? "founder"
              : priceId === process.env.PRICE_STANDARD_YEARLY
              ? "pro_yearly"
              : "pro_monthly";

          await supabase
            .from("users")
            .upsert(
              {
                email: customerEmail,
                plan,
                created_at: new Date().toISOString(),
              },
              { onConflict: "email" }
            );

          // Store Stripe token basics if you want (optional)
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = (await stripe.customers.retrieve(
          sub.customer as string
        )) as Stripe.Customer;
        const email = customer.email ?? "";

        const active = sub.status === "active" || sub.status === "trialing";
        const plan = active ? "pro_monthly" : "free";

        await supabase
          .from("users")
          .update({ plan })
          .eq("email", email);

        break;
      }

      default:
        // ignore other events
        break;
    }

    res.json({ received: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message ?? "handler error" });
  }
}