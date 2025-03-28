"use client"

import { useRef, useEffect, useState } from "react"
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt"
import { X, Minimize, Maximize } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDrag } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { DndProvider } from "react-dnd"

// Define the drag item type
const ItemTypes = {
  VIDEO_WINDOW: "videoWindow",
}

interface FloatingVideoCallProps {
  sessionId: string
  username: string
  onClose: () => void
}

// The draggable video call component
function DraggableVideoCall({ sessionId, username, onClose }: FloatingVideoCallProps) {
  const meetingContainerRef = useRef<HTMLDivElement>(null)
  const zegoInstanceRef = useRef<any>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  // Set up the drag functionality
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.VIDEO_WINDOW,
    item: { type: ItemTypes.VIDEO_WINDOW },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const dragRef = (el: HTMLDivElement | null) => {
    if (el) drag(el)
  }

  // Initialize Zego video call
  useEffect(() => {
    const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID)
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET

    if (!appID || !serverSecret) {
      console.error("🚨 ZegoCloud credentials are missing! Check your .env file.")
      return
    }

    if (!zegoInstanceRef.current && meetingContainerRef.current) {
      // Use the session ID as the room ID
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        sessionId,
        sessionId, // Use sessionId instead of UUID
        username,
        720, // Token expiration time in seconds
      )

      zegoInstanceRef.current = ZegoUIKitPrebuilt.create(kitToken)
      zegoInstanceRef.current.joinRoom({
        container: meetingContainerRef.current,
        sharedLinks: [
          {
            name: "Shareable link",
            url: `${window.location.origin}/editor/${sessionId}`,
          },
        ],
        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference,
        },
        showScreenSharingButton: true,
        showPreJoinView: false, // Skip the pre-join screen
        maxUsers: 10,
      })
    }

    return () => {
      // Leave the room when the component unmounts
      if (zegoInstanceRef.current) {
        zegoInstanceRef.current.destroy()
        zegoInstanceRef.current = null
      }
    }
  }, [sessionId, username])

  // Handle window movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX,
          y: e.clientY,
        })
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [isDragging])

  // Set initial position to bottom right
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPosition({
        x: window.innerWidth - 320,
        y: window.innerHeight - 280,
      })
    }
  }, [])

  return (
    <div
      ref={dragRef}
      className={`fixed bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50 transition-all ${
        isMinimized ? "w-64 h-12" : "w-80 h-64"
      }`}
      style={{
        left: position.x,
        top: position.y,
        opacity: isDragging ? 0.8 : 1,
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <div className="flex items-center justify-between p-2 bg-card">
        <div className="text-sm font-medium">Video Call</div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize className="h-3 w-3" /> : <Minimize className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div
        className={`w-full ${isMinimized ? "hidden" : "block"}`}
        style={{ height: "calc(100% - 32px)" }}
        ref={meetingContainerRef}
      ></div>
    </div>
  )
}

// Wrapper component that provides the DnD context
export default function FloatingVideoCall(props: FloatingVideoCallProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <DraggableVideoCall {...props} />
    </DndProvider>
  )
}

