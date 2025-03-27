"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionCard } from "./session-card";
import {
  CreateSessionDialog,
  CreateSessionButton,
} from "./create-session-dialog";
import { JoinSessionDialog, JoinSessionButton } from "./join-session-dialog";
import { EmptyState } from "./empty-state";
import { EditorHeader } from "@/components/editor/header";

interface EditorSession {
  _id: string;
  roomId: string;
  name?: string;
  createdBy: string;
  createdAt: string;
  lastActive: string;
  isPrivate: boolean;
  repositoryInfo?: {
    repoUrl: string;
    lastSyncedAt?: string;
  };
  participants: {
    userId: string;
    username: string;
    joinedAt: string;
    role: "owner" | "collaborator";
  }[];
}

export function EditorDashboard() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<EditorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-sessions");

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("/api/sessions");
        if (response.ok) {
          const data = await response.json();
          setSessions(data);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchSessions();
    }
  }, [session]);

  // Delete a session
  const deleteSession = async (roomId: string) => {
    try {
      const response = await fetch(`/api/sessions/${roomId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSessions(sessions.filter((s) => s.roomId !== roomId));
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  // Filter sessions
  const myOwnedSessions = sessions.filter(
    (s) => s.createdBy === session?.user?.id
  );
  const collaborativeSessions = sessions.filter(
    (s) => s.createdBy !== session?.user?.id
  );

  return (
    <div className="container mx-auto p-6">
      <EditorHeader />
      <div className="container mx-auto p-6 flex-1 overflow-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Coding Sessions</h1>
          <div className="flex gap-2">
            <JoinSessionButton onClick={() => setIsJoinDialogOpen(true)} />
            <CreateSessionButton onClick={() => setIsCreateDialogOpen(true)} />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="my-sessions">My Sessions</TabsTrigger>
            <TabsTrigger value="collaborative">Collaborative</TabsTrigger>
          </TabsList>
          <TabsContent value="my-sessions">
            {loading ? (
              <div className="flex justify-center p-8">
                <p>Loading sessions...</p>
              </div>
            ) : myOwnedSessions.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myOwnedSessions.map((session) => (
                  <SessionCard
                    key={session.roomId}
                    session={session}
                    isOwner={true}
                    onDelete={deleteSession}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                type="my-sessions"
                onCreateClick={() => setIsCreateDialogOpen(true)}
              />
            )}
          </TabsContent>
          <TabsContent value="collaborative">
            {loading ? (
              <div className="flex justify-center p-8">
                <p>Loading sessions...</p>
              </div>
            ) : collaborativeSessions.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {collaborativeSessions.map((session) => (
                  <SessionCard
                    key={session.roomId}
                    session={session}
                    isOwner={false}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                type="collaborative"
                onJoinClick={() => setIsJoinDialogOpen(true)}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <CreateSessionDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
        <JoinSessionDialog
          open={isJoinDialogOpen}
          onOpenChange={setIsJoinDialogOpen}
        />
      </div>
    </div>
  );
}
