import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      githubAccessToken?: string;
      githubId?: string;
      githubUsername?: string;
    } & DefaultSession["user"];
  }
  
  interface JWT {
    id: string;
    githubAccessToken?: string;
    githubId?: string;
    githubUsername?: string;
  }
}