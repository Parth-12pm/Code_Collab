"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Github, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useSession } from "next-auth/react"

interface GitHubIntegrationProps {
  roomId: string
}

export default function GitHubIntegration({ roomId }: GitHubIntegrationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { data: session } = useSession()

  // Only show if user has GitHub access token
  if (!session?.user?.githubAccessToken) {
    return null
  }

  const handleCreateRepo = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/github/create-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: roomId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create GitHub repository")
      }

      toast({
        title: "Repository Created",
        description: "GitHub repository has been successfully created.",
      })
    } catch (error) {
      console.error("Error creating repository:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to create GitHub repository",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Github className="h-4 w-4" />
          <span className="hidden md:inline">GitHub</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>GitHub Integration</DialogTitle>
          <DialogDescription>Connect your session to GitHub for version control</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4">
            Create a GitHub repository to store your code and collaborate with others. This will create a private
            repository linked to this session.
          </p>
          <Button onClick={handleCreateRepo} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Repository...
              </>
            ) : (
              <>
                <Github className="mr-2 h-4 w-4" />
                Create GitHub Repository
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

