"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"
import { useStorage } from "@/liveblocks.config"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"

interface GitHubIntegrationProps {
  roomId: string
}

export default function GitHubIntegration({ roomId }: GitHubIntegrationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreatingRepo, setIsCreatingRepo] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [commitMessage, setCommitMessage] = useState("")
  const [repoInfo, setRepoInfo] = useState<any>(null)
  const { data: session } = useSession()
  const { toast } = useToast()

  // Get files from storage
  const files = useStorage((root) => root.files)

  // Convert LiveMap to array of files
  const fileArray = files
    ? Array.from(files.entries())
        .filter(([path]) => !path.endsWith("/.folder")) // Filter out folder placeholders
        .map(([path, fileData]) => ({
          path,
          content: fileData.content,
        }))
    : []

  // Fetch repository info
  const fetchRepoInfo = async () => {
    try {
      const response = await fetch(`/api/sessions/${roomId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.repositoryInfo) {
          setRepoInfo(data.repositoryInfo)
        }
      }
    } catch (error) {
      console.error("Error fetching repository info:", error)
    }
  }

  // Create GitHub repository
  const createRepository = async () => {
    try {
      setIsCreatingRepo(true)

      const response = await fetch("/api/github/create-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: roomId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create GitHub repository")
      }

      const data = await response.json()
      setRepoInfo(data.repository)

      toast({
        title: "Repository Created",
        description: "GitHub repository has been successfully created.",
      })

      // Refresh repo info
      fetchRepoInfo()
    } catch (error) {
      console.error("Error creating repository:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to create GitHub repository",
        variant: "destructive",
      })
    } finally {
      setIsCreatingRepo(false)
    }
  }

  // Commit changes to GitHub
  const commitChanges = async () => {
    if (!commitMessage.trim()) {
      toast({
        title: "Commit Message Required",
        description: "Please enter a commit message.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCommitting(true)

      const response = await fetch("/api/github/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: roomId,
          files: fileArray,
          commitMessage,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to commit changes")
      }

      toast({
        title: "Changes Committed",
        description: "Your changes have been committed to GitHub.",
      })

      setCommitMessage("")

      // Refresh repo info
      fetchRepoInfo()
    } catch (error) {
      console.error("Error committing changes:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to commit changes",
        variant: "destructive",
      })
    } finally {
      setIsCommitting(false)
    }
  }

  // Fetch repo info when dialog opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      fetchRepoInfo()
    }
  }

  // Only show GitHub integration if user has GitHub access token
  if (!session?.user?.githubAccessToken) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Github className="h-4 w-4" />
          <span className="hidden md:inline">GitHub</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>GitHub Integration</DialogTitle>
          <DialogDescription>
            Sync your code with GitHub to collaborate and version control your project.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!repoInfo ? (
            <div className="space-y-4">
              <p className="text-sm">Create a GitHub repository to store your code and collaborate with others.</p>
              <Button onClick={createRepository} disabled={isCreatingRepo} className="w-full">
                {isCreatingRepo ? "Creating Repository..." : "Create GitHub Repository"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border p-4">
                <h3 className="font-medium mb-2">Repository Information</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Name:</span> {repoInfo.repoName}
                  </p>
                  <p>
                    <span className="font-medium">Owner:</span> {repoInfo.repoOwner}
                  </p>
                  <p>
                    <span className="font-medium">URL:</span>{" "}
                    <a
                      href={repoInfo.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {repoInfo.repoUrl}
                    </a>
                  </p>
                  <p>
                    <span className="font-medium">Last Synced:</span>{" "}
                    {repoInfo.lastSyncedAt ? new Date(repoInfo.lastSyncedAt).toLocaleString() : "Never"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="commit-message" className="block text-sm font-medium">
                  Commit Message
                </label>
                <textarea
                  id="commit-message"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Enter commit message..."
                />
              </div>

              <Button onClick={commitChanges} disabled={isCommitting || !commitMessage.trim()} className="w-full">
                {isCommitting ? "Committing Changes..." : "Commit Changes to GitHub"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

