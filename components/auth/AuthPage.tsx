"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { FiGithub, FiMail, FiLock, FiUser, FiGlobe } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [secretQ, setSecretQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/editor");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isLogin) {
      // Login logic
      try {
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (result?.error) {
          setError(result.error);
        } else {
          router.push("/editor");
        }
      } catch (err) {
        setError("Failed to sign in. Please try again.");
      }
    } else {
      // Signup logic
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Signup failed");
        }

        // Automatically sign in after successful signup
        const signInResult = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (signInResult?.error) {
          setError(signInResult.error);
        } else {
          router.push("/editor");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create account");
      }
    }
    setLoading(false);
  };

  const handleGitHubAuth = () => {
    signIn("github", {
      callbackUrl: "/editor",
      authorization: {
        params: {
          scope: "read:user user:email repo",
          prompt: "consent",
        },
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl bg-gray-900/80 backdrop-blur-lg border border-gray-800 shadow-xl overflow-hidden">
          {/* Auth Toggle */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
              className={`flex-1 py-4 font-medium text-center transition-colors ${
                isLogin
                  ? "text-cyan-400 bg-gray-800/50"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
              className={`flex-1 py-4 font-medium text-center transition-colors ${
                !isLogin
                  ? "text-cyan-400 bg-gray-800/50"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-md">
                {error}
              </div>
            )}
            
            {/* GitHub Auth */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleGitHubAuth}
                className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-all"
              >
                <FiGithub className="text-xl" />
                <span>Continue with GitHub</span>
              </Button>
            </motion.div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900/80 text-gray-500">OR</span>
              </div>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Email
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                </div>
              )}

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg transition-all"
                  disabled={loading}
                >
                  {loading 
                    ? (isLogin ? "Signing in..." : "Creating account...") 
                    : (isLogin ? "Sign In" : "Create Account")}
                </Button>
              </motion.div>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-cyan-400 hover:underline font-medium"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}