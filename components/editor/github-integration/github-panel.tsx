"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { GitCommit, GitFork, Github, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface GitHubPanelProps {
  sessionId: string
  files?: Array<{
    path: string
    content: string
  }>
}

interface SyncOperation {
  _id: string
  sessionId: string
  userId: string
  operation: "create_repo" | "commit" | "sync"
  status: "pending" | "processing" | "completed" | "failed"
  processedAt?: string
  files?: Array<{
    path: string
    content: string
    action: "create" | "update" | "delete"
  }>
  commitMessage?: string
  error?: string
  createdAt: string
}

interface RepositoryInfo {
  repoId: string
  repoName: string
  repoOwner: string
  repoUrl: string
  isPrivate: boolean
  lastSyncedAt?: string
}

export default function GitHubPanel({ sessionId, files = [] }: GitHubPanelProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("commit")
  const [commitMessage, setCommitMessage] = useState("")
  const [isCreatingRepo, setIsCreatingRepo] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [repositoryInfo, setRepositoryInfo] = useState<RepositoryInfo | null>(null)
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>({})

  // Fetch session data to get repository info
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/sessions/${sessionId}`)

        if (response.ok) {
          const data = await response.json()
          if (data.repositoryInfo) {
            setRepositoryInfo(data.repositoryInfo)
          }
        }

        // Fetch sync operations
        const syncResponse = await fetch(`/api/sessions/${sessionId}/sync-operations`)
        if (syncResponse.ok) {
          const syncData = await syncResponse.json()
          setSyncOperations(syncData)
        }
      } catch (error) {
        console.error("Error fetching session data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (sessionId) {
      fetchSessionData()
    }
  }, [sessionId])

  // Initialize selected files
  useEffect(() => {
    if (files.length > 0) {
      const initialSelectedFiles: Record<string, boolean> = {}
      files.forEach((file) => {
        initialSelectedFiles[file.path] = true
      })
      setSelectedFiles(initialSelectedFiles)
    }
  }, [files])

  const handleCreateRepository = async () => {
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

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create GitHub repository")
      }

      const data = await response.json()
      setRepositoryInfo(data.repository)

      toast({
        title: "Repository Created",
        description: "GitHub repository has been successfully created.",
      })

      // Refresh sync operations
      const syncResponse = await fetch(`/api/sessions/${sessionId}/sync-operations`)
      if (syncResponse.ok) {
        const syncData = await syncResponse.json()
        setSyncOperations(syncData)
      }
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

  const handleCommitChanges = async () => {
    try {
      if (!commitMessage.trim()) {
        toast({
          title: "Commit Message Required",
          description: "Please enter a commit message.",
          variant: "destructive",
        })
        return
      }

      // Filter selected files
      const filesToCommit = files
        .filter((file) => selectedFiles[file.path])
        .map((file) => ({
          path: file.path,
          content: file.content,
          action: "update" as const,
        }))

      if (filesToCommit.length === 0) {
        toast({
          title: "No Files Selected",
          description: "Please select at least one file to commit.",
          variant: "destructive",
        })
        return
      }

      setIsCommitting(true)

      const response = await fetch("/api/github/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          files: filesToCommit,
          commitMessage,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to commit changes")
      }

      setCommitMessage("")

      toast({
        title: "Changes Committed",
        description: "Your changes have been committed to GitHub.",
      })

      // Refresh sync operations
      const syncResponse = await fetch(`/api/sessions/${sessionId}/sync-operations`)
      if (syncResponse.ok) {
        const syncData = await syncResponse.json()
        setSyncOperations(syncData)
      }
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

  const toggleFileSelection = (path: string) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [path]: !prev[path],
    }))
  }

  const selectAllFiles = () => {
    const newSelectedFiles: Record<string, boolean> = {}
    files.forEach((file) => {
      newSelectedFiles[file.path] = true
    })
    setSelectedFiles(newSelectedFiles)
  }

  const deselectAllFiles = () => {
    const newSelectedFiles: Record<string, boolean> = {}
    files.forEach((file) => {
      newSelectedFiles[file.path] = false
    })
    setSelectedFiles(newSelectedFiles)
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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="mt-2">
            <TabsTrigger value="commit">Commit</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="commit" className="flex-1 p-4 overflow-auto">
          {!repositoryInfo ? (
            <Card>
              <CardHeader>
                <CardTitle>Connect to GitHub</CardTitle>
                <CardDescription>
                  Create a GitHub repository to store your code and collaborate with others.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={handleCreateRepository} disabled={isCreatingRepo} className="w-full">
                  {isCreatingRepo ? (
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
              </CardFooter>
            </Card>
          ) : (
            <>
              <div className="mb-4">
                <Label htmlFor="commit-message">Commit Message</Label>
                <Textarea
                  id="commit-message"
                  placeholder="Describe your changes..."
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>Files to Commit</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllFiles}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAllFiles}>
                      Deselect All
                    </Button>
                  </div>
                </div>

                <Card>
                  <ScrollArea className="h-48">
                    <div className="p-2">
                      {files.length > 0 ? (
                        files.map((file) => (
                          <div key={file.path} className="flex items-center py-1 px-2 hover:bg-accent rounded-md">
                            <input
                              type="checkbox"
                              id={`file-${file.path}`}
                              checked={!!selectedFiles[file.path]}
                              onChange={() => toggleFileSelection(file.path)}
                              className="mr-2"
                            />
                            <label htmlFor={`file-${file.path}`} className="text-sm truncate cursor-pointer flex-1">
                              {file.path}
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">No files available to commit</div>
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </div>

              <Button
                onClick={handleCommitChanges}
                disabled={isCommitting || !commitMessage.trim() || Object.values(selectedFiles).every((v) => !v)}
                className="w-full"
              >
                {isCommitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Committing Changes...
                  </>
                ) : (
                  <>
                    <GitCommit className="mr-2 h-4 w-4" />
                    Commit Changes
                  </>
                )}
              </Button>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="flex-1 p-4 overflow-auto">
          <Card>
            <CardHeader>
              <CardTitle>Sync History</CardTitle>
              <CardDescription>Recent GitHub synchronization operations</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {syncOperations.length > 0 ? (
                  <div className="space-y-4">
                    {syncOperations.map((op) => (
                      <div key={op._id} className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            {op.operation === "create_repo" ? (
                              <GitFork className="h-4 w-4 mr-2" />
                            ) : (
                              <GitCommit className="h-4 w-4 mr-2" />
                            )}
                            <span className="font-medium">
                              {op.operation === "create_repo"
                                ? "Create Repository"
                                : op.operation === "commit"
                                  ? "Commit Changes"
                                  : "Sync"}
                            </span>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-4 overflow-auto">
          <Card>
            <CardHeader>
              <CardTitle>Repository Settings</CardTitle>
              <CardDescription>GitHub repository configuration</CardDescription>
            </CardHeader>
            <CardContent>
              {repositoryInfo ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Repository Name</Label>
                    <div className="font-medium">{repositoryInfo.repoName}</div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Owner</Label>
                    <div className="font-medium">{repositoryInfo.repoOwner}</div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Visibility</Label>
                    <div className="font-medium">{repositoryInfo.isPrivate ? "Private" : "Public"}</div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Last Synced</Label>
                    <div className="font-medium">{formatDate(repositoryInfo.lastSyncedAt)}</div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(repositoryInfo.repoUrl, "_blank")}
                    >
                      <Github className="mr-2 h-4 w-4" />
                      Open in GitHub
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No repository connected</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

