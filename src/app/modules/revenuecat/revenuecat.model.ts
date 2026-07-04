import mongoose, { Document, Schema } from "mongoose";

export interface IRevenueCatEvent extends Document {
  _id: string;
  eventId: string;
  type?: string;
  appUserId?: string;
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RevenueCatEventSchema = new Schema<IRevenueCatEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
    },
    appUserId: {
      type: String,
      trim: true,
      index: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export const RevenueCatEvent = mongoose.model<IRevenueCatEvent>(
  "RevenueCatEvent",
  RevenueCatEventSchema,
);
