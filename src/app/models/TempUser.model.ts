import { Schema, model } from "mongoose";

export interface ITempUser {
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
  referralCode?: string;
  emailVerificationOtp: string;
  emailVerificationOtpExpiry: Date;
  createdAt: Date;
}

const TempUserSchema = new Schema<ITempUser>(
  {
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    referralCode: {
      type: String,
    },
    emailVerificationOtp: {
      type: String,
      required: true,
    },
    emailVerificationOtpExpiry: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically delete temp users after 15 minutes of creation
TempUserSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 15 * 60 } // 15 minutes
);

export const TempUser = model<ITempUser>("TempUser", TempUserSchema);
