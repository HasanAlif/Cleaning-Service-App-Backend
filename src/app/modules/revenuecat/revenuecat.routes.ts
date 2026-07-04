import express from "express";
import auth from "../../middlewares/auth";
import { revenuecatController } from "./revenuecat.controller";
import { UserRole } from "../../models";

const router = express.Router();

router.post("/webhook", revenuecatController.handleWebhook);

router.post(
  "/sync",
  auth(UserRole.PROVIDER),
  revenuecatController.syncMySubscription,
);

export const revenuecatRoutes = router;
