import mongoose, { Schema, type Document } from "mongoose"

export interface IEditorSession extends Document {
  roomId: string
  name?: string
  createdBy: string
  isPrivate: boolean
  password?: string
  participants: Array<{
    userId: string
    username: string
    role: "owner" | "collaborator"
    joinedAt?: Date
  }>
  repositoryInfo?: {
    repoId: string
    repoName: string
    repoOwner: string
    repoUrl: string
    isPrivate: boolean
    lastSyncedAt?: Date
  }
  files?: Array<{
    path: string
    content: string
    lastModified: Date
  }>
  createdAt: Date
  lastActive: Date
}

const EditorSessionSchema = new Schema<IEditorSession>(
  {
    roomId: { type: String, required: true, unique: true },
    name: { type: String },
    createdBy: { type: String, required: true },
    isPrivate: { type: Boolean, default: false },
    password: { type: String },
    participants: [
      {
        userId: { type: String, required: true },
        username: { type: String, required: true },
        role: { type: String, enum: ["owner", "collaborator"], required: true },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    repositoryInfo: {
      repoId: { type: String },
      repoName: { type: String },
      repoOwner: { type: String },
      repoUrl: { type: String },
      isPrivate: { type: Boolean, default: true },
      lastSyncedAt: { type: Date },
    },
    files: [
      {
        path: { type: String, required: true },
        content: { type: String, default: "" },
        lastModified: { type: Date, default: Date.now },
      },
    ],
    createdAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: false },
)

// Create the model if it doesn't exist
const EditorSession =
  mongoose.models.EditorSession || mongoose.model<IEditorSession>("EditorSession", EditorSessionSchema)

export default EditorSession

