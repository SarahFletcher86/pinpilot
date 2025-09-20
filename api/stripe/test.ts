// api/stripe/test.ts - Test Stripe configuration
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export default async function handler(req: any, res: any) {
  try {
    console.log('=== STRIPE TEST REQUEST ===');

    // Check environment variables
    const envStatus = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '✓ Set' : '✗ Missing',
      STRIPE_PRICE_FOUNDER_MONTHLY: process.env.STRIPE_PRICE_FOUNDER_MONTHLY ? '✓ Set' : '✗ Missing',
      STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY ? '✓ Set' : '✗ Missing',
      STRIPE_PRICE_PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY ? '✓ Set' : '✗ Missing',
      APP_BASE_URL: process.env.APP_BASE_URL || 'Not set (using auto-detection)',
    };

    console.log('Environment check:', envStatus);

    // Test Stripe connection
    const balance = await stripe.balance.retrieve();
    console.log('Stripe balance test:', balance);

    // Test price retrieval
    const prices = await stripe.prices.list({ limit: 5 });
    console.log('Stripe prices test:', prices.data.length, 'prices found');

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envStatus,
      stripeConnection: 'working',
      pricesCount: prices.data.length
    });

  } catch (error: any) {
    console.error('Stripe test error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}