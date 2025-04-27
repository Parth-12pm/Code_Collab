"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { X, Copy, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatInterfaceProps {
  onClose: () => void
}

export default function ChatInterface({ onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [showScrollbar, setShowScrollbar] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [copyError, setCopyError] = useState<boolean>(false)

  // Check if scrollbar is needed
  useEffect(() => {
    const checkScrollbar = () => {
      if (chatContainerRef.current) {
        const { scrollHeight, clientHeight } = chatContainerRef.current
        setShowScrollbar(scrollHeight > clientHeight)
      }
    }

    checkScrollbar()
    // Set up a resize observer to check when the container size changes
    const resizeObserver = new ResizeObserver(checkScrollbar)
    if (chatContainerRef.current) {
      resizeObserver.observe(chatContainerRef.current)
    }

    return () => {
      if (chatContainerRef.current) {
        resizeObserver.unobserve(chatContainerRef.current)
      }
    }
  }, [messages])

  // Reset copied state after 3 seconds
  useEffect(() => {
    if (copiedCode || copyError) {
      const timer = setTimeout(() => {
        setCopiedCode(null)
        setCopyError(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [copiedCode, copyError])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    setHasInteracted(true)
    const userMessage = { role: "user" as const, content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to get response")
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
    } catch (error) {
      console.error("Error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    // Check if the Clipboard API is available
    if (!navigator.clipboard) {
      // Fallback for browsers that don't support Clipboard API
      try {
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed" // Avoid scrolling to bottom
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const successful = document.execCommand("copy")
        document.body.removeChild(textArea)

        if (successful) {
          setCopiedCode(text)
        } else {
          setCopyError(true)
        }
      } catch (err) {
        console.error("Fallback: Could not copy text: ", err)
        setCopyError(true)
      }
      return
    }

    // Use the Clipboard API
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedCode(text)
        // Optional: Show a toast or notification that the code was copied
        console.log("Code copied to clipboard")
      })
      .catch((err) => {
        console.error("Could not copy text: ", err)
        setCopyError(true)
      })
  }

  return (
    <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] flex flex-col shadow-xl z-50 overflow-hidden bg-zinc-900 border-zinc-800 text-white rounded-lg">
      <div className="bg-zinc-900 p-4 font-medium flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M8 12H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 12H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 16V16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path
              d="M7 6V4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V6"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span className="text-base font-semibold tracking-tight">AI Coding Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors duration-200 rounded-full p-1 hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={chatContainerRef}
        className={cn("flex-1 overflow-y-auto p-4 space-y-4", showScrollbar ? "custom-scrollbar" : "no-scrollbar")}
      >
        {!hasInteracted && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="mb-6 text-zinc-400">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M16 12H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 16V16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path
                  d="M7 6V4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V6"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <p className="text-lg mb-6 font-medium">Ask the AI assistant for help with your code.</p>
            <div className="text-zinc-400 text-sm space-y-2">
              <p className="mb-2 text-zinc-300">Examples:</p>
              <p className="py-1 px-3 bg-zinc-800 rounded-md hover:bg-zinc-750 cursor-pointer transition-colors">
                "Explain how this code works"
              </p>
              <p className="py-1 px-3 bg-zinc-800 rounded-md hover:bg-zinc-750 cursor-pointer transition-colors">
                "Help me optimize this function"
              </p>
              <p className="py-1 px-3 bg-zinc-800 rounded-md hover:bg-zinc-750 cursor-pointer transition-colors">
                "How do I implement feature X?"
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn("flex items-start gap-2 mb-4", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M8 12H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M16 12H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M12 16V16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
                <div
                  className={cn(
                    "px-3 py-2 rounded-lg transition-opacity duration-200 animate-in fade-in-50 max-w-[80%]",
                    message.role === "user" ? "bg-white text-black" : "bg-black text-white",
                  )}
                >
                  {message.role === "user" ? (
                    <span className="text-sm">{message.content}</span>
                  ) : (
                    <ReactMarkdown
                      components={{
                        pre: ({ children, ...props }: React.ComponentPropsWithoutRef<'pre'>) => {
                          // Extract code content
                          const childArray = React.Children.toArray(children)
                          const codeElement = childArray.find(
                            (child) => React.isValidElement(child) && child.type === "code",
                          ) as React.ReactElement<{ children: React.ReactNode }> | undefined

                          let codeContent = ""
                          if (React.isValidElement(codeElement)) {
                            codeContent = React.Children.toArray(codeElement.props.children)
                              .map((child) => (typeof child === "string" ? child : ""))
                              .join("")
                          }

                          return (
                            <div className="bg-zinc-900 rounded-md my-2 overflow-hidden border border-zinc-700 relative">
                              <div className="flex justify-between items-center px-4 py-1 bg-zinc-800 border-b border-zinc-700">
                                <span className="text-xs text-zinc-400">Code</span>
                                <button
                                  onClick={() => copyToClipboard(codeContent)}
                                  className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
                                  aria-label="Copy code"
                                  title="Copy code to clipboard"
                                >
                                  {copyError ? (
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                  ) : copiedCode === codeContent ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              <pre {...props} className="p-4 overflow-auto custom-scrollbar">
                                {children}
                              </pre>
                            </div>
                          )
                        },
                        code: ({ node, className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || "")
                          return (
                            <code className={match ? `language-${match[1]}` : ""} {...props}>
                              {children}
                            </code>
                          )
                        },
                        p: ({ children }) => <p className="my-1">{children}</p>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="7"
                        r="4"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2 mb-4 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 12H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M16 12H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 16V16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="bg-black text-white px-3 py-2 rounded-lg animate-in fade-in-50 max-w-[80%]">
                  <div className="flex space-x-2 items-center">
                    <div className="h-2 w-2 rounded-full bg-zinc-500 animate-pulse"></div>
                    <div className="h-2 w-2 rounded-full bg-zinc-500 animate-pulse delay-150"></div>
                    <div className="h-2 w-2 rounded-full bg-zinc-500 animate-pulse delay-300"></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the AI assistant a question..."
              className="bg-zinc-800 border-zinc-700 text-white resize-none h-[40px] max-h-[40px] py-2 px-3 rounded-md focus:ring-1 focus:ring-zinc-500 focus:border-zinc-600 custom-scrollbar overflow-hidden"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  if (input.trim()) {
                    handleSubmit(e)
                  }
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-white text-black h-[40px] w-[40px] rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 20L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path
                d="M6 10L12 4L18 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
      </div>
    </Card>
  )
}

