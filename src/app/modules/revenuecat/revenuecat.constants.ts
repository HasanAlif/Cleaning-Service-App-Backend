import { SubscriptionPlan } from "../../models/Subscription.model";

export const RC_ENTITLEMENT_TO_PLAN: Record<string, SubscriptionPlan> = {
  silver: SubscriptionPlan.SILVER,
  gold: SubscriptionPlan.GOLD,
  platinum: SubscriptionPlan.PLATINUM,
};

export const RC_PRODUCT_TO_PLAN: Record<string, SubscriptionPlan> = {
  "silver_tier:silver-monthly": SubscriptionPlan.SILVER,
  "silver_tier:silver-yearly": SubscriptionPlan.SILVER,
  "gold_tier:gold-monthly": SubscriptionPlan.GOLD,
  "gold_tier:gold-yearly": SubscriptionPlan.GOLD,
  "platinum_tier:platinum-monthly": SubscriptionPlan.PLATINUM,
  "platinum_tier:platinum-6month": SubscriptionPlan.PLATINUM,
};

export const PLAN_RANK: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 0,
  [SubscriptionPlan.SILVER]: 1,
  [SubscriptionPlan.GOLD]: 2,
  [SubscriptionPlan.PLATINUM]: 3,
};

export const RC_REVENUE_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "NON_RENEWING_PURCHASE",
]);

export const RC_CANCELLATION_EVENT = "CANCELLATION";
export const RC_REFUND_CANCEL_REASON = "CUSTOMER_SUPPORT";
