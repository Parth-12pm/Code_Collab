import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-opt";

export const metadata: Metadata = {
  title: "CodeCollab",
  description: "Created by Team BitMasters",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider session={session}>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
