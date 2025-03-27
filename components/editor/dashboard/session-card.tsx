"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Code, ExternalLink, Trash } from "lucide-react"

interface EditorSession {
  _id: string
  roomId: string
  name?: string
  createdBy: string
  createdAt: string
  lastActive: string
  isPrivate: boolean
  repositoryInfo?: {
    repoUrl: string
    lastSyncedAt?: string
  }
  participants: {
    userId: string
    username: string
    joinedAt: string
    role: "owner" | "collaborator"
  }[]
}

interface SessionCardProps {
  session: EditorSession
  isOwner: boolean
  onDelete?: (roomId: string) => void
}

export function SessionCard({ session, isOwner, onDelete }: SessionCardProps) {
  const router = useRouter()

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="truncate">{session.name || `Session-${session.roomId}`}</span>
          {session.isPrivate && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Private</span>
          )}
        </CardTitle>
        <CardDescription>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            Last active: {formatDate(session.lastActive)}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <p>Created: {formatDate(session.createdAt)}</p>
          <p>Participants: {session.participants.length}</p>
          {!isOwner && <p>Owner: {session.participants.find((p) => p.role === "owner")?.username}</p>}
          {session.repositoryInfo?.repoUrl && (
            <p className="mt-2 flex items-center">
              <span className="mr-1">GitHub:</span>
              <a
                href={session.repositoryInfo.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:underline"
              >
                Repository
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {isOwner ? (
          <>
            <Button variant="outline" size="sm" onClick={() => onDelete && onDelete(session.roomId)}>
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button size="sm" onClick={() => router.push(`/editor/${session.roomId}`)}>
              <Code className="mr-2 h-4 w-4" />
              Open
            </Button>
          </>
        ) : (
          <Button className="w-full" onClick={() => router.push(`/editor/${session.roomId}`)}>
            <Code className="mr-2 h-4 w-4" />
            Open Session
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

