"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileCode, FileText, FileJson } from "lucide-react"

interface InitialFileDialogProps {
  onSubmit: (fileName: string, fileType: string) => void
}

export default function InitialFileDialog({ onSubmit }: InitialFileDialogProps) {
  const [fileName, setFileName] = useState("")
  const [fileType, setFileType] = useState("js")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (fileName.trim()) {
      onSubmit(fileName, fileType)
    }
  }

  const fileTypes = [
    { id: "js", name: "JavaScript", icon: FileCode, color: "text-yellow-500" },
    { id: "ts", name: "TypeScript", icon: FileCode, color: "text-blue-500" },
    { id: "jsx", name: "React JSX", icon: FileCode, color: "text-cyan-500" },
    { id: "tsx", name: "React TSX", icon: FileCode, color: "text-blue-400" },
    { id: "html", name: "HTML", icon: FileText, color: "text-orange-500" },
    { id: "css", name: "CSS", icon: FileText, color: "text-purple-500" },
    { id: "json", name: "JSON", icon: FileJson, color: "text-yellow-400" },
    { id: "md", name: "Markdown", icon: FileText, color: "text-blue-300" },
    { id: "txt", name: "Text", icon: FileText, color: "text-gray-500" },
  ]

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Initial File</CardTitle>
          <CardDescription>Let's start by creating your first file in the workspace</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                placeholder="main"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>File Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {fileTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <Button
                      key={type.id}
                      type="button"
                      variant={fileType === type.id ? "default" : "outline"}
                      className="flex flex-col items-center justify-center h-20 p-2"
                      onClick={() => setFileType(type.id)}
                    >
                      <Icon className={`h-6 w-6 mb-1 ${type.color}`} />
                      <span className="text-xs">{type.name}</span>
                    </Button>
                  )
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Create File
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

