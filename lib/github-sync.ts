// Updated to use Octokit for direct API calls
import SyncOperation from "@/models/SyncOperation"
import { Octokit } from "@octokit/rest"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-opt"
import EditorSession from "@/models/EditorSession"

export async function queueGitHubOperation({
  sessionId,
  userId,
  operation,
  data = {},
  priority = 1,
}: {
  sessionId: string
  userId: string
  operation: string
  data?: any
  priority?: number
}) {
  console.log("Queueing GitHub operation:", { sessionId, operation, priority })

  try {
    // Create a sync operation record
    const syncOp = await SyncOperation.create({
      sessionId,
      userId,
      operation,
      data,
      priority,
      status: "pending",
      createdAt: new Date(),
    })

    console.log("Created sync operation:", syncOp._id)

    // For create_repo operations, directly process it
    if (operation === "create_repo") {
      console.log("Directly creating GitHub repository for session:", sessionId)

      try {
        // Get the session to get the user's GitHub token
        const session = await getServerSession(authOptions)

        if (!session?.user?.githubAccessToken) {
          throw new Error("GitHub token not found")
        }

        // Find the editor session
        const editorSession = await EditorSession.findOne({ roomId: sessionId })

        if (!editorSession) {
          throw new Error("Session not found")
        }

        // Check if a repository already exists
        if (editorSession.repositoryInfo && editorSession.repositoryInfo.repoId) {
          console.log("Repository already exists:", editorSession.repositoryInfo)

          // Update the sync operation status
          syncOp.status = "completed"
          syncOp.processedAt = new Date()
          await syncOp.save()

          return syncOp
        }

        // Create a repository on GitHub using Octokit
        const repoName = `codecollab-${sessionId}`
        const repoDescription = `CodeCollab session: ${editorSession.name || sessionId}`

        // Initialize Octokit with the user's GitHub token
        const octokit = new Octokit({
          auth: session.user.githubAccessToken,
        })

        // Create the repository
        const { data: repo } = await octokit.repos.createForAuthenticatedUser({
          name: repoName,
          description: repoDescription,
          private: true,
          auto_init: true,
        })

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

        // Update the sync operation status
        syncOp.status = "completed"
        syncOp.processedAt = new Date()
        await syncOp.save()

        console.log("Updated sync operation status to completed")
      } catch (error) {
        console.error("Exception during direct GitHub repository creation:", error)

        // Update the sync operation status
        syncOp.status = "failed"
        syncOp.error = (error as Error).message
        await syncOp.save()

        console.log("Updated sync operation status to failed due to exception")
      }
    }

    return syncOp
  } catch (error) {
    console.error("Error queueing GitHub operation:", error)
    throw error
  }
}

