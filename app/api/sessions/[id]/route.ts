import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-opt";
import { connectToDatabase } from "@/lib/monogdb";
import EditorSession from "@/models/EditorSession";

// GET /api/sessions/[id] - Get a specific session
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Don't use await with params.id - it's already a string
    const editorSession = await EditorSession.findOne({ roomId: params.id });

    if (!editorSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Update lastActive timestamp
    editorSession.lastActive = new Date();
    await editorSession.save();

    // Check if user is already a participant
    const isParticipant = editorSession.participants.some(
      (p) => p.userId === session.user.id
    );

    // If not a participant, add them (unless it's a private room with password)
    if (!isParticipant) {
      if (editorSession.isPrivate) {
        // For private rooms, don't add the user yet - they'll need to provide the password
        // Just return the session with isPrivate flag
        return NextResponse.json({
          ...editorSession.toObject(),
          requiresPassword: true,
        });
      }

      // For public rooms, add the user as a participant
      editorSession.participants.push({
        userId: session.user.id,
        username: session.user.name || session.user.email || "Anonymous",
        role: "collaborator",
      });

      await editorSession.save();
    }

    return NextResponse.json(editorSession);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

// POST /api/sessions/[id] - Join a private session with password
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await req.json();

    await connectToDatabase();

    const editorSession = await EditorSession.findOne({ roomId: params.id });

    if (!editorSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if the session is private and requires a password
    if (editorSession.isPrivate && editorSession.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 403 });
    }

    // Check if user is already a participant
    const isParticipant = editorSession.participants.some(
      (p) => p.userId === session.user.id
    );

    // If not a participant, add them
    if (!isParticipant) {
      editorSession.participants.push({
        userId: session.user.id,
        username: session.user.name || session.user.email || "Anonymous",
        role: "collaborator",
      });

      // Update lastActive timestamp
      editorSession.lastActive = new Date();
      await editorSession.save();
    }

    return NextResponse.json(editorSession);
  } catch (error) {
    console.error("Error joining session:", error);
    return NextResponse.json(
      { error: "Failed to join session" },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id] - Delete a session
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Don't use await with params.id - it's already a string
    const editorSession = await EditorSession.findOne({ roomId: params.id });

    if (!editorSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if the user is the owner
    if (editorSession.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: "Only the owner can delete a session" },
        { status: 403 }
      );
    }

    await EditorSession.deleteOne({ roomId: params.id });

    return NextResponse.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
