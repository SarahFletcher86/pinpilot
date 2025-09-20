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
  try {
    console.log('Counting active founder subscriptions...');
    // Count ACTIVE (and trialing) subscriptions on the founder price
    // You can expand statuses if you want to include past_due/unpaid, but active+trialing is sufficient.
    let count = 0;
    let startingAfter: string | undefined = undefined;

    while (true) {
      console.log(`Fetching subscriptions page (count so far: ${count})`);
      const page = await stripe.subscriptions.list({
        price: PRICE.founderMonthly,
        status: "active", // counts active; you can duplicate this call for "trialing" if you want to include trials
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

      count += page.data.length;
      console.log(`Found ${page.data.length} active subscriptions in this page`);

      if (!page.has_more) break;
      startingAfter = page.data[page.data.length - 1].id;
      if (count >= MAX_FOUNDERS) break;
    }

    // OPTIONAL: include trialing as "holding a founder slot"
    // const trialing = await stripe.subscriptions.list({ price: PRICE.founderMonthly, status: "trialing", limit: 1 });
    // count += trialing.data.length;

    console.log(`Total active founder subscriptions: ${count}`);
    return count;
  } catch (error) {
    console.error('Error counting founder subscriptions:', error);
    // Return 0 on error to default to pro pricing
    return 0;
  }
}

export default async function handler(req: any, res: any) {
  try {
    console.log('=== STRIPE CHECKOUT REQUEST ===');
    console.log('Method:', req.method);
    console.log('Query params:', req.query);

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).end("Method Not Allowed");
    }

    // Validate env with detailed logging
    console.log('Validating environment variables...');
    console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✓ Set' : '✗ Missing');
    console.log('STRIPE_PRICE_FOUNDER_MONTHLY:', PRICE.founderMonthly ? '✓ Set' : '✗ Missing');
    console.log('STRIPE_PRICE_PRO_MONTHLY:', PRICE.proMonthly ? '✓ Set' : '✗ Missing');
    console.log('STRIPE_PRICE_PRO_YEARLY:', PRICE.proYearly ? '✓ Set' : '✗ Missing');

    requireEnv(process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY");
    requireEnv(PRICE.founderMonthly, "STRIPE_PRICE_FOUNDER_MONTHLY");
    requireEnv(PRICE.proMonthly, "STRIPE_PRICE_PRO_MONTHLY");
    requireEnv(PRICE.proYearly, "STRIPE_PRICE_PRO_YEARLY");

    console.log('Environment validation passed ✓');

    // Use Vercel's automatic URL detection instead of environment variable
    const appBase = req.headers['x-forwarded-proto'] && req.headers.host
      ? `${req.headers['x-forwarded-proto']}://${req.headers.host}`
      : (process.env.APP_BASE_URL || 'https://pinpilot-seven.vercel.app');

    console.log('App base URL:', appBase);
    const requestedPlan = String(req.query.plan || "auto"); // "auto" | "monthly" | "yearly"

    console.log('Requested plan:', requestedPlan);
    console.log('MAX_FOUNDERS:', MAX_FOUNDERS);

    let chosenPrice = "";
    let planLabel = "";

    if (requestedPlan === "yearly") {
      chosenPrice = PRICE.proYearly;
      planLabel = "pro_yearly";
      console.log('Selected yearly plan');
    } else if (requestedPlan === "monthly") {
      // force monthly pro (use when founders sold out or you want to bypass auto)
      chosenPrice = PRICE.proMonthly;
      planLabel = "pro_monthly";
      console.log('Selected monthly pro plan');
    } else {
      // AUTO mode: try to give Founder price if under cap, else Pro monthly
      console.log('Checking founder availability...');
      try {
        const current = await countActiveFounderSubs();
        console.log('Current founder subscriptions:', current);
        const founderOpen = current < MAX_FOUNDERS;

        if (founderOpen) {
          chosenPrice = PRICE.founderMonthly;
          planLabel = "founder_monthly";
          console.log('Selected founder monthly plan');
        } else {
          chosenPrice = PRICE.proMonthly;
          planLabel = "pro_monthly";
          console.log('Selected pro monthly plan (founders sold out)');
        }
      } catch (countError) {
        console.error('Error counting founder subscriptions:', countError);
        // Fallback to pro monthly if we can't check founder count
        chosenPrice = PRICE.proMonthly;
        planLabel = "pro_monthly";
        console.log('Fallback to pro monthly due to count error');
      }
    }

    console.log('Chosen price ID:', chosenPrice);
    console.log('Plan label:', planLabel);

    // Validate chosen price exists
    if (!chosenPrice) {
      throw new Error('No price ID selected - check environment variables');
    }

    console.log('Creating Stripe checkout session...');
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

    console.log('Stripe session created successfully:', session.id);

    return res.redirect(303, session.url!);
  } catch (err: any) {
    console.error("checkout error", err);
    return res.status(500).send(err?.message ?? "Unknown error");
  }
}