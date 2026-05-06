import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { paymentService } from "./payment.service";

const createBookingPayment = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { bookingId } = req.body;

  if (!bookingId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Booking ID is required",
      data: null,
    });
  }

  const result = await paymentService.createBookingPayment(bookingId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      "Payment session created successfully. Please complete payment using the provided URL.",
    data: result,
  });
});

const refundPayment = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { bookingId } = req.body;

  if (!bookingId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Booking ID is required",
      data: null,
    });
  }

  const result = await paymentService.refundBookingPayment(bookingId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Refund processed successfully",
    data: result,
  });
});

const checkRefundEligibility = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { bookingId } = req.params;

    const result = await paymentService.getRefundEligibility(bookingId, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Refund eligibility checked successfully",
      data: result,
    });
  },
);

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Missing stripe signature",
      data: null,
    });
  }

  const result = await paymentService.handleBookingPaymentWebhook(
    signature,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Webhook processed successfully",
    data: result,
  });
});

const getBookingPaymentStatus = catchAsync(
  async (req: Request, res: Response) => {
    const bookingId = req.query.bookingId as string;
    const result = await paymentService.getBookingPaymentStatus(bookingId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Booking payment status retrieved successfully",
      data: result,
    });
  },
);

const handleCheckoutRedirect = catchAsync(
  async (req: Request, res: Response) => {
    const { bookingId, status } = req.query;

    if (!bookingId || typeof bookingId !== "string") {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Booking ID is required",
        data: null,
      });
    }

    if (status !== "success" && status !== "cancel") {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Invalid status",
        data: null,
      });
    }

    const paymentStatus =
      await paymentService.getBookingPaymentStatus(bookingId);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: status === "success",
      message:
        status === "success"
          ? "Payment completed successfully"
          : "Payment was cancelled",
      data: {
        bookingId,
        redirectStatus: status,
        paymentStatus: paymentStatus,
      },
    });
  },
);

export const paymentController = {
  createBookingPayment,
  refundPayment,
  checkRefundEligibility,
  handleWebhook,
  getBookingPaymentStatus,
  handleCheckoutRedirect,
};
