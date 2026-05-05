import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

/**
 * Validate and normalize URL to ensure HTTP/HTTPS protocol is present
 */
const normalizeUrl = (url: string | undefined): string => {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
};

/**
 * Check if using Stripe Live mode
 */
const isStripeLiveMode = (): boolean => {
  const stripeKey = process.env.STRIPE_SECRET_KEY || "";
  return stripeKey.startsWith("sk_live_");
};

/**
 * Validate production environment setup for Stripe Live
 * This runs on server startup to catch configuration errors early
 */
const validateStripeSetup = (): void => {
  const isProduction = process.env.NODE_ENV === "production";
  const isLiveMode = isStripeLiveMode();
  const frontendUrl = process.env.FRONTEND_URL;

  if (isLiveMode && isProduction) {
    // In live mode and production, all URLs must be HTTPS
    if (frontendUrl && frontendUrl.startsWith("http://")) {
      throw new Error(
        "🔒 STRIPE LIVE MODE SECURITY ERROR:\n" +
          "You are using Stripe Live API key with HTTP URLs. This is forbidden.\n\n" +
          "ACTION REQUIRED:\n" +
          "1. Update your .env file with HTTPS URLs:\n" +
          "   - FRONTEND_URL=https://yourdomain.com\n" +
          "   - PAYMENT_SUCCESS_URL=https://yourdomain.com/payment-success\n" +
          "   - PAYMENT_CANCEL_URL=https://yourdomain.com/payment-cancel\n" +
          "2. Ensure your server is behind an HTTPS proxy or has valid SSL certificate\n" +
          "3. Redeploy your application\n\n" +
          "Current FRONTEND_URL: " +
          frontendUrl,
      );
    }

    if (!frontendUrl) {
      throw new Error(
        "📍 STRIPE LIVE MODE CONFIGURATION ERROR:\n" +
          "FRONTEND_URL is not set in your .env file.\n" +
          "This is required when using Stripe Live key.\n\n" +
          "Add to .env:\nFRONTEND_URL=https://yourdomain.com",
      );
    }
  }

  if (isLiveMode && !isProduction) {
    console.warn(
      "\n⚠️  DEVELOPMENT WARNING:\n" +
        "You are using Stripe LIVE key in development mode (NODE_ENV=development).\n" +
        "⚠️  WARNING: This will charge REAL MONEY for test transactions.\n" +
        "Consider switching to sk_test_ key for development.\n",
    );
  }
};

// Validate on startup
validateStripeSetup();

export default {
  env: process.env.NODE_ENV,
  database_url: process.env.DATABASE_URL,
  port: process.env.PORT,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt: {
    jwt_secret: process.env.JWT_SECRET,
    expires_in: process.env.EXPIRES_IN,
    reset_pass_secret: process.env.RESET_PASS_TOKEN,
    reset_pass_token_expires_in: process.env.RESET_PASS_TOKEN_EXPIRES_IN,
  },
  reset_pass_link: process.env.RESET_PASS_LINK,
  emailSender: {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_SECURE,
    user: process.env.MAIL_USER,
    mail: process.env.MAIL_EMAIL,
    pass: process.env.MAIL_APP_PASS,
  },

  stripe_key: process.env.STRIPE_SECRET_KEY,
  stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  stripe_connect_webhook_secret:
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET,
  is_stripe_live_mode: isStripeLiveMode(),
  frontend_url: normalizeUrl(process.env.FRONTEND_URL),
  backend_url: normalizeUrl(process.env.BACKEND_URL),
  payment_success_url: normalizeUrl(process.env.PAYMENT_SUCCESS_URL),
  payment_cancel_url: normalizeUrl(process.env.PAYMENT_CANCEL_URL),

  site_name: process.env.WEBSITE_NAME,
  contact_mail: process.env.CONTACT_MAIL,
};
