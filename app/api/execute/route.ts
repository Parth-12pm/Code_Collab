import { type NextRequest, NextResponse } from "next/server"

const WANDBOX_API_URL = "https://wandbox.org/api/compile.json"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { language, code, stdin } = body

    if (!language || !code) {
      return NextResponse.json({ error: "Language and code are required" }, { status: 400 })
    }

    const compiler = getWandboxCompiler(language)
    if (!compiler) {
      return NextResponse.json({ error: `Language ${language} is not supported` }, { status: 400 })
    }

    // Forward the request to Wandbox API
    const response = await fetch(WANDBOX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        compiler,
        code,
        stdin: stdin || "",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Code execution API error: ${response.status} ${errorText}` },
        { status: response.status },
      )
    }

    const result = await response.json()
    
    // Format response to match the Piston API format expected by the frontend
    const formattedResult = {
      language,
      version: compiler,
      run: {
        stdout: result.program_output || result.compiler_output || "",
        stderr: result.program_error || result.compiler_error || "",
        output: result.program_message || result.compiler_message || "",
        code: parseInt(result.status || "0", 10),
        time: 0,
        memory: 0
      }
    }

    return NextResponse.json(formattedResult)
  } catch (error) {
    console.error("Error executing code:", error)
    return NextResponse.json({ error: `Failed to execute code: ${(error as Error).message}` }, { status: 500 })
  }
}

// Helper function to get the appropriate Wandbox compiler for the language
function getWandboxCompiler(language: string): string | null {
  const compilers: Record<string, string> = {
    python: "cpython-3.12.7",
    javascript: "nodejs-20.17.0",
    typescript: "typescript-5.6.2",
    java: "openjdk-jdk-22+36",
    c: "gcc-13.2.0-c",
    cpp: "gcc-13.2.0",
    csharp: "dotnetcore-8.0.402",
    go: "go-1.23.2",
    ruby: "ruby-3.4.1",
    rust: "rust-1.82.0",
    php: "php-8.3.12",
  }

  return compilers[language] || null
}

