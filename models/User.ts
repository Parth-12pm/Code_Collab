import mongoose, { Schema, model, models } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
  email: string;
  password?: string; // Optional for GitHub OAuth users
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  githubId?: string; // GitHub user ID
  githubUsername?: string; // GitHub username
  githubAccessToken?: string; // For GitHub API operations
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for GitHub OAuth users
    githubId: { type: String },
    githubUsername: { type: String },
    githubAccessToken: { type: String },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = models?.User || model<IUser>("User", userSchema);

export default User;
