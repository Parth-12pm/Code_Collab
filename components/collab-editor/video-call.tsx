"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Minimize, Maximize, CornerRightDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

// Dynamically import the Zego wrapper component with SSR disabled
const ZegoWrapper = dynamic(() => import("./zego-wrapper"), { ssr: false })

interface VideoCallProps {
  onClose: () => void
  sessionId: string
  username: string
}

export default function VideoCall({ onClose, sessionId, username }: VideoCallProps) {
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [size, setSize] = useState({ width: 400, height: 320 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isMinimized, setIsMinimized] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // Handle mouse down to start dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest(".video-call-controls") ||
        e.target.closest("#resize-handle") ||
        e.target.closest(".zego-uikit"))
    ) {
      // Don't start dragging if clicking on controls, resize handle, or Zego UI
      return
    }

    setIsDragging(true)
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    })
  }

  // Handle mouse move for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x
        const newY = e.clientY - dragOffset.y

        // Ensure the component stays within viewport bounds
        const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 0)
        const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 0)

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        })
      } else if (isResizing) {
        // Calculate new width and height
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y

        // Set minimum size constraints
        const newWidth = Math.max(300, resizeStart.width + deltaX)
        const newHeight = Math.max(200, resizeStart.height + deltaY)

        // Set maximum size constraints
        const maxWidth = window.innerWidth - position.x - 20
        const maxHeight = window.innerHeight - position.y - 20

        setSize({
          width: Math.min(newWidth, maxWidth),
          height: Math.min(newHeight, maxHeight),
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, isResizing, dragOffset, position, resizeStart, size])

  // Set initial position to bottom right
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPosition({
        x: window.innerWidth - size.width - 20,
        y: window.innerHeight - size.height - 20,
      })
    }
  }, [])

  return (
    <Card
      ref={containerRef}
      className={cn(
        "fixed z-50 shadow-lg rounded-lg overflow-hidden",
        isDragging && "cursor-grabbing",
        isResizing && "cursor-nwse-resize",
        !isDragging && !isResizing && "cursor-grab",
        isMinimized ? "w-64 h-16" : "",
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? "16rem" : `${size.width}px`,
        height: isMinimized ? "4rem" : `${size.height}px`,
        transition: isDragging || isResizing ? "none" : "width 0.3s, height 0.3s",
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-primary text-primary-foreground p-2 flex items-center justify-between">
        <div className="font-medium truncate">Video Call: {sessionId.substring(0, 8)}</div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-primary-foreground hover:bg-primary/80"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-primary-foreground hover:bg-primary/80"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <CardContent className="p-0 h-[calc(100%-40px)] flex flex-col">
            {/* Zego video container */}
            <ZegoWrapper sessionId={sessionId} username={username} />
          </CardContent>

          {/* Resize handle - made larger and more prominent */}
          <div
            id="resize-handle"
            className="absolute bottom-0 right-0 w-20 h-20 cursor-nwse-resize z-[9999]"
            style={{
              background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%)",
              pointerEvents: "all",
            }}
            onMouseDown={handleResizeStart}
          >
            <div className="absolute bottom-2 right-2">
              <CornerRightDown className="h-5 w-5 text-primary" />
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

