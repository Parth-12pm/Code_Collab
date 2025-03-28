import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-opt"
import { connectToDatabase } from "@/lib/monogdb"
import EditorSession from "@/models/EditorSession"
import SyncOperation from "@/models/SyncOperation"

// POST /api/github/create-repo - Create a GitHub repository for a session
export async function POST(req: NextRequest) {
  console.log("GitHub repository creation API called")

  try {
    const session = await getServerSession(authOptions)
    console.log("Session user:", session?.user?.email)

    if (!session || !session.user || !session.user.githubAccessToken) {
      console.log("GitHub authentication required - no token found")
      return NextResponse.json({ error: "GitHub authentication required" }, { status: 401 })
    }

    // Debug token scopes
    try {
      const scopeResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${session.user.githubAccessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CodeCollab-App",
        },
      })
      const scopes = scopeResponse.headers.get("X-OAuth-Scopes")
      console.log("GitHub token scopes:", scopes)

      // Check if repo scope is present
      if (!scopes || !scopes.includes("repo")) {
        console.log("Missing repo scope in token")
        return NextResponse.json(
          {
            error: "GitHub token is missing required permissions",
            details: "The 'repo' scope is required to create repositories. Please sign out and sign in again.",
          },
          { status: 403 },
        )
      }
    } catch (scopeError) {
      console.error("Error checking token scopes:", scopeError)
    }

    const body = await req.json()
    const { sessionId } = body
    console.log("Request body:", { sessionId })

    if (!sessionId) {
      console.log("Session ID is required")
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    await connectToDatabase()
    console.log("Connected to database")

    // Find the editor session
    const editorSession = await EditorSession.findOne({ roomId: sessionId })
    console.log("Editor session found:", !!editorSession)

    if (!editorSession) {
      console.log("Session not found")
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Check if the user is the owner
    const isOwner = editorSession.createdBy === session.user.id
    console.log("User is owner:", isOwner)

    if (!isOwner) {
      console.log("Only the owner can create a repository")
      return NextResponse.json({ error: "Only the owner can create a repository" }, { status: 403 })
    }

    // Check if a repository already exists
    if (editorSession.repositoryInfo && editorSession.repositoryInfo.repoId) {
      console.log("Repository already exists:", editorSession.repositoryInfo)
      return NextResponse.json(
        {
          message: "Repository already exists for this session",
          repository: editorSession.repositoryInfo,
        },
        { status: 200 },
      )
    }

    // Create a repository on GitHub using direct fetch
    const repoName = `codecollab-${sessionId}`
    const repoDescription = `CodeCollab session: ${editorSession.name || sessionId}`

    console.log("Creating GitHub repository:", { repoName, repoDescription })
    console.log("Using GitHub token:", session.user.githubAccessToken ? "Token exists (hidden)" : "No token")

    try {
      // Use the exact format shown in the GitHub documentation
      const response = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.user.githubAccessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "CodeCollab-App",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: repoName,
          description: repoDescription,
          private: true,
          auto_init: true,
        }),
      })

      // Log the full response for debugging
      const responseText = await response.text()
      console.log("GitHub API response status:", response.status)
      console.log("GitHub API response:", responseText)

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} - ${responseText}`)
      }

      const repo = JSON.parse(responseText)
      console.log("Repository created successfully:", repo.html_url)

      // Update the editor session with repository info
      editorSession.repositoryInfo = {
        repoId: repo.id.toString(),
        repoName: repo.name,
        repoOwner: repo.owner.login,
        repoUrl: repo.html_url,
        isPrivate: repo.private,
        lastSyncedAt: new Date(),
      }

      await editorSession.save()
      console.log("Editor session updated with repository info")

      // Create a sync operation record
      const syncOp = await SyncOperation.create({
        sessionId: sessionId,
        userId: session.user.id,
        operation: "create_repo",
        status: "completed",
        processedAt: new Date(),
      })
      console.log("Sync operation created:", syncOp._id)

      return NextResponse.json({
        message: "GitHub repository created successfully",
        repository: editorSession.repositoryInfo,
      })
    } catch (githubError) {
      console.error("Error during GitHub API call:", githubError)

      // Create a failed sync operation record
      await SyncOperation.create({
        sessionId: sessionId,
        userId: session.user.id,
        operation: "create_repo",
        status: "failed",
        error: (githubError as Error).message,
        processedAt: new Date(),
      })

      return NextResponse.json(
        {
          error: "Error during GitHub API call",
          details: (githubError as Error).message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error creating GitHub repository:", error)
    return NextResponse.json(
      {
        error: "Failed to create GitHub repository",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

