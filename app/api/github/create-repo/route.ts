import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-opt"
import { connectToDatabase } from "@/lib/monogdb"
import EditorSession from "@/models/EditorSession"
import SyncOperation from "@/models/SyncOperation"

// POST /api/github/create-repo - Create a GitHub repository for a session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.githubAccessToken) {
      return NextResponse.json({ error: "GitHub authentication required" }, { status: 401 })
    }

    const { sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find the editor session
    const editorSession = await EditorSession.findOne({ roomId: sessionId })

    if (!editorSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Check if the user is the owner
    if (editorSession.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Only the owner can create a repository" }, { status: 403 })
    }

    // Check if a repository already exists
    if (editorSession.repositoryInfo && editorSession.repositoryInfo.repoId) {
      return NextResponse.json({ error: "Repository already exists for this session" }, { status: 400 })
    }

    // Create a repository on GitHub
    const repoName = `codecollab-${sessionId}`
    const repoDescription = `CodeCollab session: ${editorSession.name || sessionId}`

    const response = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `token ${session.user.githubAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: repoName,
        description: repoDescription,
        private: true,
        auto_init: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("GitHub API error:", error)
      return NextResponse.json({ error: "Failed to create GitHub repository" }, { status: response.status })
    }

    const repo = await response.json()

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

    // Create a sync operation record
    await SyncOperation.create({
      sessionId: sessionId,
      userId: session.user.id,
      operation: "create_repo",
      status: "completed",
      processedAt: new Date(),
    })

    return NextResponse.json({
      message: "GitHub repository created successfully",
      repository: editorSession.repositoryInfo,
    })
  } catch (error) {
    console.error("Error creating GitHub repository:", error)
    return NextResponse.json({ error: "Failed to create GitHub repository" }, { status: 500 })
  }
}

