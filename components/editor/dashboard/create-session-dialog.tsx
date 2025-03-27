"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Github } from "lucide-react"
import { nanoid } from "nanoid"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"

interface CreateSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSessionDialog({ open, onOpenChange }: CreateSessionDialogProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [newSessionName, setNewSessionName] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState("")
  const [initGitHub, setInitGitHub] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if user has GitHub access token
  const hasGitHubToken = !!session?.user?.githubAccessToken

  const createSession = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSessionName || `Session-${nanoid(6)}`,
          isPrivate,
          password: isPrivate ? password : undefined,
          initGitHub: initGitHub && hasGitHubToken,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onOpenChange(false)

        // If GitHub initialization was requested, show a toast
        if (initGitHub && hasGitHubToken) {
          toast({
            title: "GitHub Repository",
            description: "GitHub repository will be initialized in the background.",
          })
        }

        router.push(`/editor/${data.roomId}`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create session")
      }
    } catch (error) {
      console.error("Error creating session:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to create session",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
          <DialogDescription>Create a new collaborative coding session.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Session Name</Label>
            <Input
              id="name"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="My Coding Session"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate} />
              <Label htmlFor="private">Private Session</Label>
            </div>
          </div>
          {isPrivate && (
            <div className="grid gap-2">
              <Label htmlFor="session-password">Password</Label>
              <Input
                id="session-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
          )}

          {/* GitHub integration option */}
          {hasGitHubToken && (
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <Switch id="github-init" checked={initGitHub} onCheckedChange={setInitGitHub} />
                <Label htmlFor="github-init" className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  Initialize GitHub Repository
                </Label>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={createSession} disabled={isLoading || (isPrivate && !password)}>
            {isLoading ? "Creating..." : "Create Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CreateSessionButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick}>
      <Plus className="mr-2 h-4 w-4" />
      New Session
    </Button>
  )
}

