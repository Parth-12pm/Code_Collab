"use client"

import { useState, useEffect, useRef } from "react"
import { useOthers, useStorage, useMutation, useStorageStatus, useSelf } from "@/liveblocks.config"
import { MessageSquare, Send, X, Check, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LiveList } from "@liveblocks/client"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define message type
type Message = {
  id: number
  user: string
  content: string
  timestamp: number
  readBy: string[] // Array of usernames who have read the message
}

export default function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const others = useOthers()
  const self = useSelf()

  // Check if storage is loaded
  const storageStatus = useStorageStatus()
  const isStorageLoaded = storageStatus === "synchronized"

  // Get messages from storage
  const storageMessages = useStorage((root) => root.messages)
  const [localMessages, setLocalMessages] = useState<Message[]>([
    {
      id: 1,
      user: "system",
      content: "Welcome to the collaborative editor!",
      timestamp: Date.now(),
      readBy: [],
    },
  ])

  // Initialize messages in storage
  const initializeMessages = useMutation(({ storage }) => {
    if (!storage.get("messages")) {
      storage.set(
        "messages",
        new LiveList([
          {
            id: 1,
            user: "system",
            content: "Welcome to the collaborative editor!",
            timestamp: Date.now(),
            readBy: [],
          },
        ]),
      )
    }
  }, [])

  // Add message to storage
  const addMessage = useMutation(
    ({ storage, self }) => {
      if (!newMessage.trim()) return

      const username = self.presence.username || "Anonymous"
      const message = {
        id: Date.now(),
        user: username,
        content: newMessage,
        timestamp: Date.now(),
        readBy: [username], // Mark as read by sender
      }

      const messages = storage.get("messages")
      if (!messages) {
        storage.set("messages", new LiveList([message]))
      } else {
        messages.push(message)
      }

      setNewMessage("")
    },
    [newMessage],
  )

  // Mark messages as read
  const markMessagesAsRead = useMutation(
    ({ storage, self }) => {
      if (!isOpen) return

      const username = self.presence.username || "Anonymous"
      const messages = storage.get("messages")

      if (!messages) return

      // Update each message that hasn't been read by the current user
      messages.forEach((message, index) => {
        if (!message.readBy.includes(username)) {
          const updatedReadBy = [...message.readBy, username]
          messages.set(index, { ...message, readBy: updatedReadBy })
        }
      })

      // Reset unread count
      setUnreadCount(0)
    },
    [isOpen],
  )

  // Initialize messages on component mount - only when storage is loaded
  useEffect(() => {
    if (isStorageLoaded) {
      initializeMessages()
    }
  }, [isStorageLoaded, initializeMessages])

  // Update local messages when storage changes
  useEffect(() => {
    if (storageMessages && Array.isArray(storageMessages)) {
      setLocalMessages(storageMessages)

      // Count unread messages
      if (!isOpen && self) {
        const username = self.presence.username || "Anonymous"
        const unread = storageMessages.filter((msg) => !msg.readBy.includes(username)).length
        setUnreadCount(unread)
      }
    } else if (storageMessages) {
      const messages = Array.from(storageMessages)
      setLocalMessages(messages)

      // Count unread messages
      if (!isOpen && self) {
        const username = self.presence.username || "Anonymous"
        const unread = messages.filter((msg) => !msg.readBy.includes(username)).length
        setUnreadCount(unread)
      }
    }
  }, [storageMessages, isOpen, self])

  // Scroll to bottom when new messages arrive or chat is opened
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [localMessages, isOpen])

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isOpen && isStorageLoaded) {
      markMessagesAsRead()
    }
  }, [isOpen, isStorageLoaded, markMessagesAsRead, localMessages])

  const sendMessage = () => {
    if (isStorageLoaded && newMessage.trim()) {
      addMessage()
    }
  }

  // Get read status for a message
  const getReadStatus = (message: Message) => {
    if (message.user === "system") return null

    const totalUsers = others.length + 1 // Including self
    const readCount = message.readBy.length

    if (readCount === totalUsers) {
      return "read-by-all"
    } else if (readCount > 1) {
      return "read-by-some"
    } else {
      return "sent"
    }
  }

  // Check if message is from current user
  const isCurrentUser = (username: string) => {
    return self?.presence.username === username
  }

  return (
    <>
      {/* Chat toggle button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
            >
              <MessageSquare className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Open chat</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 z-50 flex h-[500px] w-80 flex-col overflow-hidden rounded-lg border bg-card shadow-xl"
          >
            <div className="flex items-center justify-between border-b p-3">
              <h3 className="font-medium">Chat</h3>
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-3">
              <div className="space-y-4">
                {localMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${isCurrentUser(message.user) ? "justify-end" : "justify-start"}`}
                  >
                    {!isCurrentUser(message.user) && message.user !== "system" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback
                          style={{
                            backgroundColor: `hsl(${(message.user.charCodeAt(0) * 10) % 360}, 70%, 50%)`,
                          }}
                        >
                          {message.user.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`flex flex-col ${isCurrentUser(message.user) ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">{message.user}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div
                        className={`rounded-lg px-3 py-2 text-sm ${
                          message.user === "system"
                            ? "bg-muted text-muted-foreground"
                            : isCurrentUser(message.user)
                              ? "bg-primary text-primary-foreground"
                              : "bg-accent"
                        }`}
                      >
                        {message.content}
                      </div>

                      {/* Read status indicators */}
                      {isCurrentUser(message.user) && (
                        <>
                          {getReadStatus(message) === "read-by-all" && (
                            <div className="flex items-center mt-1">
                              <CheckCheck className="h-3 w-3 text-blue-500" />
                              <span className="text-xs text-muted-foreground ml-1">Read by all</span>
                            </div>
                          )}
                          {getReadStatus(message) === "read-by-some" && (
                            <div className="flex items-center mt-1">
                              <Check className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-muted-foreground ml-1">
                                Read by {message.readBy.length} of {others.length + 1}
                              </span>
                            </div>
                          )}
                          {getReadStatus(message) === "sent" && (
                            <div className="flex items-center mt-1">
                              <Check className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground ml-1">Sent</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {isCurrentUser(message.user) && message.user !== "system" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback
                          style={{
                            backgroundColor: `hsl(${(message.user.charCodeAt(0) * 10) % 360}, 70%, 50%)`,
                          }}
                        >
                          {message.user.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button size="icon" onClick={sendMessage} disabled={!isStorageLoaded || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

