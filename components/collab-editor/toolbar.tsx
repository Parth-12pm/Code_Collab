"use client";
import {
  useOthers,
  useStorage,
  useSelf,
  useBroadcastEvent,
  useEventListener,
} from "@/liveblocks.config";
import {
  Copy,
  Download,
  Settings,
  Users,
  Lock,
  Unlock,
  Moon,
  Sun,
  ArrowLeft,
  Share2,
  Github,
  Video,
  VideoOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import JSZip from "jszip";
import FileSaver from "file-saver";
import { useEffect, useState } from "react";
import GitHubIntegration from "./github-integration";
import { useToast } from "@/components/ui/use-toast";
import VideoCall from "@/components/collab-editor/video-call";

interface ToolbarProps {
  roomId: string;
  username: string;
  isPrivate: boolean;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  isOwner: boolean;
  sessionName: string;
  onBackToDashboard: () => void;
}

// Event types for video call
const VIDEO_CALL_START = "VIDEO_CALL_START";
const VIDEO_CALL_END = "VIDEO_CALL_END";

export default function Toolbar({
  roomId,
  username,
  isPrivate,
  theme,
  setTheme,
  isOwner,
  sessionName,
  onBackToDashboard,
}: ToolbarProps) {
  const others = useOthers();
  const files = useStorage((root) => root.files);
  const self = useSelf();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);
  const [repoInfo, setRepoInfo] = useState<{
    repoUrl?: string;
    lastSyncedAt?: string;
  } | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);

  // Broadcast events to other users
  const broadcast = useBroadcastEvent();

  // Listen for video call events from other users
  useEventListener(({ event }) => {
    if (!event || typeof event !== "object" || !("type" in event)) return;
    if (event.type === VIDEO_CALL_START) {
      setShowVideoCall(true);
    } else if (event.type === VIDEO_CALL_END) {
      setShowVideoCall(false);
    }
  });

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Fetch repository info if user is owner
  useEffect(() => {
    if (isOwner && roomId) {
      const fetchRepoInfo = async () => {
        try {
          const response = await fetch(`/api/sessions/${roomId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.repositoryInfo) {
              setRepoInfo(data.repositoryInfo);
            }
          }
        } catch (error) {
          console.error("Error fetching repository info:", error);
        }
      };

      fetchRepoInfo();
    }
  }, [isOwner, roomId]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  const copyRoomLink = () => {
    const url = `${window.location.origin}/editor/${roomId}`;
    navigator.clipboard.writeText(url);

    toast({
      title: "Link copied",
      description: "Session link has been copied to clipboard",
    });
  };

  // Toggle video call and broadcast to other users
  const toggleVideoCall = () => {
    const newState = !showVideoCall;
    setShowVideoCall(newState);

    // Broadcast event to other users
    broadcast({
      type: newState ? VIDEO_CALL_START : VIDEO_CALL_END,
    });

    if (newState) {
      toast({
        title: "Video Call Started",
        description: "Others in this session can join your video call",
      });
    }
  };

  // Handle closing the video call
  const handleCloseVideoCall = () => {
    setShowVideoCall(false);

    // Broadcast event to other users
    broadcast({
      type: VIDEO_CALL_END,
    });
  };

  // Download workspace as zip
  const downloadWorkspace = async () => {
    if (!files || files.size === 0) return;

    const zip = new JSZip();

    files.forEach((file, id) => {
      // Skip folder placeholder files
      if (!id.endsWith("/.folder")) {
        zip.file(id, file.content);
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    FileSaver.saveAs(content, "workspace.zip");
  };

  return (
    <div className="flex flex-col border-b border-border bg-card">
      {/* Main toolbar */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackToDashboard}
            className="h-8 w-8 md:mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only md:not-sr-only md:ml-2">Back</span>
          </Button>

          <h1 className="text-xl font-bold hidden md:block">CodeCollab</h1>
        </div>

        <div className="flex-1 mx-4">
          <div className="flex flex-col">
            <h2 className="text-lg font-medium truncate">{sessionName}</h2>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="flex items-center gap-1 px-2 py-1"
              >
                {isPrivate ? (
                  <>
                    <Lock className="h-3 w-3 text-amber-500" />
                    <span className="text-xs text-amber-500">
                      Private Session
                    </span>
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">
                      Public Session
                    </span>
                  </>
                )}
              </Badge>

              <Badge variant="outline" className="px-2 py-1">
                <span className="text-xs">ID: {roomId.substring(0, 8)}</span>
              </Badge>

              {/* Current file indicator */}
              {self?.presence.currentFile && (
                <Badge variant="secondary" className="px-2 py-1 hidden md:flex">
                  <span className="text-xs">
                    File: {self.presence.currentFile.split("/").pop()}
                  </span>
                </Badge>
              )}

              {/* GitHub repo badge */}
              {repoInfo?.repoUrl && (
                <Badge variant="outline" className="px-2 py-1 hidden md:flex">
                  <a
                    href={repoInfo.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Github className="h-3 w-3" />
                    <span>GitHub</span>
                  </a>
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={copyRoomLink}
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden md:inline">Share</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy session link</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-1 rounded-full bg-accent px-3 py-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{others.length + 1}</span>
          </div>

          {/* Video call button - visible to all users */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showVideoCall ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={toggleVideoCall}
                >
                  {showVideoCall ? (
                    <>
                      <VideoOff className="h-4 w-4" />
                      <span className="hidden md:inline">End Call</span>
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4" />
                      <span className="hidden md:inline">Video Call</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showVideoCall ? "End video call" : "Start video call"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Only show GitHub integration for the session owner */}
          {isOwner && <GitHubIntegration roomId={roomId} />}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="h-8 w-8"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle theme</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Options</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={copyRoomLink}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy Session Link</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadWorkspace}>
                <Download className="mr-2 h-4 w-4" />
                <span>Download Workspace</span>
              </DropdownMenuItem>
              {repoInfo?.repoUrl && (
                <DropdownMenuItem asChild>
                  <a
                    href={repoInfo.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    <span>View on GitHub</span>
                  </a>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 hidden md:flex">
                <span className="truncate max-w-[100px]">{username}</span>
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Users in Session</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center">
                <div className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                <span>{username} (You)</span>
              </DropdownMenuItem>
              {others.map((user) => (
                <DropdownMenuItem
                  key={user.connectionId}
                  className="flex items-center"
                >
                  <div
                    className="mr-2 h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: `hsl(${
                        user.connectionId * 60
                      }, 100%, 50%)`,
                    }}
                  />
                  <span>{user.presence.username}</span>
                  {user.presence.currentFile && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({user.presence.currentFile.split("/").pop()})
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile user list */}
      {isMobile && (
        <div className="px-4 py-2 border-t border-border overflow-x-auto">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 border-2 border-green-500">
              <AvatarFallback className="text-xs">
                {username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {others.map((user) => (
              <TooltipProvider key={user.connectionId}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar
                      className="h-6 w-6"
                      style={{
                        borderColor: `hsl(${
                          user.connectionId * 60
                        }, 100%, 50%)`,
                        borderWidth: 2,
                      }}
                    >
                      <AvatarFallback className="text-xs">
                        {user.presence.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{user.presence.username}</p>
                    {user.presence.currentFile && (
                      <p className="text-xs text-muted-foreground">
                        Editing: {user.presence.currentFile.split("/").pop()}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      )}

      {/* Video call component - using your existing component */}
      {showVideoCall && (
        <VideoCall
          onClose={handleCloseVideoCall}
          sessionId={roomId}
          username={username}
        />
      )}
    </div>
  );
}
