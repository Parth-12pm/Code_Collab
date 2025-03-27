"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  onSuccess: () => void
}

export function PasswordDialog({ open, onOpenChange, sessionId, onSuccess }: PasswordDialogProps) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handlePasswordSubmit = async () => {
    try {
      setError(null)
      setIsLoading(true)

      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to join session")
        return
      }

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error joining session:", error)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Private Session</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4">This session requires a password to join.</p>
          {error && <div className="mb-4 rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">{error}</div>}
          <div className="grid gap-2">
            <Label htmlFor="session-password">Password</Label>
            <Input
              id="session-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter session password"
            />
          </div>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/editor")}>
            Cancel
          </Button>
          <Button onClick={handlePasswordSubmit} disabled={isLoading}>
            {isLoading ? "Joining..." : "Join Session"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

