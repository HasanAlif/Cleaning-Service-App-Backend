import mongoose, { Schema, Document } from "mongoose";

export interface IKnowledgeHub extends Document {
  _id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const knowledgeHubSchema = new Schema<IKnowledgeHub>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const KnowledgeHub = mongoose.model<IKnowledgeHub>(
  "KnowledgeHub",
  knowledgeHubSchema
);
