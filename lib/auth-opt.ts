import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/monogdb";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "read:user user:email repo", // Add repo scope to create repositories
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }
        try {
          await connectToDatabase();

          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            throw new Error("User not found");
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password || ""
          );

          if (!isValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user._id.toString(),
            email: user.email,
          };
        } catch (error) {
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        // For GitHub provider
        if (account.provider === "github") {
          await connectToDatabase();

          // Find or create user
          const existingUser = await User.findOne({ email: user.email });

          if (existingUser) {
            // Update GitHub info
            existingUser.githubId = user.id;
            existingUser.githubUsername = user.name;
            existingUser.githubAccessToken = account.access_token;
            await existingUser.save();

            token.id = existingUser._id.toString();
          } else {
            // Create new user
            const newUser = await User.create({
              email: user.email,
              githubId: user.id,
              githubUsername: user.name,
              githubAccessToken: account.access_token,
            });

            token.id = newUser._id.toString();
          }

          // Add GitHub info to token
          token.githubAccessToken = account.access_token;
          token.githubId = user.id;
          token.githubUsername = user.name;
        }

        // For credentials provider
        if (account.provider === "credentials") {
          token.id = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;

        // Add GitHub info to session
        if (token.githubAccessToken) {
          session.user.githubAccessToken = token.githubAccessToken as string;
          session.user.githubId = token.githubId as string;
          session.user.githubUsername = token.githubUsername as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
