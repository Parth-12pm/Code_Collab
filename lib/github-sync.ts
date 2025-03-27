import SyncQueue from "@/models/SyncQueue";
import SyncOperation from "@/models/SyncOperation";
import EditorSession from "@/models/EditorSession";
import { connectToDatabase } from "@/lib/monogdb";

/**
 * Add a GitHub sync operation to the queue
 */
export async function queueGitHubOperation({
  sessionId,
  userId,
  operation,
  data,
  priority = 0,
}: {
  sessionId: string;
  userId: string;
  operation: "create_repo" | "commit" | "sync";
  data: {
    files?: Array<{
      path: string;
      content: string;
      action: "create" | "update" | "delete";
    }>;
    commitMessage?: string;
    branch?: string;
  };
  priority?: number;
}) {
  await connectToDatabase();

  // Create a new queue item
  const queueItem = await SyncQueue.create({
    sessionId,
    userId,
    operation,
    status: "queued",
    priority,
    data,
    retryCount: 0,
    maxRetries: 3,
  });

  // Create a sync operation record
  await SyncOperation.create({
    sessionId,
    userId,
    operation,
    status: "pending",
    files: data.files,
    commitMessage: data.commitMessage,
  });

  return queueItem;
}

/**
 * Process the next item in the GitHub sync queue
 * This would typically be called by a background worker or cron job
 */
export async function processNextQueueItem(accessToken: string) {
  await connectToDatabase();

  // Find the next item to process (highest priority, oldest first)
  const queueItem = await SyncQueue.findOneAndUpdate(
    { status: "queued", retryCount: { $lt: "$maxRetries" } },
    { $set: { status: "processing" } },
    { sort: { priority: -1, createdAt: 1 }, new: true }
  );

  if (!queueItem) {
    return null; // No items to process
  }

  try {
    // Find the editor session
    const session = await EditorSession.findOne({
      roomId: queueItem.sessionId,
    });
    if (!session) {
      throw new Error("Session not found");
    }

    // Update the sync operation status
    await SyncOperation.findOneAndUpdate(
      {
        sessionId: queueItem.sessionId,
        userId: queueItem.userId,
        operation: queueItem.operation,
        status: "pending",
      },
      { $set: { status: "processing" } }
    );

    // Process based on operation type
    if (queueItem.operation === "create_repo") {
      // Implementation for creating a repository
      if (!session.repositoryInfo || !session.repositoryInfo.repoId) {
        const repoName = `codecollab-${queueItem.sessionId}`;
        const repoDescription = `CodeCollab session: ${
          session.name || queueItem.sessionId
        }`;

        const response = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers: {
            Authorization: `token ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: repoName,
            description: repoDescription,
            private: true,
            auto_init: true,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`GitHub API error: ${JSON.stringify(error)}`);
        }

        const repo = await response.json();

        // Update the editor session with repository info
        session.repositoryInfo = {
          repoId: repo.id.toString(),
          repoName: repo.name,
          repoOwner: repo.owner.login,
          repoUrl: repo.html_url,
          isPrivate: repo.private,
          lastSyncedAt: new Date(),
        };

        await session.save();
      }
    } else if (queueItem.operation === "commit") {
      // Implementation for committing changes
      if (!session.repositoryInfo || !session.repositoryInfo.repoId) {
        throw new Error("No repository exists for this session");
      }

      const { repoOwner, repoName } = session.repositoryInfo;
      const { files, commitMessage, branch = "main" } = queueItem.data;

      if (!files || files.length === 0) {
        throw new Error("No files to commit");
      }

      // Get the latest commit SHA
      const branchResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/branches/${branch}`,
        {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        }
      );

      if (!branchResponse.ok) {
        const error = await branchResponse.json();
        throw new Error(`GitHub API error: ${JSON.stringify(error)}`);
      }

      const branchData = await branchResponse.json();
      const latestCommitSha = branchData.commit.sha;

      // Create a new tree with the files
      const treeItems = await Promise.all(
        files.map(async (file) => {
          if (file.action === "delete") {
            return {
              path: file.path,
              mode: "100644",
              type: "blob",
              sha: null, // null SHA means delete the file
            };
          }

          // For create or update, create a blob with the content
          const blobResponse = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/git/blobs`,
            {
              method: "POST",
              headers: {
                Authorization: `token ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                content: file.content,
                encoding: "utf-8",
              }),
            }
          );

          if (!blobResponse.ok) {
            throw new Error(`Failed to create blob for ${file.path}`);
          }

          const blob = await blobResponse.json();

          return {
            path: file.path,
            mode: "100644",
            type: "blob",
            sha: blob.sha,
          };
        })
      );

      // Create a new tree
      const treeResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base_tree: latestCommitSha,
            tree: treeItems,
          }),
        }
      );

      if (!treeResponse.ok) {
        const error = await treeResponse.json();
        throw new Error(`GitHub API error: ${JSON.stringify(error)}`);
      }

      const treeData = await treeResponse.json();

      // Create a commit
      const commitResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/git/commits`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: commitMessage || "Update from CodeCollab",
            tree: treeData.sha,
            parents: [latestCommitSha],
          }),
        }
      );

      if (!commitResponse.ok) {
        const error = await commitResponse.json();
        throw new Error(`GitHub API error: ${JSON.stringify(error)}`);
      }

      const commitData = await commitResponse.json();

      // Update the reference
      const refResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs/heads/${branch}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `token ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sha: commitData.sha,
            force: false,
          }),
        }
      );

      if (!refResponse.ok) {
        const error = await refResponse.json();
        throw new Error(`GitHub API error: ${JSON.stringify(error)}`);
      }

      // Update the last synced timestamp
      session.repositoryInfo.lastSyncedAt = new Date();
      await session.save();
    }

    // Mark as completed
    queueItem.status = "completed";
    queueItem.processedAt = new Date();
    await queueItem.save();

    // Update the sync operation status
    await SyncOperation.findOneAndUpdate(
      {
        sessionId: queueItem.sessionId,
        userId: queueItem.userId,
        operation: queueItem.operation,
        status: "processing",
      },
      {
        $set: {
          status: "completed",
          processedAt: new Date(),
        },
      }
    );

    return queueItem;
  } catch (Error) {
    // Handle error
    queueItem.status = "failed";
    queueItem.error = Error.message;
    queueItem.retryCount += 1;

    // If we haven't exceeded max retries, set back to queued for retry
    if (queueItem.retryCount < queueItem.maxRetries) {
      queueItem.status = "queued";
    }

    await queueItem.save();

    // Update the sync operation status
    await SyncOperation.findOneAndUpdate(
      {
        sessionId: queueItem.sessionId,
        userId: queueItem.userId,
        operation: queueItem.operation,
        status: "processing",
      },
      {
        $set: {
          status:
            queueItem.retryCount < queueItem.maxRetries ? "pending" : "failed",
          error: Error.message,
        },
      }
    );

    throw Error;
  }
}
