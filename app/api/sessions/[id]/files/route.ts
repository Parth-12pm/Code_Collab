import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-opt";
import { connectToDatabase } from "@/lib/monogdb";
import EditorSession from "@/models/EditorSession";

// GET /api/sessions/[id]/files - Get files for a session
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

    // Return files (if any)
    return NextResponse.json({
      files: editorSession.files || [],
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

// POST /api/sessions/[id]/files - Create or update a file
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path, content } = await req.json();

    if (!path) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
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

    // Initialize files array if it doesn't exist
    if (!editorSession.files) {
      editorSession.files = [];
    }

    // Check if file already exists
    const fileIndex = editorSession.files.findIndex((f) => f.path === path);

    if (fileIndex >= 0) {
      // Update existing file
      editorSession.files[fileIndex].content = content;
      editorSession.files[fileIndex].lastModified = new Date();
    } else {
      // Add new file
      editorSession.files.push({
        path,
        content,
        lastModified: new Date(),
      });
    }

    await editorSession.save();

    // If this session has a GitHub repository, queue a sync operation
    if (
      editorSession.repositoryInfo?.repoId &&
      session.user.githubAccessToken
    ) {
      try {
        // We don't want to sync on every file change, so we'll just update the file in the database
        // The user can manually commit changes when they're ready
      } catch (gitError) {
        console.error("Error queueing GitHub sync:", gitError);
        // We don't want to fail the file save if GitHub sync fails
      }
    }

    return NextResponse.json({
      message: "File saved successfully",
      file: {
        path,
        content,
        lastModified: new Date(),
      },
    });
  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
  }
}

// DELETE /api/sessions/[id]/files - Delete a file
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path } = await req.json();

    if (!path) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
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

    // Remove the file
    if (editorSession.files) {
      editorSession.files = editorSession.files.filter((f) => f.path !== path);
      await editorSession.save();
    }

    return NextResponse.json({
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
