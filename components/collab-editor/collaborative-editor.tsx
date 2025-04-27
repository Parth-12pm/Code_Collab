"use client";

import { useEffect, useState } from "react";
import { RoomProvider } from "@/liveblocks.config";
import Editor from "@/components/collab-editor/editor";
import Toolbar from "@/components/collab-editor/toolbar";
import Sidebar from "@/components/collab-editor/sidebar";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LiveObject, LiveList, LiveMap } from "@liveblocks/client";
import ChatPanel from "@/components/collab-editor/chat-panel";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { CodeExecution } from "@/components/collab-editor/code-execution";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { Storage } from "@/liveblocks.config";

interface CollaborativeEditorProps {
  sessionId: string;
  sessionName?: string;
  isPrivate?: boolean;
}

export default function CollaborativeEditor({
  sessionId,
  sessionName = `Session-${sessionId}`,
  isPrivate = false,
}: CollaborativeEditorProps) {
  const router = useRouter();
  const { data: authSession, status: authStatus } = useSession();
  const { toast } = useToast();
  const [editorSession, setEditorSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [showTerminal, setShowTerminal] = useState(false);


  // Fetch session data
  useEffect(() => {
    const fetchSessionData = async () => {
      if (authStatus !== "authenticated" || !sessionId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/sessions/${sessionId}`);

        if (!response.ok) {
          if (response.status === 404) {
            toast({
              title: "Session not found",
              description: "The requested session does not exist.",
              variant: "destructive",
            });
            router.push("/editor");
            return;
          }

          const error = await response.json();
          throw new Error(error.error || "Failed to load session");
        }

        const data = await response.json();
        setEditorSession(data);

        // Check if this is a new session with no files
        const filesResponse = await fetch(`/api/sessions/${sessionId}/files`);
        const filesData = await filesResponse.json();

        if (filesData.files?.length === 0) {
          // Create a default file automatically
          const defaultFileName = "main.js";
          await fetch(`/api/sessions/${sessionId}/files`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              path: defaultFileName,
              content: `// ${defaultFileName}
// Created: ${new Date().toLocaleString()}

// Welcome to CodeCollab!
// Start coding here...
`,
            }),
          });
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        toast({
          title: "Error",
          description:
            (error as Error).message ||
            "An error occurred while loading the session",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (authStatus === "authenticated") {
      fetchSessionData();
    }
  }, [sessionId, authStatus, router, toast]);

  // Toggle terminal
  const toggleTerminal = () => {
    setShowTerminal(!showTerminal);
  };

  // Show loading state while fetching session data
  if (loading || authStatus === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  // If session is not found or user is not authenticated, don't render the editor
  if ((!editorSession && !sessionId) || authStatus !== "authenticated") {
    return null;
  }

  // Get user info from the session
  const username =
    authSession?.user?.name || authSession?.user?.email || "Anonymous";

  // Check if user is the owner
  const isOwner = editorSession?.createdBy === authSession?.user?.id;

  // Define the initial storage with proper typing
  const initialStorage: Storage = {
    document: new LiveObject({ content: "" }),
    messages: new LiveList([]),
    files: new LiveMap(),
    timeline: new LiveList([]),
    roomSettings: new LiveObject({
      isPrivate,
      password: "",
      createdBy: username,
      createdAt: new Date().toISOString(),
    }),
    executionResults: new LiveMap(),
  };

  return (
    <div className={theme}>
      <RoomProvider
        id={sessionId}
        initialPresence={{
          cursor: null,
          selection: null,
          username,
          currentFile: null,
        }}
        initialStorage={initialStorage}
      >
        <div className="flex h-screen flex-col bg-background text-foreground">
          <Toolbar
            roomId={sessionId}
            username={username}
            isPrivate={isPrivate}
            theme={theme}
            setTheme={setTheme}
            isOwner={isOwner}
            sessionName={sessionName}
            onBackToDashboard={() => router.push("/editor")}
            onToggleTerminal={toggleTerminal}
          />
          <div className="flex flex-1 overflow-hidden">
            <ResizablePanelGroup direction="horizontal" className="flex-1">
              <ResizablePanel defaultSize={20} minSize={15}>
                <div className="h-full overflow-hidden">
                  <Sidebar sessionId={sessionId} />
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={45} minSize={25}>
                <div className="h-full overflow-hidden">
                  <Editor theme={theme} />
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={35} minSize={25}>
                <div className="h-full overflow-hidden">
                  <CodeExecution />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
            <ChatPanel />
          </div>
        </div>
        <Toaster />
      </RoomProvider>
    </div>
  );
}
