import mongoose from "mongoose";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { User } from "../../models/User.model";
import { fileUploader } from "../../../helpers/fileUploader";
import {
  isValidStripeCountry,
  normalizeCountryCode,
  getCountryErrorMessage,
} from "../../../app/utils/stripeCountries";

interface IProviderProfileUpdate {
  userName?: string;
  phoneNumber?: string;
  address?: string;
  aboutMe?: string;
  experience?: string;
  latitude?: number;
  longitude?: number;
  country?: string; // Stripe Connect required country
}

interface IOwnerProfileUpdate {
  userName?: string;
  phoneNumber?: string;
  address?: string;
  country?: string; // Stripe Connect required country (if owner has provider capabilities)
}

const getProviderProfile = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user ID");
  }
  const user = await User.findById(userId).select(
    "profilePicture userName phoneNumber email address aboutMe experience role referralCode credits country",
  );

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role !== "PROVIDER") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only providers can access provider profile",
    );
  }

  return {
    _id: user._id,
    profilePicture: user.profilePicture,
    userName: user.userName,
    phoneNumber: user.phoneNumber,
    email: user.email,
    address: user.address,
    aboutMe: user.aboutMe,
    experience: user.experience,
    referralCode: user.referralCode,
    credits: user.credits || 0,
    country: user.country || null,
  };
};

const providerProfileInformation = async (
  userId: string,
  payload: IProviderProfileUpdate,
  file?: Express.Multer.File,
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user ID");
  }

  // Check if at least one field or file is provided for update
  const hasPayloadFields = payload && Object.keys(payload).length > 0;
  if (!hasPayloadFields && !file) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "At least one field or profile image is required for update",
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role !== "PROVIDER") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only providers can update provider profile",
    );
  }

  // Validate country if provided
  if (payload?.country) {
    const normalizedCountry = normalizeCountryCode(payload.country);
    if (!normalizedCountry) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        getCountryErrorMessage(payload.country),
      );
    }
    // Update payload with normalized country code
    payload.country = normalizedCountry;
  }

  let profileImageUrl = user.profilePicture || "";

  if (file) {
    try {
      // Upload new profile image first
      const result = await fileUploader.uploadToCloudinary(
        file,
        "profile-pictures",
      );
      profileImageUrl = result?.Location || "";

      // Delete old profile image only after successful upload
      if (user.profilePicture && profileImageUrl) {
        try {
          await fileUploader.deleteFromCloudinary(user.profilePicture);
        } catch (deleteError) {
          console.error("Failed to delete old profile image:", deleteError);
        }
      }
    } catch (error) {
      console.error("Profile image upload error:", error);
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to upload profile image",
      );
    }
  }

  const updateData: any = {
    ...(payload || {}),
  };

  if (file && profileImageUrl) {
    updateData.profilePicture = profileImageUrl;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
    select:
      "profilePicture userName phoneNumber email address aboutMe experience role country",
  });

  if (!updatedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "Failed to update user profile");
  }

  return {
    _id: updatedUser._id,
    profilePicture: updatedUser.profilePicture,
    userName: updatedUser.userName,
    phoneNumber: updatedUser.phoneNumber,
    email: updatedUser.email,
    address: updatedUser.address,
    aboutMe: updatedUser.aboutMe,
    experience: updatedUser.experience,
    country: updatedUser.country || null,
  };
};

const getOwnerProfile = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user ID");
  }
  const user = await User.findById(userId).select(
    "profilePicture userName phoneNumber address role referralCode credits country",
  );

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role !== "OWNER") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only owners can access owner profile",
    );
  }

  return {
    _id: user._id,
    profilePicture: user.profilePicture,
    userName: user.userName,
    phoneNumber: user.phoneNumber,
    address: user.address,
    referralCode: user.referralCode,
    credits: user.credits || 0,
    country: user.country || null,
  };
};

const ownerProfileInformation = async (
  userId: string,
  payload: IOwnerProfileUpdate,
  file?: Express.Multer.File,
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user ID");
  }

  // Check if at least one field or file is provided for update
  const hasPayloadFields = payload && Object.keys(payload).length > 0;
  if (!hasPayloadFields && !file) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "At least one field or profile image is required for update",
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role !== "OWNER") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only owners can update owner profile",
    );
  }

  // Validate country if provided
  if (payload?.country) {
    const normalizedCountry = normalizeCountryCode(payload.country);
    if (!normalizedCountry) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        getCountryErrorMessage(payload.country),
      );
    }
    // Update payload with normalized country code
    payload.country = normalizedCountry;
  }

  let profileImageUrl = user.profilePicture || "";

  if (file) {
    try {
      const result = await fileUploader.uploadToCloudinary(
        file,
        "profile-pictures",
      );
      profileImageUrl = result?.Location || "";

      if (user.profilePicture && profileImageUrl) {
        try {
          await fileUploader.deleteFromCloudinary(user.profilePicture);
        } catch (deleteError) {
          console.error("Failed to delete old profile image:", deleteError);
        }
      }
    } catch (error) {
      console.error("Profile image upload error:", error);
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to upload profile image",
      );
    }
  }

  const updateData: any = {
    ...(payload || {}),
  };

  if (file && profileImageUrl) {
    updateData.profilePicture = profileImageUrl;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
    select: "profilePicture userName phoneNumber address role country",
  });

  if (!updatedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "Failed to update user profile");
  }

  return {
    _id: updatedUser._id,
    profilePicture: updatedUser.profilePicture,
    userName: updatedUser.userName,
    phoneNumber: updatedUser.phoneNumber,
    address: updatedUser.address,
    country: updatedUser.country || null,
  };
};

const updateLocationAndAddress = async (
  userId: string,
  address: string,
  lattitude: number,
  longitude: number,
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user ID");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      address,
      lattitude,
      longitude,
    },
    { new: true, runValidators: true },
  );

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return {
    _id: user._id,
    address: user.address,
    lattitude: user.lattitude,
    longitude: user.longitude,
  };
};

export const profileService = {
  providerProfileInformation,
  getProviderProfile,
  getOwnerProfile,
  ownerProfileInformation,
  updateLocationAndAddress,
};
