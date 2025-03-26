"use client"

import { useEffect, useState } from "react"
import { RoomProvider } from "@/liveblocks.config"
import Editor from "@/components/editor"
import Toolbar from "@/components/toolbar"
import Sidebar from "@/components/sidebar"
import { useRouter } from "next/navigation"
import { nanoid } from "nanoid"
import { LiveObject, LiveList, LiveMap } from "@liveblocks/client"
import RoomJoinModal from "@/components/room-join-modal"
import ChatPanel from "@/components/chat-panel"
import { ThemeProvider } from "@/components/theme-provider"
import WelcomeScreen from "@/components/welcome-screen"
import InitialFileDialog from "@/components/initial-file-dialog"
import { Toaster } from "@/components/ui/toaster"

export default function CollaborativeEditor() {
  const router = useRouter()
  const [roomId, setRoomId] = useState<string | null>(null)
  const [username, setUsername] = useState<string>("")
  const [isJoining, setIsJoining] = useState(true)
  const [roomPassword, setRoomPassword] = useState<string>("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [passwordRequired, setPasswordRequired] = useState(false)
  const [passwordAttempt, setPasswordAttempt] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [showInitialFileDialog, setShowInitialFileDialog] = useState(false)
  const [initialFile, setInitialFile] = useState({ name: "", type: "js" })

  useEffect(() => {
    // Generate a random username if not set
    if (!username) {
      setUsername(`user-${Math.floor(Math.random() * 10000)}`)
    }

    // Check if we have a room ID in the URL
    const params = new URLSearchParams(window.location.search)
    const roomParam = params.get("room")

    if (roomParam) {
      setRoomId(roomParam)

      // Check if this room requires a password
      const storedRooms = localStorage.getItem("collaborationRooms")
      if (storedRooms) {
        const rooms = JSON.parse(storedRooms)
        const roomInfo = rooms[roomParam]

        if (roomInfo && roomInfo.isPrivate) {
          setPasswordRequired(true)
        } else {
          setIsJoining(false)
        }
      } else {
        // If we don't have local info, we'll check in the room itself
        setPasswordRequired(true)
      }
    }
  }, [username])

  const createRoom = (isPrivate: boolean, password = "") => {
    const newRoomId = nanoid(10)

    // Store room info locally
    const storedRooms = localStorage.getItem("collaborationRooms") || "{}"
    const rooms = JSON.parse(storedRooms)
    rooms[newRoomId] = {
      isPrivate,
      password: isPrivate ? password : "",
      createdAt: new Date().toISOString(),
      createdBy: username,
    }
    localStorage.setItem("collaborationRooms", JSON.stringify(rooms))

    router.push(`?room=${newRoomId}`)
    setRoomId(newRoomId)
    setIsPrivate(isPrivate)
    setRoomPassword(password)
    setShowInitialFileDialog(true)
  }

  const joinRoom = (id: string, password = "") => {
    // Check if room requires password
    const storedRooms = localStorage.getItem("collaborationRooms")
    if (storedRooms) {
      const rooms = JSON.parse(storedRooms)
      const roomInfo = rooms[id]

      if (roomInfo && roomInfo.isPrivate && roomInfo.password !== password) {
        setPasswordError('Incorrect password")d')
        return
      }
    }

    router.push(`?room=${id}`)
    setRoomId(id)
    setPasswordRequired(false)
    setIsJoining(false)
  }

  const handlePasswordSubmit = () => {
    if (roomId) {
      joinRoom(roomId, passwordAttempt)
    }
  }

  const handleInitialFileCreation = (fileName: string, fileType: string) => {
    setInitialFile({ name: fileName, type: fileType })
    setShowInitialFileDialog(false)
    setIsJoining(false)

    // We'll set a flag in localStorage to indicate that we should show the file creation dialog
    // when the component mounts after navigation
    if (roomId) {
      localStorage.setItem(`room-${roomId}-showFileDialog`, "true")
    }
  }

  useEffect(() => {
    if (roomId && !isJoining && !showInitialFileDialog) {
      const shouldShowFileDialog = localStorage.getItem(`room-${roomId}-showFileDialog`)
      if (shouldShowFileDialog === "true") {
        // Remove the flag so we don't show it again
        localStorage.removeItem(`room-${roomId}-showFileDialog`)

        // Wait a bit to ensure the component is fully mounted
        const timer = setTimeout(() => {
          // We'll use a custom event to trigger the file creation dialog in the sidebar
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("showFileCreationDialog"))
          }
        }, 500)

        return () => clearTimeout(timer)
      }
    }
  }, [roomId, isJoining, showInitialFileDialog])

  if (passwordRequired) {
    return (
      <ThemeProvider defaultTheme={theme} storageKey="code-collab-theme">
        <div className={theme}>
          <div className="bg-background text-foreground">
            <RoomJoinModal
              roomId={roomId || ""}
              password={passwordAttempt}
              setPassword={setPasswordAttempt}
              onSubmit={handlePasswordSubmit}
              error={passwordError}
            />
          </div>
        </div>
      </ThemeProvider>
    )
  }

  if (showInitialFileDialog) {
    return (
      <ThemeProvider defaultTheme={theme} storageKey="code-collab-theme">
        <div className={theme}>
          <div className="bg-background text-foreground">
            <InitialFileDialog onSubmit={handleInitialFileCreation} />
          </div>
        </div>
      </ThemeProvider>
    )
  }

  if (isJoining) {
    return (
      <ThemeProvider defaultTheme={theme} storageKey="code-collab-theme">
        <div className={theme}>
          <div className="bg-background text-foreground">
            <WelcomeScreen
              username={username}
              setUsername={setUsername}
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
              theme={theme}
              setTheme={setTheme}
            />
          </div>
        </div>
      </ThemeProvider>
    )
  }

  if (!roomId) return null

  return (
    <ThemeProvider defaultTheme={theme} storageKey="code-collab-theme">
      <div className={theme}>
        <RoomProvider
          id={roomId}
          initialPresence={{
            cursor: null,
            selection: null,
            username,
            currentFile: initialFile.name ? `${initialFile.name}.${initialFile.type}` : null,
          }}
          initialStorage={{
            document: new LiveObject({ content: "" }),
            messages: new LiveList([]),
            files: new LiveMap(),
            timeline: new LiveList([]),
            roomSettings: new LiveObject({
              isPrivate,
              password: roomPassword,
              createdBy: username,
              createdAt: new Date().toISOString(),
            }),
          }}
        >
          <div className="flex h-screen flex-col bg-background text-foreground">
            <Toolbar roomId={roomId} username={username} isPrivate={isPrivate} theme={theme} setTheme={setTheme} />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <Editor theme={theme} />
              <ChatPanel />
            </div>
          </div>
          <Toaster />
        </RoomProvider>
      </div>
    </ThemeProvider>
  )
}

