"use client"

import { useEffect, useRef, useState } from "react"
import { useStorage, useMutation, useSelf } from "@/liveblocks.config"
import { nanoid } from "nanoid"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Maximize2, Minimize2, Play, X, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { ExecutionResult } from "@/liveblocks.config"

// Import types only, not the actual implementation
import type { Terminal as XTermType } from "xterm"
import type { FitAddon as FitAddonType } from "xterm-addon-fit"

interface TerminalProps {
  isExpanded?: boolean
  onToggleExpand?: () => void
  onClose?: () => void
}

export default function Terminal({ isExpanded, onToggleExpand, onClose }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const [terminal, setTerminal] = useState<XTermType | null>(null)
  const [fitAddon, setFitAddon] = useState<FitAddonType | null>(null)
  const [activeTab, setActiveTab] = useState<string>("terminal")
  const [output, setOutput] = useState<string>("")
  const [isRunning, setIsRunning] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const previewRef = useRef<HTMLIFrameElement>(null)
  const { toast } = useToast()
  const [isClient, setIsClient] = useState(false)

  // Get the current user and file
  const self = useSelf()
  const files = useStorage((root) => root.files)
  const executionResults = useStorage((root) => root.executionResults)

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Add execution result to storage
  const addExecutionResult = useMutation(({ storage }, result: Omit<ExecutionResult, "id" | "timestamp">) => {
    const executionResultsMap = storage.get("executionResults")
    if (!executionResultsMap) return

    const id = nanoid()
    executionResultsMap.set(id, {
      id,
      ...result,
      timestamp: Date.now(),
    })

    return id
  }, [])

  // Initialize terminal
  useEffect(() => {
    if (!isClient || !terminalRef.current || terminal) return

    // Dynamically import xterm and its addons only on the client side
    const loadTerminal = async () => {
      try {
        // Import CSS
        await import("xterm/css/xterm.css")

        // Import modules
        const xtermModule = await import("xterm")
        const fitAddonModule = await import("xterm-addon-fit")
        const webLinksAddonModule = await import("xterm-addon-web-links")

        const XTerm = xtermModule.Terminal
        const FitAddon = fitAddonModule.FitAddon
        const WebLinksAddon = webLinksAddonModule.WebLinksAddon

        const term = new XTerm({
          cursorBlink: true,
          theme: {
            background: "#1e1e1e",
            foreground: "#ffffff",
            cursor: "#ffffff",
            selectionBackground: "rgba(255, 255, 255, 0.3)",
          },
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          fontSize: 14,
          lineHeight: 1.2,
        })

        const fit = new FitAddon()
        term.loadAddon(fit)

        const webLinks = new WebLinksAddon()
        term.loadAddon(webLinks)

        // Add null check before using terminalRef.current
        if (terminalRef.current) {
          term.open(terminalRef.current)
          fit.fit()
        }

        term.writeln("Welcome to CodeCollab Terminal")
        term.writeln('Type "help" for available commands')
        term.writeln("")

        // Set up command handling
        let commandBuffer = ""
        term.onKey(({ key, domEvent }) => {
          const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey

          if (domEvent.keyCode === 13) {
            // Enter
            term.writeln("")
            handleCommand(commandBuffer)
            commandBuffer = ""
            term.write("$ ")
          } else if (domEvent.keyCode === 8) {
            // Backspace
            if (commandBuffer.length > 0) {
              commandBuffer = commandBuffer.substring(0, commandBuffer.length - 1)
              term.write("\b \b")
            }
          } else if (printable) {
            commandBuffer += key
            term.write(key)
          }
        })

        term.write("$ ")

        setTerminal(term)
        setFitAddon(fit)
      } catch (error) {
        console.error("Failed to initialize terminal:", error)
      }
    }

    loadTerminal()

    return () => {
      // Fix the dispose type issue by adding a type check and type assertion
      if (terminal) {
        // Use type assertion to tell TypeScript that terminal is XTermType
        ;(terminal as XTermType).dispose()
      }
    }
  }, [terminal, isClient])

  // Handle terminal resize
  useEffect(() => {
    if (!isClient) return

    const handleResize = () => {
      if (fitAddon) {
        fitAddon.fit()
      }
    }

    window.addEventListener("resize", handleResize)

    // Fit terminal when expanded/collapsed
    if (fitAddon) {
      setTimeout(() => {
        fitAddon.fit()
      }, 100)
    }

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [fitAddon, isExpanded, isClient])

  // Auto-open terminal when JSX/TSX file is selected
  useEffect(() => {
    if (!isClient) return

    if (self?.presence.currentFile) {
      const fileType = self.presence.currentFile.split(".").pop()?.toLowerCase()
      if (fileType === "jsx" || fileType === "tsx") {
        // Terminal is already open, no need to call onToggleExpand
        // Just make sure the terminal is visible
      }
    }
  }, [self?.presence.currentFile, isClient])

  // Handle command execution
  const handleCommand = (command: string) => {
    if (!terminal) return

    if (command === "clear" || command === "cls") {
      terminal.clear()
    } else if (command === "help") {
      terminal.writeln("Available commands:")
      terminal.writeln("  clear, cls - Clear the terminal")
      terminal.writeln("  run - Run the current file")
      terminal.writeln("  help - Show this help message")
    } else if (command === "run") {
      runCurrentFile()
    } else if (command.trim() === "") {
      // Do nothing for empty command
    } else {
      terminal.writeln(`Command not found: ${command}`)
    }
  }

  // Function to get the current file content
  const getCurrentFileContent = () => {
    if (!self?.presence.currentFile || !files) return null
    const currentFile = files.get(self.presence.currentFile)
    if (!currentFile) return null

    return {
      content: currentFile.content,
      type: currentFile.type,
      name: currentFile.name,
    }
  }

  // Run the current file
  const runCurrentFile = async () => {
    if (!terminal) return

    const fileData = getCurrentFileContent()
    if (!fileData) {
      terminal.writeln("No file is currently open")
      return
    }

    setIsRunning(true)
    terminal.writeln(`Running ${fileData.name}...`)

    try {
      // Determine file type and how to run it
      const { content, type } = fileData
      let result = ""
      let error: string | undefined = undefined
      let isWeb = false

      // Clear previous output
      setOutput("")

      // For HTML files, set up preview
      if (type === "html") {
        setPreviewHtml(content)
        isWeb = true
        result = "HTML preview is ready"
        setActiveTab("preview")
      }
      // For React JSX/TSX files
      else if (type === "jsx" || type === "tsx") {
        // Create a React preview
        const htmlTemplate = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
            <style>
              body { font-family: sans-serif; margin: 0; padding: 20px; }
            </style>
          </head>
          <body>
            <div id="root"></div>
            <script type="text/babel">
            ${content}
            
            // Try to render the component
            try {
              const rootElement = document.getElementById('root');
              // Find the default export or the first component
              const componentNames = Object.keys(window).filter(key => 
                typeof window[key] === 'function' && 
                /^[A-Z]/.test(key) && 
                key !== 'React' && 
                key !== 'ReactDOM'
              );
              
              if (componentNames.length > 0) {
                const ComponentToRender = window[componentNames[0]];
                ReactDOM.render(React.createElement(ComponentToRender), rootElement);
              } else {
                rootElement.innerHTML = '<p>No React component found to render</p>';
              }
            } catch (error) {
              document.getElementById('root').innerHTML = '<p>Error rendering component: ' + error.message + '</p>';
              console.error(error);
            }
            </script>
          </body>
          </html>
        `
        setPreviewHtml(htmlTemplate)
        isWeb = true
        result = "React component preview is ready"
        setActiveTab("preview")
      }
      // For CSS files
      else if (type === "css") {
        // Create a simple HTML preview with the CSS applied
        const htmlTemplate = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>${content}</style>
          </head>
          <body>
            <div class="container">
              <h1>CSS Preview</h1>
              <p>This is a preview of your CSS styles applied to some basic HTML elements.</p>
              <button>Button</button>
              <div class="box">Box Element</div>
              <ul>
                <li>List Item 1</li>
                <li>List Item 2</li>
                <li>List Item 3</li>
              </ul>
            </div>
          </body>
          </html>
        `
        setPreviewHtml(htmlTemplate)
        isWeb = true
        result = "CSS preview is ready"
        setActiveTab("preview")
      }
      // For JavaScript files (non-React)
      else if (type === "js" || type === "ts") {
        try {
          // Create a sandbox environment
          const originalConsoleLog = console.log
          const originalConsoleError = console.error
          const logs: string[] = []

          // Override console.log and console.error
          console.log = (...args) => {
            logs.push(
              args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg))).join(" "),
            )
          }
          console.error = (...args) => {
            logs.push(
              `Error: ${args
                .map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)))
                .join(" ")}`,
            )
          }

          // For regular JS/TS, execute the code
          try {
            // Use Function constructor to create a sandbox
            const sandboxFn = new Function("console", content)
            sandboxFn({ log: console.log, error: console.error })
            result = logs.join("\n")
          } catch (e) {
            error = e instanceof Error ? e.message : String(e)
          }

          // Restore console functions
          console.log = originalConsoleLog
          console.error = originalConsoleError

          // Set output
          setOutput(result)

          // Log to terminal
          if (error) {
            terminal.writeln(`Error: ${error}`)
          } else {
            terminal.writeln("Execution completed successfully")
            if (logs.length > 0 && !isWeb) {
              terminal.writeln("Output:")
              logs.forEach((log) => terminal.writeln(log))
            }
          }
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : String(e)
          terminal.writeln(`Error: ${errorMessage}`)
          error = errorMessage
        }
      } else {
        terminal.writeln(`Unsupported file type: ${type}`)
        error = `Unsupported file type: ${type}`
      }

      // Store execution result
      const resultId = await addExecutionResult({
        language: type,
        code: content,
        type: isWeb ? "web" : "non-web",
        status: error ? "error" : "success",
        result: result,
        // Fix the error type issue by ensuring it's either a string or undefined
        error: error,
      })

      if (resultId) {
        terminal.writeln(`Execution ID: ${resultId}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      terminal.writeln(`Error: ${errorMessage}`)

      toast({
        title: "Execution Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  // Refresh the preview
  const refreshPreview = () => {
    if (previewRef.current) {
      previewRef.current.src = "about:blank"
      setTimeout(() => {
        if (previewRef.current) {
          const doc = previewRef.current.contentDocument
          if (doc) {
            doc.open()
            doc.write(previewHtml)
            doc.close()
          }
        }
      }, 50)
    }
  }

  // Set iframe content when previewHtml changes
  useEffect(() => {
    if (!isClient) return

    if (previewHtml && previewRef.current) {
      const doc = previewRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(previewHtml)
        doc.close()
      }
    }
  }, [previewHtml, isClient])

  // Auto-run JSX/TSX files when they're selected
  useEffect(() => {
    if (!isClient) return

    if (self?.presence.currentFile && terminal) {
      const fileType = self.presence.currentFile.split(".").pop()?.toLowerCase()
      if ((fileType === "jsx" || fileType === "tsx") && !isRunning) {
        // Auto-run the file after a short delay to ensure everything is loaded
        const timer = setTimeout(() => {
          runCurrentFile()
        }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [self?.presence.currentFile, terminal, isRunning, isClient])

  return (
    <div className="h-full flex flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between w-full">
            <TabsList>
              <TabsTrigger value="terminal">Terminal</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={runCurrentFile}
                disabled={isRunning || !self?.presence.currentFile}
                title="Run current file"
              >
                {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              </Button>

              {onToggleExpand && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onToggleExpand}
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              )}

              {onClose && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Close terminal">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Tabs>
      </div>

      <TabsContent value="terminal" className="flex-1 p-0 m-0">
        <div ref={terminalRef} className="h-full w-full" />
      </TabsContent>

      <TabsContent value="preview" className="flex-1 p-0 m-0 relative">
        {previewHtml ? (
          <>
            <div className="absolute top-2 right-2 z-10">
              <Button variant="secondary" size="sm" onClick={refreshPreview} className="h-7 px-2">
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
            <iframe
              ref={previewRef}
              className="w-full h-full border-0"
              title="Code Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Run a file to see the preview</p>
          </div>
        )}
      </TabsContent>
    </div>
  )
}

