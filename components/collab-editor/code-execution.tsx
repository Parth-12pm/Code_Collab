"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Loader2,
  TerminalIcon,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useStorage,
  useMutation,
  useMyPresence,
  useSelf,
} from "@/liveblocks.config";
import { LiveMap } from "@liveblocks/client";
import {
  type Language,
  LanguageSelector,
  languages,
} from "./language-selector";
import { SandpackPreview } from "./sandpack-preview";
import { NonWebPreview } from "./non-web-preview";
import { nanoid } from "nanoid";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import type { ExecutionResult } from "@/liveblocks.config";

// Import types only, not the actual implementation
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { IDisposable } from "xterm";

interface XTermType extends Terminal {
  dispose(): void;
  clear(): void;
  writeln(text: string): void;
  write(text: string): void;
  onKey(
    handler: (event: { key: string; domEvent: KeyboardEvent }) => void
  ): IDisposable;
}

export function CodeExecution() {
  const [language, setLanguage] = useState<Language>();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionId, setExecutionId] = useState("");
  const [showTerminal, setShowTerminal] = useState(false);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [terminalTab, setTerminalTab] = useState<string>("terminal");
  const [isClient, setIsClient] = useState(false);
  const [terminal, setTerminal] = useState<XTermType | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>("");

  const terminalRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const files = useStorage((root) => root.files);
  const [myPresence] = useMyPresence();
  const self = useSelf();
  const executionResults = useStorage((root) => root.executionResults);

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get the current file content
  const currentFile = myPresence.currentFile;
  const currentFileContent =
    currentFile && files ? files.get(currentFile)?.content || "" : "";

  // Create a mutation to update the execution results
  const updateExecutionResults = useMutation(({ storage }, results) => {
    const executionResults = storage.get("executionResults");
    if (!executionResults) {
      storage.set("executionResults", new LiveMap());
    }
    storage.get("executionResults").set(results.id, results);
  }, []);

  // Add execution result to storage
  const addExecutionResult = useMutation(
    ({ storage }, result: Omit<ExecutionResult, "id" | "timestamp">) => {
      const executionResultsMap = storage.get("executionResults");
      if (!executionResultsMap) return;

      const id = nanoid();
      executionResultsMap.set(id, {
        id,
        ...result,
        timestamp: Date.now(),
      });

      return id;
    },
    []
  );

  // Get the execution results from storage
  const executionResult = useStorage((root) =>
    root.executionResults?.get(executionId)
  );

  // Handle language change
  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  // Execute the code
  const executeCode = async () => {
    if (!language || !currentFile || !currentFileContent) return;

    setIsExecuting(true);
    const newExecutionId = nanoid();
    setExecutionId(newExecutionId);

    try {
      if (language.type === "web") {
        // For web languages, we don't need to make an API call
        // Just update the execution results with the current file content
        updateExecutionResults({
          id: newExecutionId,
          language: language.id,
          code: currentFileContent,
          type: "web",
          status: "success",
          timestamp: Date.now(),
        });
      } else {
        // For non-web languages, make an API call to execute the code
        const response = await fetch("/api/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: language.id,
            code: currentFileContent,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to execute code");
        }

        // Update the execution results
        updateExecutionResults({
          id: newExecutionId,
          language: language.id,
          code: currentFileContent,
          type: "non-web",
          status: "success",
          result: result,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error("Error executing code:", error);

      // Update the execution results with the error
      updateExecutionResults({
        id: newExecutionId,
        language: language.id,
        code: currentFileContent,
        type: language.type,
        status: "error",
        error: (error as Error).message,
        timestamp: Date.now(),
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Detect language from file extension when current file changes
  useEffect(() => {
    if (currentFile) {
      const extension = currentFile.split(".").pop();
      if (extension) {
        const detectedLanguage = languages.find(
          (lang) => lang.extension === extension
        );
        if (detectedLanguage) {
          setLanguage(detectedLanguage);
        }
      }
    }
  }, [currentFile]);

  // Toggle terminal expand
  const toggleTerminalExpand = () => {
    setIsTerminalExpanded(!isTerminalExpanded);
  };

  // Toggle terminal visibility
  const toggleTerminal = () => {
    setShowTerminal(!showTerminal);
    if (!showTerminal) {
      setActiveTab("terminal");
    } else {
      setActiveTab("preview");
    }
  };

  // Initialize terminal
  useEffect(() => {
    if (!isClient || !terminalRef.current || terminal || !showTerminal) return;

    // Dynamically import xterm and its addons only on the client side
    const loadTerminal = async () => {
      try {
        // Import CSS
        await import("xterm/css/xterm.css");

        // Import modules
        const xtermModule = await import("@xterm/xterm");
        const fitAddonModule = await import("@xterm/addon-fit");
        const webLinksAddonModule = await import("@xterm/addon-web-links");

        const XTerm = xtermModule.Terminal;
        const FitAddon = fitAddonModule.FitAddon;
        const WebLinksAddon = webLinksAddonModule.WebLinksAddon;

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
        });

        const fit = new FitAddon();
        term.loadAddon(fit);

        const webLinks = new WebLinksAddon();
        term.loadAddon(webLinks);

        // Add null check before using terminalRef.current
        if (terminalRef.current) {
          term.open(terminalRef.current);
          fit.fit();
        }

        term.writeln("Welcome to CodeCollab Terminal");
        term.writeln('Type "help" for available commands');
        term.writeln("");

        // Set up command handling
        let commandBuffer = "";

        const disposable = term.onKey(({ key, domEvent }) => {
          const printable =
            !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

          if (domEvent.keyCode === 13) {
            // Enter
            term.writeln("");
            handleCommand(commandBuffer);
            commandBuffer = "";
            term.write("$ ");
          } else if (domEvent.keyCode === 8) {
            // Backspace
            if (commandBuffer.length > 0) {
              commandBuffer = commandBuffer.substring(
                0,
                commandBuffer.length - 1
              );
              term.write("\b \b");
            }
          } else if (printable) {
            commandBuffer += key;
            term.write(key);
          }
        });

        term.write("$ ");

        // Store the disposable in term for cleanup
        (term as any)._disposable = disposable;

        setTerminal(term as XTermType);
        setFitAddon(fit);
      } catch (error) {
        console.error("Failed to initialize terminal:", error);
      }
    };

    loadTerminal();

    return () => {
      // Fix the dispose type issue by adding a type check and type assertion
      if (terminal) {
        // Use type assertion to tell TypeScript that terminal is XTermType
        (terminal as XTermType).dispose();
      }
    };
  }, [terminal, isClient, showTerminal]);

  // Handle terminal resize
  useEffect(() => {
    if (!isClient || !showTerminal) return;

    const handleResize = () => {
      if (fitAddon) {
        fitAddon.fit();
      }
    };

    window.addEventListener("resize", handleResize);

    // Fit terminal when expanded/collapsed
    if (fitAddon) {
      setTimeout(() => {
        fitAddon.fit();
      }, 100);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [fitAddon, isTerminalExpanded, isClient, showTerminal]);

  const handleCommand = (command: string) => {
    if (!terminal) return;

    if (command === "clear" || command === "cls") {
      terminal.clear();
    } else if (command === "help") {
      terminal.writeln("Available commands:");
      terminal.writeln("  clear, cls - Clear the terminal");
      terminal.writeln("  run - Run the current file");
      terminal.writeln("  help - Show this help message");
    } else if (command === "run") {
      runCurrentFile();
    } else if (command.trim() === "") {
      // Do nothing for empty command
    } else {
      terminal.writeln(`Command not found: ${command}`);
    }
  };

  // Function to get the current file content
  const getCurrentFileContent = () => {
    if (!self?.presence.currentFile || !files) return null;
    const currentFile = files.get(self.presence.currentFile);
    if (!currentFile) return null;

    return {
      content: currentFile.content,
      type: currentFile.type,
      name: currentFile.name,
    };
  };

  // Run the current file in terminal
  const runCurrentFile = async () => {
    if (!terminal) return;

    const fileData = getCurrentFileContent();
    if (!fileData) {
      terminal.writeln("No file is currently open");
      return;
    }

    setIsRunning(true);
    terminal.writeln(`Running ${fileData.name}...`);

    try {
      // Determine file type and how to run it
      const { content, type } = fileData;
      let result = "";
      let error: string | undefined = undefined;
      let isWeb = false;

      // Clear previous output
      setOutput("");

      // For HTML files, set up preview
      if (type === "html") {
        setPreviewHtml(content);
        isWeb = true;
        result = "HTML preview is ready";
        setTerminalTab("preview");
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
                rootElement.innerHTML = '<p>No React component component to render</p>';
              }
            } catch (error) {
              document.getElementById('root').innerHTML = '<p>Error rendering component: ' + error.message + '</p>';
              console.error(error);
            }
            </script>
          </body>
          </html>
        `;
        setPreviewHtml(htmlTemplate);
        isWeb = true;
        result = "React component preview is ready";
        setTerminalTab("preview");
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
        `;
        setPreviewHtml(htmlTemplate);
        isWeb = true;
        result = "CSS preview is ready";
        setTerminalTab("preview");
      }
      // For JavaScript files (non-React)
      else if (type === "js" || type === "ts") {
        try {
          // Create a sandbox environment
          const originalConsoleLog = console.log;
          const originalConsoleError = console.error;
          const logs: string[] = [];

          // Override console.log and console.error
          console.log = (...args) => {
            logs.push(
              args
                .map((arg) =>
                  typeof arg === "object"
                    ? JSON.stringify(arg, null, 2)
                    : String(arg)
                )
                .join(" ")
            );
          };
          console.error = (...args) => {
            logs.push(
              `Error: ${args
                .map((arg) =>
                  typeof arg === "object"
                    ? JSON.stringify(arg, null, 2)
                    : String(arg)
                )
                .join(" ")}`
            );
          };

          // For regular JS /TS, execute the code
          try {
            // Use Function constructor to create a sandbox
            const sandboxFn = new Function("console", content);
            sandboxFn({ log: console.log, error: console.error });
            result = logs.join("\n");
          } catch (e) {
            error = e instanceof Error ? e.message : String(e);
          }

          // Restore console functions
          console.log = originalConsoleLog;
          console.error = originalConsoleError;

          // Set output
          setOutput(result);

          // Log to terminal
          if (error) {
            terminal.writeln(`Error: ${error}`);
          } else {
            terminal.writeln("Execution completed successfully");
            if (logs.length > 0 && !isWeb) {
              terminal.writeln("Output:");
              logs.forEach((log) => terminal.writeln(log));
            }
          }
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          terminal.writeln(`Error: ${errorMessage}`);
          error = errorMessage;
        }
      } else {
        terminal.writeln(`Unsupported file type: ${type}`);
        error = `Unsupported file type: ${type}`;
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
      });

      if (resultId) {
        terminal.writeln(`Execution ID: ${resultId}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      terminal.writeln(`Error: ${errorMessage}`);

      toast({
        title: "Execution Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Refresh the preview
  const refreshPreview = () => {
    if (previewRef.current) {
      previewRef.current.src = "about:blank";
      setTimeout(() => {
        if (previewRef.current) {
          const doc = previewRef.current.contentDocument;
          if (doc) {
            doc.open();
            doc.write(previewHtml);
            doc.close();
          }
        }
      }, 50);
    }
  };

  // Set iframe content content previewHtml changes
  useEffect(() => {
    if (!isClient) return;

    if (previewHtml && previewRef.current) {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewHtml);
        doc.close();
      }
    }
  }, [previewHtml, isClient]);

  // Auto-run JSX/TSX files when they're selected
  useEffect(() => {
    if (!isClient) return;

    if (self?.presence.currentFile && terminal && showTerminal) {
      const fileType = self.presence.currentFile
        .split(".")
        .pop()
        ?.toLowerCase();
      if ((fileType === "jsx" || fileType === "tsx") && !isRunning) {
        // Auto-run the file after a short delay to ensure everything is loaded
        const timer = setTimeout(() => {
          runCurrentFile();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [self?.presence.currentFile, terminal, isRunning, isClient, showTerminal]);

  // Render the terminal UI
  const renderTerminal = () => {
    if (!isClient) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">
            Loading terminal...
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col border-l border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-2">
          <Tabs
            value={terminalTab}
            onValueChange={setTerminalTab}
            className="w-full"
          >
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
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={toggleTerminalExpand}
                  title={isTerminalExpanded ? "Collapse" : "Expand"}
                >
                  {isTerminalExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={toggleTerminal}
                  title="Close terminal"
                >
                  <X className="h-4 w-4" />
                </Button>
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={refreshPreview}
                  className="h-7 px-2"
                >
                  <Loader2 className="h-3 w-3 mr-1" />
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
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <LanguageSelector
            onLanguageChange={handleLanguageChange}
            currentLanguage={language}
          />
          <Button
            onClick={executeCode}
            disabled={isExecuting || !currentFile || !language}
            size="sm"
            className="gap-2"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run
              </>
            )}
          </Button>
          <Button
            variant={showTerminal ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={toggleTerminal}
          >
            <TerminalIcon className="h-4 w-4" />
            <span className="hidden md:inline">Terminal</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsContent value="preview" className="h-full p-0 m-0">
          <ResizablePanelGroup direction="vertical" className="flex-1">
            <ResizablePanel
              defaultSize={70}
              minSize={30}
              className="flex flex-col"
            >
              <Card className="h-full border-0 rounded-none flex flex-col">
                <CardHeader className="py-1 px-4 min-h-[32px] flex items-center">
                  <CardTitle className="text-xs font-medium">Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                  {executionResult ? (
                    executionResult.type === "web" ? (
                      <SandpackPreview
                        language={executionResult.language}
                        code={executionResult.code}
                      />
                    ) : (
                      <NonWebPreview result={executionResult.result} />
                    )
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Run your code to see the preview
                    </div>
                  )}
                </CardContent>
              </Card>
            </ResizablePanel>
            <ResizablePanel
              defaultSize={30}
              minSize={20}
              className="flex flex-col"
            >
              <Card className="h-full border-0 rounded-none flex flex-col">
                <CardHeader className="py-1 px-4 min-h-[32px] border-t border-border flex items-center">
                  <CardTitle className="text-xs font-medium">Console</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                  <div className="h-full bg-black text-white p-2 font-mono text-sm overflow-auto">
                    {executionResult ? (
                      <>
                        {executionResult.type === "web" ? (
                          <div className="px-2">
                            Console output will appear here when you run the
                            code.
                          </div>
                        ) : (
                          executionResult.result && (
                            <>
                              {executionResult.result.run?.stdout && (
                                <div className="text-green-400 px-2">
                                  <pre>{executionResult.result.run.stdout}</pre>
                                </div>
                              )}
                              {executionResult.result.run?.stderr && (
                                <div className="text-red-400 px-2">
                                  <pre>{executionResult.result.run.stderr}</pre>
                                </div>
                              )}
                              {executionResult.result.run?.output && (
                                <div className="text-white px-2">
                                  <pre>{executionResult.result.run.output}</pre>
                                </div>
                              )}
                              {executionResult.result.run?.code !== 0 && (
                                <div className="text-red-400 mt-2 px-2">
                                  Process exited with code{" "}
                                  {executionResult.result.run.code}
                                </div>
                              )}
                            </>
                          )
                        )}
                        {executionResult.status === "error" && (
                          <div className="text-red-400 px-2">
                            <pre>{executionResult.error}</pre>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="px-2 text-muted-foreground">
                        Run your code to see console output
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </ResizablePanel>
          </ResizablePanelGroup>
        </TabsContent>
        <TabsContent value="terminal" className="h-full p-0 m-0">
          {renderTerminal()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
