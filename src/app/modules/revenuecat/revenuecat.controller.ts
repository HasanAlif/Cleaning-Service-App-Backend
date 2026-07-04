import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { revenuecatService } from "./revenuecat.service";

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!revenuecatService.verifyWebhookAuthHeader(authHeader)) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "Invalid webhook authorization",
      data: null,
    });
  }

  const event = req.body?.event;

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Webhook received",
    data: { received: true },
  });

  if (event && event.id) {
    revenuecatService.processWebhookEvent(event).catch((error) => {
      console.error("[RevenueCat] Failed to process webhook event:", error);
    });
  }
});

const syncMySubscription = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const result = await revenuecatService.syncSubscriberToDb(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription synced with RevenueCat",
    data: result,
  });
});

export const revenuecatController = {
  handleWebhook,
  syncMySubscription,
};
