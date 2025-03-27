import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-opt";
import { connectToDatabase } from "@/lib/monogdb";
import SyncOperation from "@/models/SyncOperation";
import EditorSession from "@/models/EditorSession";

// GET /api/sessions/[id]/sync-operations - Get sync operations for a session
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

    // Check if the user has access to this session
    const editorSession = await EditorSession.findOne({
      roomId: params.id,
      "participants.userId": session.user.id,
    });

    if (!editorSession) {
      return NextResponse.json(
        { error: "Session not found or access denied" },
        { status: 404 }
      );
    }

    // Get sync operations for this session
    const syncOperations = await SyncOperation.find({
      sessionId: params.id,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json(syncOperations);
  } catch (error) {
    console.error("Error fetching sync operations:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync operations" },
      { status: 500 }
    );
  }
}
