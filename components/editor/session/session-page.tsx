"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import CollaborativeEditor from "@/components/collab-editor/collaborative-editor"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import { PasswordDialog } from "./password-dialog"

interface EditorSession {
  _id: string
  roomId: string
  name?: string
  isPrivate: boolean
  requiresPassword?: boolean
}

interface SessionPageProps {
  sessionId: string
}

export function SessionPage({ sessionId }: SessionPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [editorSession, setEditorSession] = useState<EditorSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  useEffect(() => {
    const fetchSession = async () => {
      if (status !== "authenticated") return

      try {
        const response = await fetch(`/api/sessions/${sessionId}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError("Session not found")
          } else {
            const data = await response.json()
            setError(data.error || "Failed to load session")
          }
          setLoading(false)
          return
        }

        const data = await response.json()

        // If the session requires a password
        if (data.requiresPassword) {
          setEditorSession(data)
          setPasswordDialogOpen(true)
          setLoading(false)
          return
        }

        setEditorSession(data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching session:", error)
        setError("An unexpected error occurred")
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchSession()
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [sessionId, status, router])

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="text-lg font-medium">{error}</p>
        </div>
        <Button onClick={() => router.push("/editor")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <>
      <PasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        sessionId={sessionId}
        onSuccess={() => setPasswordDialogOpen(false)}
      />

      <div className="h-screen">
        {editorSession && !passwordDialogOpen && (
          <CollaborativeEditor
            sessionId={sessionId}
            sessionName={editorSession.name || `Session-${sessionId}`}
            isPrivate={editorSession.isPrivate}
          />
        )}
      </div>
    </>
  )
}

