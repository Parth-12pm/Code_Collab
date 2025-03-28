import { type NextRequest, NextResponse } from "next/server"

const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { language, code, stdin } = body

    if (!language || !code) {
      return NextResponse.json({ error: "Language and code are required" }, { status: 400 })
    }

    // Forward the request to Piston API
    const response = await fetch(PISTON_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language,
        version: "*", // Use the latest version
        files: [
          {
            name: getFileName(language),
            content: code,
          },
        ],
        stdin: stdin || "",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Piston API error: ${response.status} ${errorText}` },
        { status: response.status },
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error executing code:", error)
    return NextResponse.json({ error: `Failed to execute code: ${(error as Error).message}` }, { status: 500 })
  }
}

// Helper function to get the appropriate filename for the language
function getFileName(language: string): string {
  const extensions: Record<string, string> = {
    python: "main.py",
    javascript: "main.js",
    typescript: "main.ts",
    java: "Main.java",
    c: "main.c",
    cpp: "main.cpp",
    csharp: "main.cs",
    go: "main.go",
    ruby: "main.rb",
    rust: "main.rs",
    php: "main.php",
  }

  return extensions[language] || `main.${language}`
}

