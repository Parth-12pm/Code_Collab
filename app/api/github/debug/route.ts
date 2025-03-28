import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-opt"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.githubAccessToken) {
      return NextResponse.json({ error: "No GitHub token found" }, { status: 401 })
    }

    // Check token scopes
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${session.user.githubAccessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CodeCollab-App",
      },
    })

    const scopes = userResponse.headers.get("X-OAuth-Scopes")
    const userData = await userResponse.json()

    // Try to list repositories (doesn't create anything)
    const reposResponse = await fetch("https://api.github.com/user/repos?per_page=1", {
      headers: {
        Authorization: `Bearer ${session.user.githubAccessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CodeCollab-App",
      },
    })

    const reposStatus = reposResponse.status
    let reposData = null
    try {
      reposData = await reposResponse.json()
    } catch (e) {
      reposData = { error: "Failed to parse repos response" }
    }

    // Try a direct repository creation with fetch (not Octokit)
    const testRepoName = `test-repo-${Date.now()}`
    const createResponse = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.user.githubAccessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "CodeCollab-App",
      },
      body: JSON.stringify({
        name: testRepoName,
        description: "Test repository for debugging",
        private: true,
        auto_init: true,
      }),
    })

    const createStatus = createResponse.status
    let createData = null
    try {
      createData = await createResponse.json()
    } catch (e) {
      createData = { error: "Failed to parse create response" }
    }

    return NextResponse.json({
      token: {
        scopes,
        firstChars: session.user.githubAccessToken.substring(0, 5) + "...",
      },
      user: userData,
      repos: {
        status: reposStatus,
        data: reposData,
      },
      createRepo: {
        status: createStatus,
        data: createData,
      },
    })
  } catch (error) {
    console.error("Error debugging GitHub token:", error)
    return NextResponse.json(
      {
        error: "Failed to debug token",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

