"use client"

import { Button } from "@/components/ui/button"
import { Code, Plus } from "lucide-react"

interface EmptyStateProps {
  type: "my-sessions" | "collaborative"
  onCreateClick?: () => void
  onJoinClick?: () => void
}

export function EmptyState({ type, onCreateClick, onJoinClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <Code className="mb-2 h-8 w-8 text-muted-foreground" />
      {type === "my-sessions" ? (
        <>
          <h3 className="mb-1 text-lg font-medium">No sessions yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Create your first collaborative coding session to get started.
          </p>
          <Button onClick={onCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </>
      ) : (
        <>
          <h3 className="mb-1 text-lg font-medium">No collaborative sessions</h3>
          <p className="mb-4 text-sm text-muted-foreground">You haven't joined any collaborative sessions yet.</p>
          <Button onClick={onJoinClick}>Join a Session</Button>
        </>
      )}
    </div>
  )
}

