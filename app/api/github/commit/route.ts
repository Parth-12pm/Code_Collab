import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-opt"
import { connectToDatabase } from "@/lib/monogdb"
import EditorSession from "@/models/EditorSession"
import SyncOperation from "@/models/SyncOperation"
import { Octokit } from "@octokit/rest"

// POST /api/github/commit - Commit changes to a GitHub repository
export async function POST(req: NextRequest) {
  console.log("GitHub commit API called")

  try {
    const session = await getServerSession(authOptions)
    console.log("Session user:", session?.user?.email)

    if (!session || !session.user || !session.user.githubAccessToken) {
      console.log("GitHub authentication required - no token found")
      return NextResponse.json({ error: "GitHub authentication required" }, { status: 401 })
    }

    const { sessionId, files, commitMessage } = await req.json()
    console.log("Request body:", { sessionId, filesCount: files?.length, commitMessage })

    if (!sessionId) {
      console.log("Session ID is required")
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      console.log("Files are required and must be a non-empty array")
      return NextResponse.json({ error: "Files are required and must be an array" }, { status: 400 })
    }

    if (!commitMessage) {
      console.log("Commit message is required")
      return NextResponse.json({ error: "Commit message is required" }, { status: 400 })
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
      console.log("Only the owner can commit changes")
      return NextResponse.json({ error: "Only the owner can commit changes" }, { status: 403 })
    }

    // Check if a repository exists
    if (!editorSession.repositoryInfo || !editorSession.repositoryInfo.repoId) {
      console.log("No repository exists for this session")
      return NextResponse.json({ error: "No repository exists for this session" }, { status: 400 })
    }

    const { repoOwner, repoName } = editorSession.repositoryInfo
    console.log(`Committing to ${repoOwner}/${repoName} with ${files.length} files`)

    try {
      // Initialize Octokit with the user's GitHub token
      const octokit = new Octokit({
        auth: session.user.githubAccessToken,
      })

      // Get the default branch (main or master)
      let defaultBranch = "main"
      let latestCommitSha

      try {
        // Try to get the main branch
        const { data: mainBranch } = await octokit.repos.getBranch({
          owner: repoOwner,
          repo: repoName,
          branch: "main",
        })
        defaultBranch = "main"
        latestCommitSha = mainBranch.commit.sha
      } catch (mainBranchError) {
        // If main branch doesn't exist, try master
        try {
          const { data: masterBranch } = await octokit.repos.getBranch({
            owner: repoOwner,
            repo: repoName,
            branch: "master",
          })
          defaultBranch = "master"
          latestCommitSha = masterBranch.commit.sha
        } catch (masterBranchError) {
          console.error("Error getting branch information:", masterBranchError)
          throw new Error("Failed to get branch information")
        }
      }

      console.log(`Using ${defaultBranch} branch with commit SHA: ${latestCommitSha}`)

      // Create blobs for each file
      const fileBlobs = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await octokit.git.createBlob({
            owner: repoOwner,
            repo: repoName,
            content: file.content,
            encoding: "utf-8",
          })

          return {
            path: file.path,
            mode: "100644" as const, // Regular file - use literal type
            type: "blob" as const,
            sha: blob.sha,
          }
        }),
      )

      console.log(`Created ${fileBlobs.length} blobs`)

      // Create a new tree
      const { data: tree } = await octokit.git.createTree({
        owner: repoOwner,
        repo: repoName,
        base_tree: latestCommitSha,
        tree: fileBlobs,
      })

      console.log(`Created tree with SHA: ${tree.sha}`)

      // Create a commit
      const { data: commit } = await octokit.git.createCommit({
        owner: repoOwner,
        repo: repoName,
        message: commitMessage,
        tree: tree.sha,
        parents: [latestCommitSha],
      })

      console.log(`Created commit with SHA: ${commit.sha}`)

      // Update the reference
      await octokit.git.updateRef({
        owner: repoOwner,
        repo: repoName,
        ref: `heads/${defaultBranch}`,
        sha: commit.sha,
      })

      console.log(`Updated reference to point to new commit`)

      // Update the last synced timestamp
      editorSession.repositoryInfo.lastSyncedAt = new Date()
      await editorSession.save()
      console.log("Updated last synced timestamp")

      // Create a sync operation record
      const syncOp = await SyncOperation.create({
        sessionId: sessionId,
        userId: session.user.id,
        operation: "commit",
        status: "completed",
        processedAt: new Date(),
        commitMessage: commitMessage,
      })
      console.log("Created sync operation:", syncOp._id)

      return NextResponse.json({
        message: "Changes committed successfully",
        commit: {
          sha: commit.sha,
          url: `https://github.com/${repoOwner}/${repoName}/commit/${commit.sha}`,
        },
      })
    } catch (githubError) {
      console.error("Error during GitHub API call:", githubError)

      // Create a failed sync operation record
      await SyncOperation.create({
        sessionId: sessionId,
        userId: session.user.id,
        operation: "commit",
        status: "failed",
        error: (githubError as Error).message,
        processedAt: new Date(),
        commitMessage: commitMessage,
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
    console.error("Error committing changes:", error)
    return NextResponse.json(
      {
        error: "Failed to commit changes",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

