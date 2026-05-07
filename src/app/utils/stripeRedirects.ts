import config from "../../config";

type RedirectOptions = {
  bookingId?: string;
  sessionParamName?: string; // placeholder name for session id, default {CHECKOUT_SESSION_ID}
};

const normalizeBase = (base?: string) => {
  if (!base) return "";
  return base.replace(/\/+$/, "");
};

export const getBookingRedirectUrls = (opts: RedirectOptions = {}) => {
  const { bookingId = "", sessionParamName = "{CHECKOUT_SESSION_ID}" } = opts;

  const configuredSuccess = config.payment_success_url?.trim();
  const configuredCancel = config.payment_cancel_url?.trim();

  const backendBase =
    normalizeBase(config.backend_url) ||
    normalizeBase(config.frontend_url) ||
    "";

  const successUrl =
    configuredSuccess ||
    `${backendBase}/api/payment/checkout-redirect?bookingId=${bookingId}&status=success&session_id=${sessionParamName}`;

  const cancelUrl =
    configuredCancel ||
    `${backendBase}/api/payment/checkout-redirect?bookingId=${bookingId}&status=cancel&session_id=${sessionParamName}`;

  return { successUrl, cancelUrl };
};

export const getSubscriptionRedirectUrls = (
  opts: { sessionParamName?: string } = {},
) => {
  const { sessionParamName = "{CHECKOUT_SESSION_ID}" } = opts;

  const configuredSuccess = config.payment_success_url?.trim();
  const configuredCancel = config.payment_cancel_url?.trim();

  const backendBase =
    normalizeBase(config.backend_url) ||
    normalizeBase(config.frontend_url) ||
    "";

  // For subscriptions we prefer backend activation endpoint
  const successUrl =
    configuredSuccess ||
    `${backendBase}/api/subscription/activate-from-checkout?session_id=${sessionParamName}`;

  const cancelUrl =
    configuredCancel ||
    `${backendBase}/payment/cancel?session_id=${sessionParamName}`;

  return { successUrl, cancelUrl };
};

export default {
  getBookingRedirectUrls,
  getSubscriptionRedirectUrls,
};
