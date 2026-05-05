import express from "express";
import { stripeConnectController } from "./stripeConnect.controller";
import auth from "../../middlewares/auth";
import { stripeCallbackRateLimiter } from "../../middlewares/rateLimiter";
import { UserRole } from "../../models";

const router = express.Router();

router.post(
  "/onboarding",
  auth(UserRole.PROVIDER, UserRole.OWNER),
  stripeConnectController.createOnboardingLink,
);

router.get(
  "/status",
  auth(UserRole.PROVIDER, UserRole.OWNER),
  stripeConnectController.getAccountStatus,
);

router.get(
  "/dashboard",
  auth(UserRole.PROVIDER, UserRole.OWNER),
  stripeConnectController.getDashboardLink,
);

router.delete(
  "/disconnect",
  auth(UserRole.PROVIDER, UserRole.OWNER),
  stripeConnectController.disconnectAccount,
);

router.post(
  "/complete-callback",
  auth(UserRole.PROVIDER, UserRole.OWNER),
  stripeConnectController.handleOnboardingComplete,
);

router.post(
  "/callback-complete",
  stripeCallbackRateLimiter,
  stripeConnectController.handleRedirectCallback,
);

router.post(
  "/callback-refresh",
  stripeCallbackRateLimiter,
  stripeConnectController.handleRedirectCallback,
);

router.post("/webhook", stripeConnectController.handleWebhook);

export const stripeConnectRoutes = router;
