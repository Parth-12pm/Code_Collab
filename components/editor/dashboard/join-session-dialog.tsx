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

interface JoinSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinSessionDialog({ open, onOpenChange }: JoinSessionDialogProps) {
  const router = useRouter()
  const [roomIdToJoin, setRoomIdToJoin] = useState("")
  const [joinPassword, setJoinPassword] = useState("")
  const [joinError, setJoinError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const joinSession = async () => {
    try {
      setJoinError("")
      setIsLoading(true)

      if (!roomIdToJoin) {
        setJoinError("Room ID is required")
        return
      }

      // First, try to get the session
      const response = await fetch(`/api/sessions/${roomIdToJoin}`)

      if (!response.ok) {
        if (response.status === 404) {
          setJoinError("Session not found")
        } else {
          const error = await response.json()
          setJoinError(error.error || "Failed to join session")
        }
        return
      }

      const data = await response.json()

      // If the session requires a password
      if (data.requiresPassword) {
        // If password is not provided, show error
        if (!joinPassword) {
          setJoinError("Password is required for this session")
          return
        }

        // Try to join with password
        const joinResponse = await fetch(`/api/sessions/${roomIdToJoin}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: joinPassword,
          }),
        })

        if (!joinResponse.ok) {
          const error = await joinResponse.json()
          setJoinError(error.error || "Failed to join session")
          return
        }
      }

      // Successfully joined, navigate to the session
      onOpenChange(false)
      router.push(`/editor/${roomIdToJoin}`)
    } catch (error) {
      console.error("Error joining session:", error)
      setJoinError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Session</DialogTitle>
          <DialogDescription>Enter the session ID to join an existing collaborative session.</DialogDescription>
        </DialogHeader>
        {joinError && (
          <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">{joinError}</div>
        )}
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="room-id">Session ID</Label>
            <Input
              id="room-id"
              value={roomIdToJoin}
              onChange={(e) => setRoomIdToJoin(e.target.value)}
              placeholder="Enter session ID"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password (if required)</Label>
            <Input
              id="password"
              type="password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              placeholder="Enter password if needed"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={joinSession} disabled={isLoading}>
            {isLoading ? "Joining..." : "Join Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function JoinSessionButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick}>
      Join Session
    </Button>
  )
}

