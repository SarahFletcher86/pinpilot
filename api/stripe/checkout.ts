// /api/stripe/checkout.ts
// Creates a Stripe Checkout Session for subscription.
// Auto-enforces "first MAX_FOUNDERS @ $5" then falls back to $10,
// and supports ?plan=yearly to use the yearly price.

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

const MAX_FOUNDERS = Number(process.env.MAX_FOUNDERS ?? 20);

const PRICE = {
  founderMonthly: process.env.STRIPE_PRICE_FOUNDER_MONTHLY as string,
  proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY as string,
  proYearly: process.env.STRIPE_PRICE_PRO_YEARLY as string,
};

function requireEnv(v?: string, name?: string) {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function countActiveFounderSubs(): Promise<number> {
  // Count ACTIVE (and trialing) subscriptions on the founder price
  // You can expand statuses if you want to include past_due/unpaid, but active+trialing is sufficient.
  let count = 0;
  let startingAfter: string | undefined = undefined;

  while (true) {
    const page = await stripe.subscriptions.list({
      price: PRICE.founderMonthly,
      status: "active", // counts active; you can duplicate this call for "trialing" if you want to include trials
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    count += page.data.length;

    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1].id;
    if (count >= MAX_FOUNDERS) break;
  }

  // OPTIONAL: include trialing as "holding a founder slot"
  // const trialing = await stripe.subscriptions.list({ price: PRICE.founderMonthly, status: "trialing", limit: 1 });
  // count += trialing.data.length;

  return count;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).end("Method Not Allowed");
    }

    // Validate env
    requireEnv(process.env.APP_BASE_URL, "APP_BASE_URL");
    requireEnv(process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY");
    requireEnv(PRICE.founderMonthly, "STRIPE_PRICE_FOUNDER_MONTHLY");
    requireEnv(PRICE.proMonthly, "STRIPE_PRICE_PRO_MONTHLY");
    requireEnv(PRICE.proYearly, "STRIPE_PRICE_PRO_YEARLY");

    const appBase = process.env.APP_BASE_URL!;
    const requestedPlan = String(req.query.plan || "auto"); // "auto" | "monthly" | "yearly"

    let chosenPrice = "";
    let planLabel = "";

    if (requestedPlan === "yearly") {
      chosenPrice = PRICE.proYearly;
      planLabel = "pro_yearly";
    } else if (requestedPlan === "monthly") {
      // force monthly pro (use when founders sold out or you want to bypass auto)
      chosenPrice = PRICE.proMonthly;
      planLabel = "pro_monthly";
    } else {
      // AUTO mode: try to give Founder price if under cap, else Pro monthly
      const current = await countActiveFounderSubs();
      const founderOpen = current < MAX_FOUNDERS;

      if (founderOpen) {
        chosenPrice = PRICE.founderMonthly;
        planLabel = "founder_monthly";
      } else {
        chosenPrice = PRICE.proMonthly;
        planLabel = "pro_monthly";
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: chosenPrice, quantity: 1 }],
      success_url: `${appBase}/?upgrade=success`,
      cancel_url: `${appBase}/?upgrade=cancel`,
      allow_promotion_codes: true,
      // If you don't have an authenticated user yet, Stripe will collect email:
      customer_email: req.query.email as string | undefined,
      metadata: { plan_label: planLabel },
    });

    return res.redirect(303, session.url!);
  } catch (err: any) {
    console.error("checkout error", err);
    return res.status(500).send(err?.message ?? "Unknown error");
  }
}