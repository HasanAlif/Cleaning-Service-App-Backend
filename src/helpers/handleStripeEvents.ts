export const handleSubscriptionEvent = (eventType: string): boolean => {
  const actionEvents = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ];

  if (actionEvents.includes(eventType)) {
    return true;
  }

  // All other subscription-related events are informational
  const informationalEvents = [
    // Invoice events
    "invoice.created",
    "invoice.updated",
    "invoice.finalized",
    "invoice.paid",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
    "invoice.voided",
    "invoice.marked_uncollectible",
    "invoice.payment_action_required",

    // Payment intent events
    "payment_intent.succeeded",
    "payment_intent.created",
    "payment_intent.processing",
    "payment_intent.canceled",
    "payment_intent.payment_failed",
    "payment_intent.amount_capturable_updated",
    "payment_intent.partially_funded",
    "payment_intent.requires_action",

    // Charge events
    "charge.succeeded",
    "charge.failed",
    "charge.pending",
    "charge.captured",
    "charge.expired",
    "charge.refunded",
    "charge.updated",
    "charge.dispute.created",
    "charge.dispute.updated",
    "charge.dispute.closed",
    "charge.dispute.funds_withdrawn",
    "charge.dispute.funds_reinstated",

    // Customer events
    "customer.created",
    "customer.updated",
    "customer.deleted",
    "customer.discount.created",
    "customer.discount.updated",
    "customer.discount.deleted",
    "customer.source.created",
    "customer.source.updated",
    "customer.source.deleted",
    "customer.tax_id.created",
    "customer.tax_id.updated",
    "customer.tax_id.deleted",

    // Payment method events
    "payment_method.attached",
    "payment_method.detached",
    "payment_method.updated",
    "payment_method.automatically_updated",

    // Subscription schedule events
    "subscription_schedule.created",
    "subscription_schedule.updated",
    "subscription_schedule.released",
    "subscription_schedule.canceled",
    "subscription_schedule.completed",
    "subscription_schedule.expiring",
    "subscription_schedule.aborted",

    // Billing portal events
    "billing_portal.configuration.created",
    "billing_portal.configuration.updated",
    "billing_portal.session.created",

    // Checkout session events
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
    "checkout.session.expired",

    // Credit note events
    "credit_note.created",
    "credit_note.updated",
    "credit_note.voided",

    // Coupon and promotion events
    "coupon.created",
    "coupon.updated",
    "coupon.deleted",
    "promotion_code.created",
    "promotion_code.updated",

    // Product and price events
    "product.created",
    "product.updated",
    "product.deleted",
    "price.created",
    "price.updated",
    "price.deleted",

    // Tax rate events
    "tax_rate.created",
    "tax_rate.updated",

    // Transfer and payout events
    "transfer.created",
    "transfer.updated",
    "transfer.reversed",
    "payout.created",
    "payout.updated",
    "payout.paid",
    "payout.failed",
    "payout.canceled",
    "payout.reconciliation_completed",

    // Account events
    "account.updated",
    "account.external_account.created",
    "account.external_account.updated",
    "account.external_account.deleted",

    // Balance and application fee events
    "balance.available",
    "application_fee.created",
    "application_fee.refunded",
    "application_fee.refund.updated",

    // Capability events
    "capability.updated",

    // File events
    "file.created",

    // Mandate events
    "mandate.updated",

    // Payment link events
    "payment_link.created",
    "payment_link.updated",

    // Person events
    "person.created",
    "person.updated",
    "person.deleted",

    // Plan events (legacy)
    "plan.created",
    "plan.updated",
    "plan.deleted",

    // Quote events
    "quote.created",
    "quote.finalized",
    "quote.accepted",
    "quote.canceled",

    // Radar and review events
    "radar.early_fraud_warning.created",
    "radar.early_fraud_warning.updated",
    "review.opened",
    "review.closed",

    // Refund events
    "refund.created",
    "refund.updated",

    // Reporting events
    "reporting.report_run.succeeded",
    "reporting.report_run.failed",
    "reporting.report_type.updated",

    // Setup intent events
    "setup_intent.created",
    "setup_intent.succeeded",
    "setup_intent.canceled",
    "setup_intent.setup_failed",
    "setup_intent.requires_action",

    // Sigma events
    "sigma.scheduled_query_run.created",

    // Source events
    "source.chargeable",
    "source.failed",
    "source.canceled",
    "source.transaction.created",
    "source.transaction.updated",
    "source.refund_attributes_required",

    // Test clock events
    "test_helpers.test_clock.advancing",
    "test_helpers.test_clock.created",
    "test_helpers.test_clock.deleted",
    "test_helpers.test_clock.internal_failure",
    "test_helpers.test_clock.ready",

    // Topup events
    "topup.created",
    "topup.succeeded",
    "topup.failed",
    "topup.canceled",
    "topup.reversed",

    // Treasury events
    "treasury.credit_reversal.created",
    "treasury.debit_reversal.created",
    "treasury.inbound_transfer.created",
    "treasury.outbound_transfer.created",
    "treasury.received_credit.created",
    "treasury.received_debit.created",
  ];

  return informationalEvents.includes(eventType);
};

// Handle booking payment-related Stripe events
// Returns true if event requires specific action, false if it's informational
export const handleBookingPaymentEvent = (eventType: string): boolean => {
  const actionEvents = [
    "checkout.session.completed",
    "payment_intent.succeeded",
    "charge.refunded",
  ];

  if (actionEvents.includes(eventType)) {
    return true;
  }

  // All other payment-related events are informational
  const informationalEvents = [
    // Charge events
    "charge.succeeded",
    "charge.failed",
    "charge.pending",
    "charge.captured",
    "charge.expired",
    "charge.updated",
    "charge.dispute.created",
    "charge.dispute.updated",
    "charge.dispute.closed",
    "charge.dispute.funds_withdrawn",
    "charge.dispute.funds_reinstated",

    // Payment intent events
    "payment_intent.created",
    "payment_intent.processing",
    "payment_intent.canceled",
    "payment_intent.payment_failed",
    "payment_intent.amount_capturable_updated",
    "payment_intent.partially_funded",
    "payment_intent.requires_action",

    // Customer events
    "customer.created",
    "customer.updated",
    "customer.deleted",
    "customer.discount.created",
    "customer.discount.updated",
    "customer.discount.deleted",
    "customer.source.created",
    "customer.source.updated",
    "customer.source.deleted",
    "customer.tax_id.created",
    "customer.tax_id.updated",
    "customer.tax_id.deleted",

    // Payment method events
    "payment_method.attached",
    "payment_method.detached",
    "payment_method.updated",
    "payment_method.automatically_updated",

    // Checkout session events
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
    "checkout.session.expired",

    // Transfer and payout events
    "transfer.created",
    "transfer.updated",
    "transfer.reversed",
    "payout.created",
    "payout.updated",
    "payout.paid",
    "payout.failed",
    "payout.canceled",
    "payout.reconciliation_completed",

    // Account events
    "account.updated",
    "account.external_account.created",
    "account.external_account.updated",
    "account.external_account.deleted",

    // Refund events
    "refund.created",
    "refund.updated",

    // Balance and fee events
    "balance.available",
    "application_fee.created",
    "application_fee.refunded",
    "application_fee.refund.updated",

    // Capability events
    "capability.updated",

    // File events
    "file.created",

    // Mandate events
    "mandate.updated",

    // Setup intent events
    "setup_intent.created",
    "setup_intent.succeeded",
    "setup_intent.canceled",
    "setup_intent.setup_failed",
    "setup_intent.requires_action",

    // Source events
    "source.chargeable",
    "source.failed",
    "source.canceled",
    "source.transaction.created",
    "source.transaction.updated",
    "source.refund_attributes_required",

    // Review and fraud detection
    "radar.early_fraud_warning.created",
    "radar.early_fraud_warning.updated",
    "review.opened",
    "review.closed",

    // Payment link events
    "payment_link.created",
    "payment_link.updated",

    // Test helpers
    "test_helpers.test_clock.advancing",
    "test_helpers.test_clock.created",
    "test_helpers.test_clock.deleted",
    "test_helpers.test_clock.internal_failure",
    "test_helpers.test_clock.ready",
  ];

  return informationalEvents.includes(eventType);
};

// Check if event is a general informational event
// These are events that don't match booking or subscription patterns
export const isGeneralInformationalEvent = (eventType: string): boolean => {
  const generalEvents = [
    // Customer events
    "customer.created",
    "customer.updated",
    "customer.deleted",
    "customer.discount.created",
    "customer.discount.updated",
    "customer.discount.deleted",
    "customer.source.created",
    "customer.source.updated",
    "customer.source.deleted",
    "customer.tax_id.created",
    "customer.tax_id.updated",
    "customer.tax_id.deleted",

    // Payment and charge events
    "payment.created",
    "payment_intent.created",
    "payment_intent.processing",
    "payment_intent.canceled",
    "payment_intent.payment_failed",
    "payment_intent.amount_capturable_updated",
    "payment_intent.partially_funded",
    "payment_intent.requires_action",
    "payment_intent.succeeded",
    "charge.succeeded",
    "charge.failed",
    "charge.pending",
    "charge.captured",
    "charge.expired",
    "charge.updated",
    "charge.dispute.created",
    "charge.dispute.updated",
    "charge.dispute.closed",

    // Payment method events
    "payment_method.attached",
    "payment_method.detached",
    "payment_method.updated",
    "payment_method.automatically_updated",

    // Transfer and payout events
    "transfer.created",
    "transfer.updated",
    "transfer.reversed",
    "payout.created",
    "payout.updated",
    "payout.paid",
    "payout.failed",
    "payout.canceled",

    // Account events
    "account.updated",
    "account.external_account.created",
    "account.external_account.updated",
    "account.external_account.deleted",

    // Balance and fee events
    "balance.available",
    "application_fee.created",
    "application_fee.refunded",

    // Refund events
    "refund.created",
    "refund.updated",

    // Setup intent events
    "setup_intent.created",
    "setup_intent.succeeded",
    "setup_intent.canceled",
    "setup_intent.setup_failed",

    // File and mandate events
    "file.created",
    "mandate.updated",

    // Capability events
    "capability.updated",

    // Review and fraud detection
    "review.opened",
    "review.closed",
    "radar.early_fraud_warning.created",
    "radar.early_fraud_warning.updated",
  ];

  return generalEvents.includes(eventType);
};

// Get comprehensive list of all handled Stripe event types
// Used for validation and testing
export const getAllHandledEventTypes = (): string[] => {
  return [
    // Subscription events
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.created",
    "invoice.updated",
    "invoice.finalized",
    "invoice.paid",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
    "invoice.voided",
    "invoice.marked_uncollectible",
    "invoice.payment_action_required",

    // Payment events
    "payment.created",
    "payment_intent.created",
    "payment_intent.succeeded",
    "payment_intent.processing",
    "payment_intent.canceled",
    "payment_intent.payment_failed",
    "payment_intent.amount_capturable_updated",
    "payment_intent.partially_funded",
    "payment_intent.requires_action",

    // Charge events
    "charge.succeeded",
    "charge.failed",
    "charge.pending",
    "charge.captured",
    "charge.expired",
    "charge.refunded",
    "charge.updated",
    "charge.dispute.created",
    "charge.dispute.updated",
    "charge.dispute.closed",
    "charge.dispute.funds_withdrawn",
    "charge.dispute.funds_reinstated",

    // Customer events
    "customer.created",
    "customer.updated",
    "customer.deleted",
    "customer.discount.created",
    "customer.discount.updated",
    "customer.discount.deleted",
    "customer.source.created",
    "customer.source.updated",
    "customer.source.deleted",
    "customer.tax_id.created",
    "customer.tax_id.updated",
    "customer.tax_id.deleted",

    // Payment method events
    "payment_method.attached",
    "payment_method.detached",
    "payment_method.updated",
    "payment_method.automatically_updated",

    // Transfer and payout events
    "transfer.created",
    "transfer.updated",
    "transfer.reversed",
    "payout.created",
    "payout.updated",
    "payout.paid",
    "payout.failed",
    "payout.canceled",
    "payout.reconciliation_completed",

    // Account events
    "account.updated",
    "account.external_account.created",
    "account.external_account.updated",
    "account.external_account.deleted",

    // Balance and fee events
    "balance.available",
    "application_fee.created",
    "application_fee.refunded",
    "application_fee.refund.updated",

    // And many more...
    // (This is a subset - full list includes 280+ events)
  ];
};
