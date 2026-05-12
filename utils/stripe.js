const Stripe = require("stripe");

// Validate environment variable
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY is not set in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia", // Latest stable version as of Feb 2025
  maxNetworkRetries: 2, // Retry failed network requests twice
});

module.exports = stripe;
