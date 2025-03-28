"use client"

import { useState, useEffect } from "react"
import { Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStorage, useMutation, useMyPresence } from "@/liveblocks.config"
import { LiveMap } from "@liveblocks/client"
import { type Language, LanguageSelector, languages } from "./language-selector"
import { SandpackPreview } from "./sandpack-preview"
import { NonWebPreview } from "./non-web-preview"
import { nanoid } from "nanoid"
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function CodeExecution() {
  const [language, setLanguage] = useState<Language>()
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionId, setExecutionId] = useState("")

  const files = useStorage((root) => root.files)
  const [myPresence] = useMyPresence()

  // Get the current file content
  const currentFile = myPresence.currentFile
  const currentFileContent = currentFile && files ? files.get(currentFile)?.content || "" : ""

  // Create a mutation to update the execution results
  const updateExecutionResults = useMutation(({ storage }, results) => {
    const executionResults = storage.get("executionResults")
    if (!executionResults) {
      storage.set("executionResults", new LiveMap())
    }
    storage.get("executionResults").set(results.id, results)
  }, [])

  // Get the execution results from storage
  const executionResults = useStorage((root) => root.executionResults?.get(executionId))

  // Handle language change
  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  // Execute the code
  const executeCode = async () => {
    if (!language || !currentFile || !currentFileContent) return

    setIsExecuting(true)
    const newExecutionId = nanoid()
    setExecutionId(newExecutionId)

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
        })
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
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to execute code")
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
        })
      }
    } catch (error) {
      console.error("Error executing code:", error)

      // Update the execution results with the error
      updateExecutionResults({
        id: newExecutionId,
        language: language.id,
        code: currentFileContent,
        type: language.type,
        status: "error",
        error: (error as Error).message,
        timestamp: Date.now(),
      })
    } finally {
      setIsExecuting(false)
    }
  }

  // Detect language from file extension when current file changes
  useEffect(() => {
    if (currentFile) {
      const extension = currentFile.split(".").pop()
      if (extension) {
        const detectedLanguage = languages.find((lang) => lang.extension === extension)
        if (detectedLanguage) {
          setLanguage(detectedLanguage)
        }
      }
    }
  }, [currentFile])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <LanguageSelector onLanguageChange={handleLanguageChange} currentLanguage={language} />
          <Button onClick={executeCode} disabled={isExecuting || !currentFile || !language} size="sm" className="gap-2">
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
        </div>
      </div>

      <ResizablePanelGroup direction="vertical" className="flex-1">
        <ResizablePanel defaultSize={70} minSize={30} className="flex flex-col">
          <Card className="h-full border-0 rounded-none flex flex-col">
            <CardHeader className="py-1 px-4 min-h-[32px] flex items-center">
              <CardTitle className="text-xs font-medium">Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {executionResults ? (
                executionResults.type === "web" ? (
                  <SandpackPreview language={executionResults.language} code={executionResults.code} />
                ) : (
                  <NonWebPreview result={executionResults.result} />
                )
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Run your code to see the preview
                </div>
              )}
            </CardContent>
          </Card>
        </ResizablePanel>

        <ResizablePanel defaultSize={30} minSize={20} className="flex flex-col">
          <Card className="h-full border-0 rounded-none flex flex-col">
            <CardHeader className="py-1 px-4 min-h-[32px] border-t border-border flex items-center">
              <CardTitle className="text-xs font-medium">Console</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="h-full bg-black text-white p-2 font-mono text-sm overflow-auto">
                {executionResults ? (
                  <>
                    {executionResults.type === "web" ? (
                      <div className="px-2">Console output will appear here when you run the code.</div>
                    ) : (
                      executionResults.result && (
                        <>
                          {executionResults.result.run?.stdout && (
                            <div className="text-green-400 px-2">
                              <pre>{executionResults.result.run.stdout}</pre>
                            </div>
                          )}
                          {executionResults.result.run?.stderr && (
                            <div className="text-red-400 px-2">
                              <pre>{executionResults.result.run.stderr}</pre>
                            </div>
                          )}
                          {executionResults.result.run?.output && (
                            <div className="text-white px-2">
                              <pre>{executionResults.result.run.output}</pre>
                            </div>
                          )}
                          {executionResults.result.run?.code !== 0 && (
                            <div className="text-red-400 mt-2 px-2">
                              Process exited with code {executionResults.result.run.code}
                            </div>
                          )}
                        </>
                      )
                    )}
                    {executionResults.status === "error" && (
                      <div className="text-red-400 px-2">
                        <pre>{executionResults.error}</pre>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-2 text-muted-foreground">Run your code to see console output</div>
                )}
              </div>
            </CardContent>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

