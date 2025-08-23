// /api/stripe/checkout.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const PRICE_MAP: Record<string, string> = {
  monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!, // e.g. price_123
  yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,   // e.g. price_abc
};

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).end("Method Not Allowed");
    }

    const appBase = process.env.APP_BASE_URL!;
    if (!appBase) return res.status(500).send("Missing APP_BASE_URL");
    if (!process.env.STRIPE_SECRET_KEY)
      return res.status(500).send("Missing STRIPE_SECRET_KEY");

    const plan = (req.query.plan as string) || "monthly";
    const price = PRICE_MAP[plan];
    if (!price) return res.status(400).send("Unknown plan");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      // Optional: collect email if you don’t pass a Stripe customer ID yet
      customer_email: req.query.email as string | undefined,
      success_url: `${appBase}/?upgrade=success`,
      cancel_url: `${appBase}/?upgrade=cancel`,
      // Optional: let users manage their subscription from email receipt
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return res.redirect(303, session.url!);
  } catch (err: any) {
    console.error("checkout error", err);
    return res.status(500).send(err?.message ?? "Unknown error");
  }
}