import mongoose, { Schema, type Document } from "mongoose"

export interface ISyncOperation extends Document {
  sessionId: string
  userId: string
  operation: "create_repo" | "commit" | "sync"
  status: "pending" | "processing" | "completed" | "failed"
  processedAt?: Date
  files?: Array<{
    path: string
    content: string
    action: "create" | "update" | "delete"
  }>
  commitMessage?: string
  error?: string
}

const SyncOperationSchema = new Schema<ISyncOperation>(
  {
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    operation: {
      type: String,
      required: true,
      enum: ["create_repo", "commit", "sync"],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    processedAt: { type: Date },
    files: [
      {
        path: { type: String, required: true },
        content: { type: String },
        action: {
          type: String,
          required: true,
          enum: ["create", "update", "delete"],
        },
      },
    ],
    commitMessage: { type: String },
    error: { type: String },
  },
  { timestamps: true },
)

// Create the model if it doesn't exist
const SyncOperation =
  mongoose.models.SyncOperation || mongoose.model<ISyncOperation>("SyncOperation", SyncOperationSchema)

export default SyncOperation

