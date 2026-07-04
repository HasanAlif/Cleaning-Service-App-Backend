import crypto from "crypto";
import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errors/ApiErrors";
import config from "../../../config";
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  PLAN_LIMITS,
  PLAN_PRICES,
} from "../../models/Subscription.model";
import { User } from "../../models/User.model";
import { NotificationType } from "../../models";
import { notificationService } from "../notification/notification.service";
import { transactionService } from "../transaction/transaction.service";
import { RevenueCatEvent } from "./revenuecat.model";
import {
  RC_ENTITLEMENT_TO_PLAN,
  RC_PRODUCT_TO_PLAN,
  PLAN_RANK,
  RC_REVENUE_EVENTS,
  RC_CANCELLATION_EVENT,
  RC_REFUND_CANCEL_REASON,
} from "./revenuecat.constants";

// ---- RevenueCat REST API response shapes (v1 /subscribers) ----
interface RCEntitlement {
  expires_date: string | null;
  grace_period_expires_date?: string | null;
  purchase_date?: string | null;
  product_identifier?: string;
}

interface RCSubscriptionInfo {
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
  purchase_date?: string | null;
  original_purchase_date?: string | null;
  store?: string;
  is_sandbox?: boolean;
  unsubscribe_detected_at?: string | null;
  billing_issues_detected_at?: string | null;
}

interface RCSubscriber {
  entitlements?: Record<string, RCEntitlement>;
  subscriptions?: Record<string, RCSubscriptionInfo>;
  original_app_user_id?: string;
  management_url?: string | null; // store URL to manage/cancel; null if no active sub
}

interface RCSubscriberResponse {
  subscriber?: RCSubscriber;
}

interface ResolvedEntitlement {
  plan: SubscriptionPlan;
  entitlementId: string;
  productId?: string;
  endDate: Date;
  gracePeriodExpiresDate?: Date;
}

const verifyWebhookAuthHeader = (header?: string): boolean => {
  const expected = config.revenuecat.webhook_auth;
  if (!expected || !header) return false;

  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
};

const fetchSubscriberStatus = async (
  appUserId: string,
): Promise<RCSubscriber | null> => {
  const apiKey = config.revenuecat.api_key;
  if (!apiKey) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "RevenueCat API key not configured",
    );
  }

  const url = `${config.revenuecat.api_url}/v1/subscribers/${encodeURIComponent(
    appUserId,
  )}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      `RevenueCat subscriber fetch failed (${response.status}): ${text}`,
    );
  }

  const data = (await response.json()) as RCSubscriberResponse;
  return data.subscriber || null;
};

const isEntitlementActive = (ent: RCEntitlement): boolean => {
  if (ent.expires_date === null) return true;

  const now = Date.now();
  const exp = ent.expires_date ? new Date(ent.expires_date).getTime() : 0;
  const grace = ent.grace_period_expires_date
    ? new Date(ent.grace_period_expires_date).getTime()
    : 0;

  return exp > now || grace > now;
};

const resolveActiveEntitlement = (
  subscriber: RCSubscriber,
): ResolvedEntitlement | null => {
  const entitlements = subscriber.entitlements || {};
  let best: ResolvedEntitlement | null = null;

  for (const [entitlementId, ent] of Object.entries(entitlements)) {
    if (!isEntitlementActive(ent)) continue;

    const plan =
      RC_ENTITLEMENT_TO_PLAN[entitlementId] ||
      (ent.product_identifier
        ? RC_PRODUCT_TO_PLAN[ent.product_identifier]
        : undefined);

    if (!plan) continue;

    let endDate: Date;
    if (ent.expires_date === null) {
      endDate = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
    } else {
      const exp = ent.expires_date ? new Date(ent.expires_date).getTime() : 0;
      const grace = ent.grace_period_expires_date
        ? new Date(ent.grace_period_expires_date).getTime()
        : 0;
      endDate = new Date(Math.max(exp, grace));
    }

    if (!best || PLAN_RANK[plan] > PLAN_RANK[best.plan]) {
      best = {
        plan,
        entitlementId,
        productId: ent.product_identifier,
        endDate,
        gracePeriodExpiresDate: ent.grace_period_expires_date
          ? new Date(ent.grace_period_expires_date)
          : undefined,
      };
    }
  }

  return best;
};

const syncSubscriberToDb = async (appUserId: string) => {
  if (!mongoose.isValidObjectId(appUserId)) {
    console.warn(
      `[RevenueCat] app_user_id is not a valid user id, skipping: ${appUserId}`,
    );
    return { userFound: false, applied: false, reason: "invalid app_user_id" };
  }

  const user = await User.findById(appUserId);
  if (!user) {
    console.warn(`[RevenueCat] No user found for app_user_id: ${appUserId}`);
    return { userFound: false, applied: false, reason: "user not found" };
  }

  if (user.role !== "PROVIDER") {
    return {
      userFound: true,
      applied: false,
      reason: "user is not a provider",
    };
  }

  const subscriber = await fetchSubscriberStatus(appUserId);
  const active = subscriber ? resolveActiveEntitlement(subscriber) : null;

  const subInfo =
    active && active.productId && subscriber?.subscriptions
      ? subscriber.subscriptions[active.productId]
      : undefined;

  const existingRcSub = await Subscription.findOne({
    revenueCatAppUserId: appUserId,
    provider: "revenuecat",
  }).sort({ createdAt: -1 });

  if (active) {
    await Subscription.updateMany(
      {
        userId: user._id,
        status: SubscriptionStatus.ACTIVE,
        ...(existingRcSub ? { _id: { $ne: existingRcSub._id } } : {}),
      },
      {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: "Replaced by RevenueCat subscription",
      },
    );

    const commonFields = {
      userId: user._id,
      plan: active.plan,
      status: SubscriptionStatus.ACTIVE,
      provider: "revenuecat" as const,
      revenueCatAppUserId: appUserId,
      revenueCatEntitlementId: active.entitlementId,
      revenueCatProductId: active.productId,
      amount: PLAN_PRICES[active.plan],
      currency: "EUR",
      endDate: active.endDate,
      autoRenew: subInfo?.unsubscribe_detected_at ? false : true,
      store: subInfo?.store,
      isSandbox: subInfo?.is_sandbox,
      unsubscribeDetectedAt: subInfo?.unsubscribe_detected_at
        ? new Date(subInfo.unsubscribe_detected_at)
        : undefined,
      billingIssuesDetectedAt: subInfo?.billing_issues_detected_at
        ? new Date(subInfo.billing_issues_detected_at)
        : undefined,
      gracePeriodExpiresDate: active.gracePeriodExpiresDate,
    };

    let subscription;
    if (existingRcSub) {
      Object.assign(existingRcSub, commonFields);
      subscription = await existingRcSub.save();
    } else {
      subscription = await Subscription.create({
        ...commonFields,
        startDate: subInfo?.original_purchase_date
          ? new Date(subInfo.original_purchase_date)
          : new Date(),
      });
    }

    const previousPlan = user.plan;
    await User.findByIdAndUpdate(user._id, {
      plan: active.plan,
      badge: PLAN_LIMITS[active.plan].badge,
      bookingLimitExceeded: false,
    });

    if (previousPlan !== active.plan) {
      await notificationService.createNotification({
        recipientId: user._id.toString(),
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "Subscription Activated! 🎉",
        message: `Your ${active.plan} subscription is now active. Enjoy your premium benefits!`,
        data: { plan: active.plan, provider: "revenuecat" },
      });
    }

    return {
      userFound: true,
      applied: true,
      plan: active.plan,
      status: SubscriptionStatus.ACTIVE,
      subscriptionId: subscription._id.toString(),
    };
  }

  if (existingRcSub && existingRcSub.status === SubscriptionStatus.ACTIVE) {
    existingRcSub.status = SubscriptionStatus.EXPIRED;
    existingRcSub.cancelledAt = new Date();
    await existingRcSub.save();

    const previousPlan = user.plan;

    await User.findByIdAndUpdate(user._id, {
      plan: SubscriptionPlan.FREE,
      badge: null,
    });

    if (previousPlan && previousPlan !== SubscriptionPlan.FREE) {
      await notificationService.createNotification({
        recipientId: user._id.toString(),
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "Subscription Ended",
        message:
          "Your subscription has ended and you've been moved to the FREE plan. Subscribe again anytime to restore premium features!",
        data: {
          previousPlan,
          currentPlan: SubscriptionPlan.FREE,
          provider: "revenuecat",
        },
      });
    }

    return {
      userFound: true,
      applied: true,
      plan: SubscriptionPlan.FREE,
      status: "FREE",
    };
  }

  return {
    userFound: true,
    applied: false,
    reason: "no active RevenueCat entitlement",
  };
};

const resolveUserIdFromEvent = async (event: any): Promise<string | null> => {
  const candidates: string[] = [];
  if (event?.app_user_id) candidates.push(String(event.app_user_id));
  if (event?.original_app_user_id)
    candidates.push(String(event.original_app_user_id));
  if (Array.isArray(event?.aliases)) {
    for (const alias of event.aliases) {
      if (alias) candidates.push(String(alias));
    }
  }

  for (const id of candidates) {
    if (!mongoose.isValidObjectId(id)) continue;
    const exists = await User.exists({ _id: id });
    if (exists) return id;
  }
  return null;
};

const mapPlanFromEvent = (event: any): SubscriptionPlan | undefined => {
  const byProduct = event?.product_id
    ? RC_PRODUCT_TO_PLAN[event.product_id]
    : undefined;
  if (byProduct) return byProduct;

  const entitlementIds: string[] = Array.isArray(event?.entitlement_ids)
    ? event.entitlement_ids
    : [];
  let best: SubscriptionPlan | undefined;
  for (const id of entitlementIds) {
    const plan = RC_ENTITLEMENT_TO_PLAN[id];
    if (plan && (!best || PLAN_RANK[plan] > PLAN_RANK[best])) best = plan;
  }
  return best;
};

const eventDate = (event: any): Date =>
  typeof event?.event_timestamp_ms === "number"
    ? new Date(event.event_timestamp_ms)
    : new Date();

const buildMoneyMetadata = (event: any) => ({
  environment: event?.environment,
  isSandbox: event?.environment === "SANDBOX",
  store: event?.store,
  productId: event?.product_id,
  periodType: event?.period_type,
  isTrialConversion: event?.is_trial_conversion,
  price: event?.price,
  priceInPurchasedCurrency: event?.price_in_purchased_currency,
  storeCurrency: event?.currency,
  taxPercentage: event?.tax_percentage,
  commissionPercentage: event?.commission_percentage,
});

const recordEventRevenue = async (event: any, userId: string) => {
  const type = event?.type;

  const user = await User.findById(userId).select("role");
  if (!user || user.role !== "PROVIDER") return;

  if (
    type === RC_CANCELLATION_EVENT &&
    event?.cancel_reason === RC_REFUND_CANCEL_REASON
  ) {
    const plan = mapPlanFromEvent(event);
    await transactionService.recordRevenueCatSubscriptionRefund({
      userId,
      plan,
      eventId: event.id,
      amount: plan ? PLAN_PRICES[plan] : 0,
      refundedAt: eventDate(event),
      storeTransactionId: event.transaction_id,
      originalTransactionId: event.original_transaction_id,
      metadata: buildMoneyMetadata(event),
    });
    return;
  }

  if (!RC_REVENUE_EVENTS.has(type)) return;

  const price = typeof event?.price === "number" ? event.price : 0;
  if (event?.period_type === "TRIAL" || price <= 0) return;

  const plan = mapPlanFromEvent(event);
  if (!plan) {
    console.warn(
      `[RevenueCat] Revenue event ${event.id} has unmapped product/entitlement; skipping revenue row`,
    );
    return;
  }

  const rcSub = await Subscription.findOne({
    revenueCatAppUserId: userId,
    provider: "revenuecat",
  })
    .sort({ createdAt: -1 })
    .select("_id");

  await transactionService.recordRevenueCatSubscriptionPayment({
    userId,
    plan,
    subscriptionId: rcSub?._id?.toString(),
    eventId: event.id,
    eventType: type,
    isRenewal: type === "RENEWAL",
    amount: PLAN_PRICES[plan],
    completedAt: eventDate(event),
    storeTransactionId: event.transaction_id,
    originalTransactionId: event.original_transaction_id,
    metadata: buildMoneyMetadata(event),
  });
};

const getManagementUrl = async (appUserId: string): Promise<string | null> => {
  const subscriber = await fetchSubscriberStatus(appUserId);
  return subscriber?.management_url ?? null;
};

const processWebhookEvent = async (event: any) => {
  const eventId = event?.id;
  if (!eventId) {
    console.warn("[RevenueCat] Received event without id, skipping");
    return;
  }

  try {
    await RevenueCatEvent.create({
      eventId,
      type: event.type,
      appUserId: event.app_user_id,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return;
    }
    throw error;
  }

  try {
    const userId = await resolveUserIdFromEvent(event);
    if (!userId) {
      console.warn(
        `[RevenueCat] Event ${eventId} (${event.type}) has no resolvable user; skipping`,
      );
      return;
    }

    await syncSubscriberToDb(userId);

    await recordEventRevenue(event, userId);
  } catch (error) {
    await RevenueCatEvent.deleteOne({ eventId }).catch(() => {});
    throw error;
  }
};

export const revenuecatService = {
  verifyWebhookAuthHeader,
  fetchSubscriberStatus,
  syncSubscriberToDb,
  processWebhookEvent,
  getManagementUrl,
};
