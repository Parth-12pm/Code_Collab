"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"

interface RoomJoinModalProps {
  roomId: string
  password: string
  setPassword: (password: string) => void
  onSubmit: () => void
  error: string
}

export default function RoomJoinModal({ roomId, password, setPassword, onSubmit, error }: RoomJoinModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>

        <h2 className="mb-2 text-center text-2xl font-bold">Private Room</h2>
        <p className="mb-6 text-center text-muted-foreground">This room requires a password to join</p>

        <div className="space-y-4">
          <div>
            <label htmlFor="room-id" className="block text-sm font-medium">
              Room ID
            </label>
            <Input id="room-id" value={roomId} readOnly className="mt-1 bg-muted" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter room password"
              className="mt-1"
            />
            {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
          </div>

          <Button onClick={onSubmit} className="w-full">
            Join Room
          </Button>
        </div>
      </div>
    </div>
  )
}

