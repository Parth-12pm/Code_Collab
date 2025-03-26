"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { nanoid } from "nanoid"
import { Code, Moon, Sun, Users } from "lucide-react"

interface WelcomeScreenProps {
  username: string
  setUsername: (username: string) => void
  onCreateRoom: (isPrivate: boolean, password: string) => void
  onJoinRoom: (roomId: string) => void
  theme: "light" | "dark"
  setTheme: (theme: "light" | "dark") => void
}

export default function WelcomeScreen({
  username,
  setUsername,
  onCreateRoom,
  onJoinRoom,
  theme,
  setTheme,
}: WelcomeScreenProps) {
  const [activeTab, setActiveTab] = useState("create")
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState("")
  const [roomId, setRoomId] = useState("")
  const [generatedRoomId] = useState(nanoid(10))

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Code className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">CodeCollab</h1>
          <p className="mt-2 text-muted-foreground">Real-time collaborative code editor</p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <Label htmlFor="username" className="text-sm font-medium">
              Your Username
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1"
              placeholder="Enter your username"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Room</TabsTrigger>
              <TabsTrigger value="join">Join Room</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="room-id" className="text-sm font-medium">
                  Room ID (Auto-generated)
                </Label>
                <div className="mt-1 flex">
                  <Input id="room-id" value={generatedRoomId} readOnly className="flex-1 bg-muted" />
                  <Button
                    variant="outline"
                    className="ml-2"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedRoomId)
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch id="private-room" checked={isPrivate} onCheckedChange={setIsPrivate} />
                  <Label htmlFor="private-room">Private Room</Label>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-1 h-3 w-3" />
                  {isPrivate ? "Password required" : "Anyone can join"}
                </div>
              </div>

              {isPrivate && (
                <div>
                  <Label htmlFor="password" className="text-sm font-medium">
                    Room Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                    placeholder="Enter room password"
                  />
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => onCreateRoom(isPrivate, password)}
                disabled={isPrivate && !password}
              >
                Create Room
              </Button>
            </TabsContent>

            <TabsContent value="join" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="join-room-id" className="text-sm font-medium">
                  Room ID
                </Label>
                <Input
                  id="join-room-id"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="mt-1"
                  placeholder="Enter room ID to join"
                />
              </div>

              <Button className="w-full" onClick={() => roomId && onJoinRoom(roomId)} disabled={!roomId}>
                Join Room
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

