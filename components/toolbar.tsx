"use client"
import { useOthers, useStorage, useSelf } from "@/liveblocks.config"
import { Copy, Download, Settings, Users, Lock, Unlock, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import JSZip from "jszip"
import FileSaver from "file-saver"
import { useEffect } from "react"

interface ToolbarProps {
  roomId: string
  username: string
  isPrivate: boolean
  theme: "light" | "dark"
  setTheme: (theme: "light" | "dark") => void
}

export default function Toolbar({ roomId, username, isPrivate, theme, setTheme }: ToolbarProps) {
  const others = useOthers()
  const activeFile = useStorage((root) => root.activeFile)
  const files = useStorage((root) => root.files)
  const self = useSelf()

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
      root.classList.remove("light")
    } else {
      root.classList.add("light")
      root.classList.remove("dark")
    }
  }, [theme])

  const copyRoomLink = () => {
    const url = `${window.location.origin}?room=${roomId}`
    navigator.clipboard.writeText(url)
  }

  // Download workspace as zip
  const downloadWorkspace = async () => {
    if (!files || files.size === 0) return

    const zip = new JSZip()

    files.forEach((file, id) => {
      // Skip folder placeholder files
      if (!id.endsWith("/.folder")) {
        zip.file(id, file.content)
      }
    })

    const content = await zip.generateAsync({ type: "blob" })
    FileSaver.saveAs(content, "workspace.zip")
  }

  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">CodeCollab</h1>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
            {isPrivate ? (
              <>
                <Lock className="h-3 w-3 text-amber-500" />
                <span className="text-xs text-amber-500">Private Room</span>
              </>
            ) : (
              <>
                <Unlock className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">Public Room</span>
              </>
            )}
          </Badge>

          <Badge variant="outline" className="px-2 py-1">
            <span className="text-xs">ID: {roomId}</span>
          </Badge>

          {/* Current file indicator */}
          {self?.presence.currentFile && (
            <Badge variant="secondary" className="px-2 py-1">
              <span className="text-xs">Current file: {self.presence.currentFile.split("/").pop()}</span>
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-full bg-accent px-3 py-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{others.length + 1}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={copyRoomLink}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy Room Link</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadWorkspace}>
              <Download className="mr-2 h-4 w-4" />
              <span>Download Workspace</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <span className="mr-1">{username}</span>
              <Users className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Users in Room</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center">
              <div className="mr-2 h-2 w-2 rounded-full bg-green-500" />
              <span>{username} (You)</span>
            </DropdownMenuItem>
            {others.map((user) => (
              <DropdownMenuItem key={user.connectionId} className="flex items-center">
                <div
                  className="mr-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: `hsl(${user.connectionId * 60}, 100%, 50%)` }}
                />
                <span>{user.presence.username}</span>
                {user.presence.currentFile && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({user.presence.currentFile.split("/").pop()})
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

