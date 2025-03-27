import mongoose, { Schema, type Document } from "mongoose"

export interface ISyncQueue extends Document {
  sessionId: string
  userId: string
  operation: "create_repo" | "commit" | "sync"
  status: "queued" | "processing" | "completed" | "failed"
  priority: number
  data: {
    files?: Array<{
      path: string
      content: string
      action: "create" | "update" | "delete"
    }>
    commitMessage?: string
    branch?: string
  }
  createdAt: Date
  updatedAt: Date
  processedAt?: Date
  error?: string
  retryCount: number
  maxRetries: number
}

const SyncQueueSchema = new Schema<ISyncQueue>(
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
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
    },
    priority: { type: Number, default: 0 },
    data: {
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
      branch: { type: String, default: "main" },
    },
    processedAt: { type: Date },
    error: { type: String },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
  },
  { timestamps: true },
)

// Create indexes for efficient querying
SyncQueueSchema.index({ status: 1, priority: -1, createdAt: 1 })

// Create the model if it doesn't exist
const SyncQueue = mongoose.models.SyncQueue || mongoose.model<ISyncQueue>("SyncQueue", SyncQueueSchema)

export default SyncQueue

