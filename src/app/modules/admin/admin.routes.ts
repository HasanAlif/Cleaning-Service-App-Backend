import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { adminController } from "./admin.controller";
import { adminValidation } from "./admin.validation";
import { UserRole } from "../../models";
import multer from "multer";

// Create a custom multer configuration for categories
const storage = multer.memoryStorage();
const categoryUpload = multer({ storage });

// Middleware that allows any fields (for text fields like 'name') plus optional 'image' field
const categoryFileUpload = categoryUpload.fields([
  { name: "image", maxCount: 1 }, // Optional image field
]);

const router = express.Router();

// Statistics route
router.get("/statistics", auth(UserRole.ADMIN), adminController.getTotalCount);

router.get(
  "/recent-users",
  auth(UserRole.ADMIN),
  adminController.getRecentUsers
);

router.get("/owners", auth(UserRole.ADMIN), adminController.getAllOwners);

router.get(
  "/owners/profile-status",
  auth(UserRole.ADMIN),
  adminController.getOwnerProfileStatus
);

router.get(
  "/providers/profile-status",
  auth(UserRole.ADMIN),
  adminController.getProviderProfileStatus
);

router.get("/providers", auth(UserRole.ADMIN), adminController.getAllProviders);

router.get(
  "/search/:searchTerm",
  auth(UserRole.ADMIN),
  validateRequest(adminValidation.searchUsersSchema),
  adminController.searchUsers
);

router.get(
  "/bookings/search/:searchTerm",
  auth(UserRole.ADMIN),
  validateRequest(adminValidation.searchBookingRequestsSchema),
  adminController.searchBookingRequests
);

router.get(
  "/bookings",
  auth(UserRole.ADMIN),
  adminController.getBookingRequestOverview
);

router.get(
  "/bookings/:bookingId",
  auth(UserRole.ADMIN),
  validateRequest(adminValidation.getBookingUserOverviewSchema),
  adminController.getBookingUserOverview
);

router.get(
  "/account-suspension",
  auth(UserRole.ADMIN),
  adminController.getBookingDetailsForSuspension
);

// Category management routes
router.post(
  "/categories",
  auth(UserRole.ADMIN),
  categoryFileUpload,
  validateRequest(adminValidation.createCategorySchema),
  adminController.createCategory
);

router.get(
  "/categories",
  auth(UserRole.ADMIN),
  validateRequest(adminValidation.getCategoriesQuerySchema),
  adminController.getCategories
);

router.get(
  "/categories/:id",
  auth(UserRole.ADMIN),
  validateRequest(adminValidation.getCategorySchema),
  adminController.getCategoryById
);

router.put(
  "/categories/:id",
  auth(UserRole.ADMIN),
  categoryFileUpload,
  validateRequest(adminValidation.updateCategorySchema),
  adminController.updateCategory
);

router.delete(
  "/categories/:id",
  auth(UserRole.ADMIN),
  validateRequest(adminValidation.deleteCategorySchema),
  adminController.deleteCategory
);

router.get(
  "/users/:id",
  auth(UserRole.ADMIN),
  validateRequest(adminValidation.getUserSchema),
  adminController.getIndividualUserDetails
);

router.patch(
  "/users/status/:id",
  auth(UserRole.ADMIN),
  validateRequest(adminValidation.changeUserStatusSchema),
  adminController.changeUserStatus
);

export const adminRoutes = router;
