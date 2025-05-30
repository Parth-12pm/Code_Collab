"use client";

import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import type { LiveObject, LiveList, LiveMap } from "@liveblocks/client";

// Create a Liveblocks client
const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "",
  throttle: 16,
});
// Define message type
type Message = {
  id: number;
  user: string;
  content: string;
  timestamp: number;
  readBy: string[]; // Array of usernames who have read the message
};

// Define file type
type FileData = {
  id: string;
  name: string;
  content: string;
  type: string;
  lastModified: number;
};

// Define timeline entry type
type TimelineEntry = {
  id: string;
  fileId: string;
  fileName: string;
  user: string;
  action: "create" | "modify" | "delete" | "rename";
  timestamp: number;
  oldName?: string;
};

// Define room settings type
type RoomSettings = {
  isPrivate: boolean;
  password: string;
  createdBy: string;
  createdAt: string;
};

// Define execution result type
export type ExecutionResult = {
  id: string;
  language: string;
  code: string;
  type: "web" | "non-web";
  status: "success" | "error";
  result?: any;
  error?: string;
  timestamp: number;
};

// Define presence types
export type Presence = {
  cursor: { line: number; column: number } | null;
  selection: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  } | null;
  username: string;
  currentFile: string | null;
};

// Define storage types
export type Storage = {
  document: LiveObject<{
    content: string;
  }>;
  messages: LiveList<Message>;
  files: LiveMap<string, FileData>;
  timeline: LiveList<TimelineEntry>;
  roomSettings: LiveObject<RoomSettings>;
  executionResults: LiveMap<string, ExecutionResult>; // Added for code execution feature
};

// Add monaco to window type
declare global {
  interface Window {
    monaco: any;
  }
}

// Create a room context
export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useSelf,
  useOthers,
  useOthersMapped,
  useOthersConnectionIds,
  useOther,
  useBroadcastEvent,
  useEventListener,
  useStorage,
  useMutation,
  useHistory,
  useCanUndo,
  useCanRedo,
  useUndo,
  useRedo,
  useStorageStatus,
} = createRoomContext<Presence, Storage>(client);
