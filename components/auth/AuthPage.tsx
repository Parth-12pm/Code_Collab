"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { signIn, useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Github, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AuthPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/editor")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (activeTab === "login") {
      // Login logic
      try {
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        })

        if (result?.error) {
          setError(result.error)
        } else {
          router.push("/editor")
        }
      } catch (err) {
        setError("Failed to sign in. Please try again.")
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
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Signup failed")
        }

        // Automatically sign in after successful signup
        const signInResult = await signIn("credentials", {
          redirect: false,
          email,
          password,
        })

        if (signInResult?.error) {
          setError(signInResult.error)
        } else {
          router.push("/editor")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create account")
      }
    }
    setLoading(false)
  }

  const handleGitHubAuth = () => {
    signIn("github", {
      callbackUrl: "/editor",
      authorization: {
        params: {
          scope: "read:user user:email repo",
          prompt: "consent",
        },
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="border-muted-foreground/20">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            <CardHeader>
              <CardTitle className="text-2xl text-center">
                {activeTab === "login" ? "Welcome back" : "Create an account"}
              </CardTitle>
              <CardDescription className="text-center">
                {activeTab === "login"
                  ? "Enter your credentials to sign in to your account"
                  : "Enter your information to create an account"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* GitHub Auth */}
                <Button variant="outline" onClick={handleGitHubAuth} className="w-full gap-2">
                  <Github className="h-4 w-4" />
                  Continue with GitHub
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">OR</span>
                  </div>
                </div>

                {/* Auth Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading
                      ? activeTab === "login"
                        ? "Signing in..."
                        : "Creating account..."
                      : activeTab === "login"
                        ? "Sign In"
                        : "Create Account"}
                  </Button>
                </form>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col">
              <p className="text-center text-sm text-muted-foreground mt-4">
                {activeTab === "login" ? "Don't have an account? " : "Already have an account? "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
                >
                  {activeTab === "login" ? "Sign up" : "Sign in"}
                </Button>
              </p>
            </CardFooter>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  )
}
