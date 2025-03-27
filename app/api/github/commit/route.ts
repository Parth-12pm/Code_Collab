import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-opt"
import { connectToDatabase } from "@/lib/monogdb"
import EditorSession from "@/models/EditorSession"
import SyncOperation from "@/models/SyncOperation"

// POST /api/github/commit - Commit changes to a GitHub repository
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.githubAccessToken) {
      return NextResponse.json({ error: "GitHub authentication required" }, { status: 401 })
    }

    const { sessionId, files, commitMessage } = await req.json()

    if (!sessionId || !files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "Session ID and files are required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find the editor session
    const editorSession = await EditorSession.findOne({ roomId: sessionId })

    if (!editorSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Check if the user is the owner
    if (editorSession.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Only the owner can commit changes" }, { status: 403 })
    }

    // Check if a repository exists
    if (!editorSession.repositoryInfo || !editorSession.repositoryInfo.repoId) {
      return NextResponse.json({ error: "No repository exists for this session" }, { status: 400 })
    }

    const { repoOwner, repoName } = editorSession.repositoryInfo

    // Get the latest commit SHA
    const branchResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/branches/main`, {
      headers: {
        Authorization: `token ${session.user.githubAccessToken}`,
      },
    })

    if (!branchResponse.ok) {
      const error = await branchResponse.json()
      console.error("GitHub API error:", error)
      return NextResponse.json({ error: "Failed to get branch information" }, { status: branchResponse.status })
    }

    const branchData = await branchResponse.json()
    const latestCommitSha = branchData.commit.sha

    // Create a new tree with the files
    const treeItems = await Promise.all(
      files.map(async (file) => {
        if (file.action === "delete") {
          return {
            path: file.path,
            mode: "100644",
            type: "blob",
            sha: null, // null SHA means delete the file
          }
        }

        // For create or update, create a blob with the content
        const blobResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/blobs`, {
          method: "POST",
          headers: {
            Authorization: `token ${session.user.githubAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: file.content,
            encoding: "utf-8",
          }),
        })

        if (!blobResponse.ok) {
          throw new Error(`Failed to create blob for ${file.path}`)
        }

        const blob = await blobResponse.json()

        return {
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        }
      }),
    )

    // Create a new tree
    const treeResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees`, {
      method: "POST",
      headers: {
        Authorization: `token ${session.user.githubAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base_tree: latestCommitSha,
        tree: treeItems,
      }),
    })

    if (!treeResponse.ok) {
      const error = await treeResponse.json()
      console.error("GitHub API error:", error)
      return NextResponse.json({ error: "Failed to create tree" }, { status: treeResponse.status })
    }

    const treeData = await treeResponse.json()

    // Create a commit
    const commitResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/commits`, {
      method: "POST",
      headers: {
        Authorization: `token ${session.user.githubAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: commitMessage || "Update from CodeCollab",
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    })

    if (!commitResponse.ok) {
      const error = await commitResponse.json()
      console.error("GitHub API error:", error)
      return NextResponse.json({ error: "Failed to create commit" }, { status: commitResponse.status })
    }

    const commitData = await commitResponse.json()

    // Update the reference
    const refResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/refs/heads/main`, {
      method: "PATCH",
      headers: {
        Authorization: `token ${session.user.githubAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sha: commitData.sha,
        force: false,
      }),
    })

    if (!refResponse.ok) {
      const error = await refResponse.json()
      console.error("GitHub API error:", error)
      return NextResponse.json({ error: "Failed to update reference" }, { status: refResponse.status })
    }

    // Update the last synced timestamp
    editorSession.repositoryInfo.lastSyncedAt = new Date()
    await editorSession.save()

    // Create a sync operation record
    await SyncOperation.create({
      sessionId: sessionId,
      userId: session.user.id,
      operation: "commit",
      status: "completed",
      processedAt: new Date(),
      files: files,
      commitMessage: commitMessage || "Update from CodeCollab",
    })

    return NextResponse.json({
      message: "Changes committed successfully",
      commit: commitData,
    })
  } catch (error) {
    console.error("Error committing changes:", error)
    return NextResponse.json({ error: "Failed to commit changes" }, { status: 500 })
  }
}

