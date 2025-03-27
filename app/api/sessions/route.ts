import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-opt";
import { connectToDatabase } from "@/lib/monogdb";
import EditorSession from "@/models/EditorSession";
import { nanoid } from "nanoid";
import { queueGitHubOperation } from "@/lib/github-sync";

// GET /api/sessions - Get all sessions for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Find all sessions where the user is a participant
    const editorSessions = await EditorSession.find({
      "participants.userId": session.user.id,
    }).sort({ lastActive: -1 });

    return NextResponse.json(editorSessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create a new session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, isPrivate, password, initGitHub } = await req.json();

    await connectToDatabase();

    // Generate a unique room ID
    const roomId = nanoid(10);

    // Create a new editor session
    const editorSession = await EditorSession.create({
      roomId,
      name: name || `Session-${roomId}`,
      createdBy: session.user.id,
      isPrivate: isPrivate || false,
      password: isPrivate ? password : undefined,
      participants: [
        {
          userId: session.user.id,
          username: session.user.name || session.user.email || "Anonymous",
          role: "owner",
        },
      ],
    });

    // If GitHub initialization is requested and user has GitHub token
    if (initGitHub && session.user.githubAccessToken) {
      try {
        // Queue GitHub repository creation
        await queueGitHubOperation({
          sessionId: roomId,
          userId: session.user.id,
          operation: "create_repo",
          data: {},
          priority: 1, // High priority
        });
      } catch (gitError) {
        console.error("Error queueing GitHub repository creation:", gitError);
        // We don't want to fail the session creation if GitHub init fails
      }
    }

    return NextResponse.json(editorSession, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
