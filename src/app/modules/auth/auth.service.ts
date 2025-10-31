import * as bcrypt from "bcrypt";
import crypto from "crypto";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import mongoose from "mongoose";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import emailSender from "../../../shared/emailSender";
import { User, UserRole, UserStatus, RegistrationStatus } from "../../models";
import { fileUploader } from "../../../helpers/fileUploader";
import { generateOTPString } from "../../../utils/GenerateOTP";
import {
  EMAIL_VERIFICATION_TEMPLATE,
  PASSWORD_RESET_TEMPLATE,
  WELCOME_COMPLETE_TEMPLATE,
} from "../../../utils/Template";

const registerUser = async (userData: any) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { phoneNumber: userData.phoneNumber }],
    });

    if (existingUser) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "User already exists with this email or phone number"
      );
    }

    const emailOtp = generateOTPString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const hashedPassword = await bcrypt.hash(
      userData.password,
      Number(config.bcrypt_salt_rounds)
    );

    const userPayload = {
      userName: userData.userName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      password: hashedPassword,
      referralCode: userData.referralCode,
      status: UserStatus.INACTIVE, // Default to inactive until verified
      registrationStatus: RegistrationStatus.PARTIAL, // Initial registration step
      emailVerificationOtp: emailOtp,
      emailVerificationOtpExpiry: otpExpiry,
    };

    const [newUser] = await User.create([userPayload], { session });

    await session.commitTransaction();

    try {
      const emailTemplate = EMAIL_VERIFICATION_TEMPLATE(
        emailOtp,
        userData.userName
      );
      await emailSender(
        userData.email,
        emailTemplate,
        "Verify Your Email - Cleaning Service 🧹"
      );
    } catch (emailError) {
      console.error("Email sending error:", emailError);
    }

    // Remove sensitive fields from response
    const { password, emailVerificationOtp, ...userWithoutSensitiveData } =
      newUser.toObject();

    return {
      user: userWithoutSensitiveData,
      otp: process.env.NODE_ENV === "development" ? emailOtp : undefined, // Only return OTP in development
      message:
        "Registration Initially successful. Please verify your email with the OTP sent to your email address.",
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const verifyOtp = async (payload: {
  email: string;
  otp: string;
  otpType: string;
}) => {
  const user = await User.findOne({
    email: payload.email,
    isDeleted: { $ne: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  let isValidOtp = false;
  let otpExpiry: Date | undefined;

  switch (payload.otpType) {
    case "VERIFY_EMAIL":
      // Check if user has already completed registration
      if (user.registrationStatus === RegistrationStatus.COMPLETED) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Your email is already verified and registration is complete. Please login instead."
        );
      }

      // Check if user's registration status is PARTIAL (needs email verification)
      if (user.registrationStatus !== RegistrationStatus.PARTIAL) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Invalid registration flow. Please contact support."
        );
      }

      isValidOtp = user.emailVerificationOtp?.trim() === payload.otp?.trim();
      otpExpiry = user.emailVerificationOtpExpiry;
      break;
    case "RESET_PASSWORD":
      isValidOtp = user.resetPasswordOtp?.trim() === payload.otp?.trim();
      otpExpiry = user.resetPasswordOtpExpiry;
      break;
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP type");
  }

  if (!isValidOtp || !otpExpiry || otpExpiry < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
  }

  if (payload.otpType === "VERIFY_EMAIL") {
    user.isEmailVerified = true;
    user.registrationStatus = RegistrationStatus.EMAIL_VERIFIED;
    user.emailVerificationOtp = undefined;
    user.emailVerificationOtpExpiry = undefined;
    await user.save();
  }

  const {
    password,
    emailVerificationOtp,
    resetPasswordOtp,
    ...userWithoutSensitiveData
  } = user.toObject();

  return {
    user: userWithoutSensitiveData,
    message: "OTP verified successfully",
  };
};

const completeRegistration = async (registrationData: any, files: any) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findOne({
      email: registrationData.email,
      registrationStatus: RegistrationStatus.EMAIL_VERIFIED,
      isDeleted: { $ne: true },
    }).session(session);

    if (!user) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "User not found or email not verified. Please verify your email first."
      );
    }

    // Check OTP again for security
    if (user.emailVerificationOtp !== registrationData.otp) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid OTP for registration completion"
      );
    }

    // Upload files to Cloudinary if provided
    let profilePictureUrl = "";
    let nidFrontUrl = "";
    let nidBackUrl = "";
    let selfieWithNIDUrl = "";

    if (files) {
      if (files.profilePicture && files.profilePicture[0]) {
        const profileResult = await fileUploader.uploadToCloudinary(
          files.profilePicture[0]
        );
        profilePictureUrl = profileResult?.Location || "";
      }

      if (files.NIDFront && files.NIDFront[0]) {
        const nidFrontResult = await fileUploader.uploadToCloudinary(
          files.NIDFront[0]
        );
        nidFrontUrl = nidFrontResult?.Location || "";
      }

      if (files.NIDBack && files.NIDBack[0]) {
        const nidBackResult = await fileUploader.uploadToCloudinary(
          files.NIDBack[0]
        );
        nidBackUrl = nidBackResult?.Location || "";
      }

      if (files.selfieWithNID && files.selfieWithNID[0]) {
        const selfieWithNIDResult = await fileUploader.uploadToCloudinary(
          files.selfieWithNID[0]
        );
        selfieWithNIDUrl = selfieWithNIDResult?.Location || "";
      }
    }

    // Update user with complete registration data
    const updateData = {
      role: registrationData.role,
      lattitude: registrationData.lattitude,
      longitude: registrationData.longitude,
      resultRange: registrationData.resultRange || 10,
      plan: registrationData.plan || "BASIC",
      profilePicture: profilePictureUrl,
      NIDFront: nidFrontUrl,
      NIDBack: nidBackUrl,
      selfieWithNID: selfieWithNIDUrl,
      experience: registrationData.experience,
      status: UserStatus.ACTIVE,
      registrationStatus: RegistrationStatus.COMPLETED,
      emailVerificationOtp: undefined,
      emailVerificationOtpExpiry: undefined,
    };

    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
      new: true,
      session,
    }).select("-password -emailVerificationOtp");

    await session.commitTransaction();

    try {
      const welcomeTemplate = WELCOME_COMPLETE_TEMPLATE(
        user.userName,
        registrationData.role
      );
      await emailSender(
        user.email,
        welcomeTemplate,
        "Welcome to Cleaning Service! 🎉 Registration Complete"
      );
    } catch (emailError) {
      console.error("Welcome email sending error:", emailError);
    }

    return {
      user: updatedUser,
      message: "Registration completed successfully",
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const loginUser = async (payload: {
  email: string;
  password: string;
  fcmToken?: string;
}) => {
  const userData = await User.findOne({
    email: payload.email,
  }).select({
    _id: 1,
    userName: 1,
    email: 1,
    role: 1,
    password: 1,
    createdAt: 1,
    updatedAt: 1,
    status: 1,
    profilePicture: 1,
  });

  if (!userData?.email) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User not found! with this email " + payload.email
    );
  }
  if (userData.status !== "ACTIVE") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "User account already delete or Block."
    );
  }

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password incorrect!");
  }

  // update fcm token
  if (payload.fcmToken) {
    await User.findOneAndUpdate(
      { email: payload.email },
      { fcmToken: payload.fcmToken }
    );
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: userData._id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  const { password, ...withoutPassword } = userData.toObject();

  return { token: accessToken, userData: withoutPassword };
};

const getMyProfile = async (userId: string) => {
  const userProfile = await User.findById(userId).select({
    _id: 1,
    userName: 1,
    role: 1,
    phoneNumber: 1,
    status: 1,
    email: 1,
    profilePicture: 1,
    lattitude: 1,
    longitude: 1,
    createdAt: 1,
    updatedAt: 1,
  });

  if (!userProfile) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  return userProfile;
};

const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  const isCorrectPassword: boolean = await bcrypt.compare(
    oldPassword,
    user.password
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Old password is incorrect!");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "New password and confirm password do not match!"
    );
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  const result = await User.findByIdAndUpdate(
    userId,
    { password: hashedPassword },
    { new: true }
  );

  return result;
};

const forgotPassword = async (payload: { email: string }) => {
  const userData = await User.findOne({ email: payload.email });

  if (!userData) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not exist!");
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await User.findByIdAndUpdate(userData._id, {
    resetPasswordOtp: otp,
    resetPasswordOtpExpiry: otpExpiry,
  });

  try {
    const resetTemplate = PASSWORD_RESET_TEMPLATE(
      otp,
      userData.userName || "User"
    );
    await emailSender(
      payload.email,
      resetTemplate,
      "🔐 Password Reset Request - Cleaning Service"
    );
  } catch (emailError) {
    console.error("Password reset email error:", emailError);
  }

  return { message: "OTP sent to your email", otp };
};

const resendOtp = async (email: string, otpType: string = "RESET_PASSWORD") => {
  const userData = await User.findOne({ email });

  if (!userData) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not exist!");
  }

  // Check if user is trying to resend email verification OTP but already completed registration
  if (
    otpType === "VERIFY_EMAIL" &&
    userData.registrationStatus === RegistrationStatus.COMPLETED
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Your email is already verified and registration is complete. No need to verify again."
    );
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for email verification, 15 for password reset

  // Update appropriate OTP fields based on type
  if (otpType === "VERIFY_EMAIL") {
    // For email verification during registration
    userData.emailVerificationOtp = otp;
    userData.emailVerificationOtpExpiry = otpExpiry;
    await userData.save();

    try {
      const emailTemplate = EMAIL_VERIFICATION_TEMPLATE(
        otp,
        userData.userName || "User"
      );
      await emailSender(
        email,
        emailTemplate,
        "Verify Your Email - Cleaning Service 🧹"
      );
    } catch (emailError) {
      console.error("Resend email verification OTP error:", emailError);
    }
  } else {
    // For password reset
    await User.findByIdAndUpdate(userData._id, {
      resetPasswordOtp: otp,
      resetPasswordOtpExpiry: otpExpiry,
    });

    try {
      const resetTemplate = PASSWORD_RESET_TEMPLATE(
        otp,
        userData.userName || "User"
      );
      await emailSender(
        email,
        resetTemplate,
        "🔐 Password Reset OTP - Cleaning Service"
      );
    } catch (emailError) {
      console.error("Resend password reset OTP error:", emailError);
    }
  }

  return { message: "OTP resent to your email", otp };
};

const verifyForgotPasswordOtp = async (payload: {
  email: string;
  otp: string;
}) => {
  const user = await User.findOne({ email: payload.email });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (
    user.resetPasswordOtp !== payload.otp ||
    !user.resetPasswordOtpExpiry ||
    user.resetPasswordOtpExpiry < new Date()
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP!");
  }

  return { message: "OTP verified successfully", isValid: true };
};

const resetPassword = async (
  email: string,
  newPassword: string,
  confirmPassword: string,
  otp: string
) => {
  if (newPassword !== confirmPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "New password and confirm password do not match!"
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (
    user.resetPasswordOtp !== otp ||
    !user.resetPasswordOtpExpiry ||
    user.resetPasswordOtpExpiry < new Date()
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP!");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  await User.findByIdAndUpdate(user._id, {
    password: hashedPassword,
    resetPasswordOtp: undefined,
    resetPasswordOtpExpiry: undefined,
  });

  return { message: "Password reset successfully" };
};

const checkTokenValidity = async (token: string) => {
  try {
    const decoded = jwtHelpers.verifyToken(
      token,
      config.jwt.jwt_secret as string
    );
    return { isValid: true, decoded };
  } catch (error) {
    return { isValid: false, error };
  }
};

export const authService = {
  registerUser,
  verifyOtp,
  completeRegistration,
  loginUser,
  getMyProfile,
  changePassword,
  forgotPassword,
  resendOtp,
  verifyForgotPasswordOtp,
  resetPassword,
  checkTokenValidity,
};
