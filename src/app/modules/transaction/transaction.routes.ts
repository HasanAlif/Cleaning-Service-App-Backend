import express from "express";
import auth from "../../middlewares/auth";
import * as transactionController from "./transaction.controller";

const router = express.Router();

/**
 * User routes - accessible to all authenticated users
 */

// Get my transaction history
router.get(
  "/my-transactions",
  auth("OWNER", "PROVIDER"),
  transactionController.getMyTransactions
);

/**
 * Admin routes - accessible only to admins
 */

// Get all transactions with filters
router.get(
  "/admin/all",
  auth("ADMIN", "SUPER_ADMIN"),
  transactionController.getAllTransactions
);

// Get transaction statistics
router.get(
  "/admin/stats",
  auth("ADMIN", "SUPER_ADMIN"),
  transactionController.getTransactionStats
);

// Get revenue statistics
router.get(
  "/admin/revenue",
  auth("ADMIN"),
  transactionController.getRevenueStats
);

// Get booking payment transaction history (ALL booking payment transactions)
router.get(
  "/booking-payments",
  auth("ADMIN"),
  transactionController.getBookingPaymentHistory
);

export const transactionRoutes = router;
