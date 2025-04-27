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
import { FaGithub } from "react-icons/fa"
import { Loader2 } from "lucide-react"
import { useStorage } from "@/liveblocks.config"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface GitHubButtonProps {
  sessionId: string
}

export default function GitHubButton({ sessionId }: GitHubButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreatingRepo, setIsCreatingRepo] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [commitMessage, setCommitMessage] = useState("")
  const [repoInfo, setRepoInfo] = useState<any>(null)
  const [syncOperations, setSyncOperations] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("commit")
  const [isLoading, setIsLoading] = useState(true)
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

  // Fetch repository info and sync operations
  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch session data to get repository info
      const sessionResponse = await fetch(`/api/sessions/${sessionId}`)
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json()
        if (sessionData.repositoryInfo) {
          setRepoInfo(sessionData.repositoryInfo)
        }
      }

      // Fetch sync operations
      const syncResponse = await fetch(`/api/sessions/${sessionId}/sync-operations`)
      if (syncResponse.ok) {
        const syncData = await syncResponse.json()
        setSyncOperations(syncData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
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
          sessionId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create GitHub repository")
      }

      setRepoInfo(data.repository)

      toast({
        title: "Repository Created",
        description: "GitHub repository has been successfully created.",
      })

      // Refresh data
      fetchData()
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

    if (fileArray.length === 0) {
      toast({
        title: "No Files to Commit",
        description: "There are no files to commit.",
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
          sessionId,
          files: fileArray,
          commitMessage,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to commit changes")
      }

      toast({
        title: "Changes Committed",
        description: "Your changes have been committed to GitHub.",
      })

      setCommitMessage("")

      // Refresh data
      fetchData()
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

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "processing":
        return "bg-blue-500"
      case "pending":
        return "bg-yellow-500"
      case "failed":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // Fetch data when dialog opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      fetchData()
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
          <FaGithub className="h-4 w-4" />
          <span className="hidden md:inline">GitHub</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh]">
        <DialogHeader>
          <DialogTitle>GitHub Integration</DialogTitle>
          <DialogDescription>
            Sync your code with GitHub to collaborate and version control your project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="border-b px-4">
                <TabsList className="mt-2">
                  <TabsTrigger value="commit">Commit</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="commit" className="flex-1 p-4 overflow-auto">
                {!repoInfo ? (
                  <div className="space-y-4">
                    <p className="text-sm">
                      Create a GitHub repository to store your code and collaborate with others.
                    </p>
                    <Button onClick={createRepository} disabled={isCreatingRepo} className="w-full">
                      {isCreatingRepo ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Repository...
                        </>
                      ) : (
                        <>
                          <FaGithub className="mr-2 h-4 w-4" />
                          Create GitHub Repository
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label htmlFor="commit-message" className="block text-sm font-medium mb-2">
                        Commit Message
                      </label>
                      <Textarea
                        id="commit-message"
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="Describe your changes..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2">Files to Commit ({fileArray.length})</h3>
                      <ScrollArea className="h-48 border rounded-md">
                        <div className="p-2">
                          {fileArray.length > 0 ? (
                            fileArray.map((file) => (
                              <div key={file.path} className="py-1 px-2 hover:bg-accent rounded-md">
                                <div className="text-sm truncate">{file.path}</div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">No files available to commit</div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    <Button
                      onClick={commitChanges}
                      disabled={isCommitting || !commitMessage.trim() || fileArray.length === 0}
                      className="w-full"
                    >
                      {isCommitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Committing Changes...
                        </>
                      ) : (
                        <>
                          <FaGithub className="mr-2 h-4 w-4" />
                          Commit Changes
                        </>
                      )}
                    </Button>
                  </>
                )}
              </TabsContent>

              <TabsContent value="history" className="flex-1 p-4 overflow-auto">
                <ScrollArea className="h-[calc(80vh-150px)]">
                  {syncOperations.length > 0 ? (
                    <div className="space-y-4">
                      {syncOperations.map((op) => (
                        <div key={op._id} className="border rounded-md p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">
                              {op.operation === "create_repo"
                                ? "Repository Created"
                                : op.operation === "commit"
                                  ? "Committed Changes"
                                  : "Synced Changes"}
                            </div>
                            <Badge variant="outline" className={`${getStatusColor(op.status)} text-white`}>
                              {op.status}
                            </Badge>
                          </div>

                          {op.commitMessage && (
                            <p className="text-sm mb-2 border-l-2 border-primary pl-2 italic">{op.commitMessage}</p>
                          )}

                          <div className="text-xs text-muted-foreground">
                            <div>Created: {formatDate(op.createdAt)}</div>
                            {op.processedAt && <div>Processed: {formatDate(op.processedAt)}</div>}
                          </div>

                          {op.error && (
                            <div className="mt-2 text-xs text-destructive border border-destructive rounded-md p-2">
                              {op.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No sync operations found</div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="settings" className="flex-1 p-4 overflow-auto">
                {repoInfo ? (
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
                          <span className="font-medium">Visibility:</span> {repoInfo.isPrivate ? "Private" : "Public"}
                        </p>
                        <p>
                          <span className="font-medium">Last Synced:</span>{" "}
                          {repoInfo.lastSyncedAt ? new Date(repoInfo.lastSyncedAt).toLocaleString() : "Never"}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(repoInfo.repoUrl, "_blank")}
                    >
                      <FaGithub className="mr-2 h-4 w-4" />
                      Open in GitHub
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No repository connected. Create a repository in the Commit tab.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

