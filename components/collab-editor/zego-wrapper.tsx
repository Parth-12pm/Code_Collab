"use client"

import { useEffect, useRef } from "react"
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt"

interface ZegoWrapperProps {
  sessionId: string
  username: string
}

export default function ZegoWrapper({ sessionId, username }: ZegoWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const zegoInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID)
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET

    if (!appID || !serverSecret) {
      console.error("🚨 ZegoCloud credentials are missing! Check your .env file.")
      return
    }

    try {
      // Generate a consistent room ID based on the session ID
      // This ensures all users join the same room
      const roomID = sessionId

      // Generate a kit token for the user
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        Date.now().toString(), // Use a unique user ID for each participant
        username || "Guest User",
      )

      // Create the Zego instance
      zegoInstanceRef.current = ZegoUIKitPrebuilt.create(kitToken)

      // Join the room
      zegoInstanceRef.current.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference,
        },
        showScreenSharingButton: true,
        showPreJoinView: false,
        maxUsers: 50,
        turnOnMicrophoneWhenJoining: false,
        turnOnCameraWhenJoining: false,
        useFrontFacingCamera: true,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showUserList: true,
        showRoomDetailsButton: true,
        showLeavingView: false,
        showLayoutButton: true,
        layout: "Auto", // Use "Auto" layout to accommodate multiple users
        showNonVideoUser: true,
        showInviteToCohostButton: true,
        showRemoveCohostButton: true,
      })
    } catch (error) {
      console.error("Error initializing Zego:", error)
    }

    return () => {
      if (zegoInstanceRef.current) {
        try {
          zegoInstanceRef.current.destroy()
        } catch (error) {
          console.error("Error destroying Zego instance:", error)
        }
        zegoInstanceRef.current = null
      }
    }
  }, [sessionId, username])

  return <div ref={containerRef} className="w-full h-full" />
}

