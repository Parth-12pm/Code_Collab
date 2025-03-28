"use client";

declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    // Add non-standard attributes
    directory?: string;
    webkitdirectory?: string;
  }
}

import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  useStorage,
  useMutation,
  useStorageStatus,
  useMyPresence,
  useOthers,
} from "@/liveblocks.config";
import {
  FileText,
  Plus,
  Folder,
  Save,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Edit,
  Trash,
  Download,
  Copy,
  FileCode,
  Scissors,
  Clock,
  GitCommit,
  MoreHorizontal,
  GitBranch,
  GitPullRequest,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import JSZip from "jszip";
import FileSaver from "file-saver";
import { LiveList } from "@liveblocks/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";

// Define file type
type FileData = {
  id: string;
  name: string;
  content: string;
  type: string;
  lastModified: number;
};

// Define folder structure type
type FolderStructure = {
  [key: string]: {
    type: "folder" | "file";
    children?: FolderStructure;
    fileData?: FileData;
    expanded?: boolean;
  };
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

// Define sync operation type
type SyncOperation = {
  _id: string;
  operation: "create_repo" | "commit" | "sync";
  commitMessage?: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
};

interface SidebarProps {
  sessionId?: string;
}

export default function Sidebar({ sessionId }: SidebarProps) {
  const [newFileType, setNewFileType] = useState("js");
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [folderStructure, setFolderStructure] = useState<FolderStructure>({});
  const [newFileName, setNewFileName] = useState("");
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [contextMenuTarget, setContextMenuTarget] = useState<{
    path: string;
    type: "file" | "folder";
  } | null>(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    path: string;
    type: "file" | "folder";
    name: string;
  } | null>(null);
  const [newName, setNewName] = useState("");
  const [clipboard, setClipboard] = useState<{
    type: "cut" | "copy";
    path: string;
    isFolder: boolean;
  } | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [isNavigateFolderDialogOpen, setIsNavigateFolderDialogOpen] =
    useState(false);
  const [folderNavigationPath, setFolderNavigationPath] = useState("");
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const hiddenFolderInputRef = useRef<HTMLInputElement>(null);
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();

  // Check if storage is loaded
  const storageStatus = useStorageStatus();
  const isStorageLoaded = storageStatus === "synchronized";

  // Get files from storage
  const files = useStorage((root) => root.files);
  const timeline = useStorage((root) => root.timeline);

  // Initialize files in storage
  const initializeFiles = useMutation(({ storage }) => {
    const filesMap = storage.get("files");
    if (!filesMap || filesMap.size === 0) {
      // Don't create any default files - will be handled by the file creation dialog
    }
  }, []);

  // Add timeline entry
  const addTimelineEntry = useMutation(
    (
      { storage, self },
      entry: Omit<TimelineEntry, "id" | "user" | "timestamp">
    ) => {
      const timelineList = storage.get("timeline");
      if (!timelineList) {
        // Initialize timeline as LiveList if it doesn't exist
        storage.set(
          "timeline",
          new LiveList([
            {
              id: Date.now().toString(),
              user: self.presence.username || "Anonymous",
              ...entry,
              timestamp: Date.now(),
            },
          ])
        );
        return;
      }

      const username = self.presence.username || "Anonymous";
      const newEntry: TimelineEntry = {
        id: Date.now().toString(),
        user: username,
        ...entry,
        timestamp: Date.now(),
      };

      // Use LiveList's push method instead of unshift
      timelineList.push(newEntry);

      // Keep only the last 50 entries - we can't use pop directly
      if (timelineList.length > 50) {
        // Remove the oldest entry (first one)
        timelineList.delete(0);
      }
    },
    []
  );

  // Create a new file
  const createNewFile = useMutation(
    ({ storage }) => {
      if (!newFileName.trim()) return;

      const fileName = `${newFileName}.${newFileType}`;
      const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
      const fileId = filePath;

      const newFile: FileData = {
        id: fileId,
        name: filePath,
        content: `// ${fileName}\n// Created: ${new Date().toLocaleString()}\n\n`,
        type: newFileType,
        lastModified: Date.now(),
      };

      const filesMap = storage.get("files");
      if (filesMap) {
        filesMap.set(fileId, newFile);
      }

      // Update presence
      updateMyPresence({ currentFile: fileId });

      // Add timeline entry
      addTimelineEntry({
        fileId,
        fileName,
        action: "create",
      });

      setNewFileName("");
      setIsNewFileDialogOpen(false);

      // Update folder structure
      updateFolderStructure();
    },
    [newFileName, newFileType, currentPath]
  );

  // Create a new folder
  const createNewFolder = useMutation(
    ({ storage }) => {
      if (!newFolderName.trim()) return;

      // Create an empty file as a placeholder to represent the folder
      const folderPath = currentPath
        ? `${currentPath}/${newFolderName}/.folder`
        : `${newFolderName}/.folder`;

      const placeholderFile: FileData = {
        id: folderPath,
        name: folderPath,
        content: "",
        type: "folder",
        lastModified: Date.now(),
      };

      const filesMap = storage.get("files");
      if (filesMap) {
        filesMap.set(folderPath, placeholderFile);
      }

      setNewFolderName("");
      setIsNewFolderDialogOpen(false);

      // Update folder structure
      updateFolderStructure();
    },
    [newFolderName, currentPath]
  );

  // Set active file
  const setActiveFile = useMutation(({ storage }, fileId: string) => {
    // Only update the user's presence to indicate which file they're viewing
    updateMyPresence({ currentFile: fileId });
  }, []);

  // Upload local files
  const uploadFiles = useMutation(
    ({ storage }, uploadedFiles: File[], basePath = "") => {
      const filesMap = storage.get("files");
      if (!filesMap) return;

      // Process each file
      Array.from(uploadedFiles).forEach((file) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          const content = e.target?.result as string;
          const fileExtension = file.name.split(".").pop() || "";
          const filePath = basePath ? `${basePath}/${file.name}` : file.name;

          const fileData: FileData = {
            id: filePath,
            name: filePath,
            content,
            type: fileExtension,
            lastModified: file.lastModified,
          };

          filesMap.set(filePath, fileData);

          // Set the first uploaded file as active in the user's presence
          if (uploadedFiles[0] === file && !basePath) {
            updateMyPresence({ currentFile: filePath });
          }

          // Add timeline entry
          addTimelineEntry({
            fileId: filePath,
            fileName: file.name,
            action: "create",
          });
        };

        reader.readAsText(file);
      });

      // Update folder structure after files are uploaded
      setTimeout(() => updateFolderStructure(), 500);
    },
    []
  );

  // Upload folder
  const uploadFolder = useMutation(({ storage }, items: FileSystemEntry[]) => {
    const filesMap = storage.get("files");
    if (!filesMap) return;

    const processEntry = (entry: FileSystemEntry, path = "") => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        fileEntry.file((file) => {
          const reader = new FileReader();

          reader.onload = (e) => {
            const content = e.target?.result as string;
            const fileExtension = file.name.split(".").pop() || "";
            const fullPath = path ? `${path}/${file.name}` : file.name;

            const fileData: FileData = {
              id: fullPath,
              name: fullPath,
              content,
              type: fileExtension,
              lastModified: file.lastModified,
            };

            filesMap.set(fullPath, fileData);

            // Set the first file as active if not in a subfolder
            if (!path) {
              updateMyPresence({ currentFile: fullPath });
            }

            // Add timeline entry
            addTimelineEntry({
              fileId: fullPath,
              fileName: file.name,
              action: "create",
            });
          };

          reader.readAsText(file);
        });
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const dirReader = dirEntry.createReader();

        // Create a placeholder file to represent the folder
        const folderPath = path
          ? `${path}/${entry.name}/.folder`
          : `${entry.name}/.folder`;
        const placeholderFile: FileData = {
          id: folderPath,
          name: folderPath,
          content: "",
          type: "folder",
          lastModified: Date.now(),
        };

        filesMap.set(folderPath, placeholderFile);

        dirReader.readEntries((entries) => {
          for (const subEntry of entries) {
            const newPath = path ? `${path}/${entry.name}` : entry.name;
            processEntry(subEntry, newPath);
          }
        });
      }
    };

    for (const item of items) {
      processEntry(item);
    }

    // Update folder structure after files are uploaded
    setTimeout(() => updateFolderStructure(), 1000);

    // Show success toast
    toast({
      title: "Folder uploaded",
      description: "The folder has been successfully uploaded.",
    });
  }, []);

  // Delete a file or folder
  const deleteFileOrFolder = useMutation(
    ({ storage }, path: string, isFolder: boolean) => {
      const filesMap = storage.get("files");
      if (!filesMap) return;

      if (isFolder) {
        // Delete all files in the folder and its subfolders
        const folderPrefix = `${path}/`;
        const filesToDelete: string[] = [];

        filesMap.forEach((_, key) => {
          if (key === path || key.startsWith(folderPrefix)) {
            filesToDelete.push(key);
          }
        });

        // Don't delete if it would leave no files
        if (filesMap.size - filesToDelete.length <= 0) return;

        // If deleting the active file's folder, switch to another file first
        if (
          myPresence.currentFile &&
          (myPresence.currentFile === path ||
            myPresence.currentFile.startsWith(folderPrefix))
        ) {
          // Find another file to switch to
          let nextFileId: string | null = null;
          filesMap.forEach((_, key) => {
            if (
              !filesToDelete.includes(key) &&
              !key.endsWith("/.folder") &&
              !nextFileId
            ) {
              nextFileId = key;
            }
          });

          if (nextFileId) {
            updateMyPresence({ currentFile: nextFileId });
          }
        }

        // Now delete all the files
        filesToDelete.forEach((fileId) => {
          // Add timeline entry for each file (not folder placeholders)
          if (!fileId.endsWith("/.folder")) {
            addTimelineEntry({
              fileId,
              fileName: fileId.split("/").pop() || fileId,
              action: "delete",
            });
          }
          filesMap.delete(fileId);
        });
      } else {
        // Don't delete if it's the last file
        if (filesMap.size <= 1) return;

        // If deleting the active file, switch to another file first
        if (myPresence.currentFile === path) {
          // Find another file to switch to
          let nextFileId: string | null = null;
          filesMap.forEach((_, key) => {
            if (key !== path && !key.endsWith("/.folder") && !nextFileId) {
              nextFileId = key;
            }
          });

          if (nextFileId) {
            updateMyPresence({ currentFile: nextFileId });
          }
        }

        // Add timeline entry
        addTimelineEntry({
          fileId: path,
          fileName: path.split("/").pop() || path,
          action: "delete",
        });

        // Now delete the file
        filesMap.delete(path);
      }

      // Update folder structure
      updateFolderStructure();
    },
    []
  );

  // Rename a file or folder
  const renameFileOrFolder = useMutation(
    ({ storage }, oldPath: string, newPath: string, isFolder: boolean) => {
      const filesMap = storage.get("files");
      if (!filesMap) return;

      if (isFolder) {
        // Rename all files in the folder and its subfolders
        const oldFolderPrefix = `${oldPath}/`;
        const newFolderPrefix = `${newPath}/`;

        const filesToRename: {
          oldKey: string;
          newKey: string;
          data: FileData;
        }[] = [];

        filesMap.forEach((fileData, key) => {
          if (key === oldPath) {
            // This is the folder placeholder file
            const newKey = newPath;
            filesToRename.push({
              oldKey: key,
              newKey,
              data: { ...fileData, id: newKey, name: newKey },
            });
          } else if (key.startsWith(oldFolderPrefix)) {
            // This is a file within the folder
            const newKey = key.replace(oldFolderPrefix, newFolderPrefix);
            filesToRename.push({
              oldKey: key,
              newKey,
              data: { ...fileData, id: newKey, name: newKey },
            });
          }
        });

        // Update the active file reference if needed
        if (
          myPresence.currentFile &&
          (myPresence.currentFile === oldPath ||
            myPresence.currentFile.startsWith(oldFolderPrefix))
        ) {
          const newActiveFileId =
            myPresence.currentFile === oldPath
              ? newPath
              : myPresence.currentFile.replace(
                  oldFolderPrefix,
                  newFolderPrefix
                );
          updateMyPresence({ currentFile: newActiveFileId });
        }

        // Now rename all the files
        filesToRename.forEach(({ oldKey, newKey, data }) => {
          // Add timeline entry for each file (not folder placeholders)
          if (!oldKey.endsWith("/.folder")) {
            addTimelineEntry({
              fileId: newKey,
              fileName: newKey.split("/").pop() || newKey,
              action: "rename",
              oldName: oldKey,
            });
          }
          filesMap.delete(oldKey);
          filesMap.set(newKey, data);
        });
      } else {
        // Rename a single file
        const fileData = filesMap.get(oldPath);
        if (!fileData) return;

        // Create new file data with updated id and name
        const newFileData = {
          ...fileData,
          id: newPath,
          name: newPath,
        };

        // Update the active file reference if needed
        if (myPresence.currentFile === oldPath) {
          updateMyPresence({ currentFile: newPath });
        }

        // Add timeline entry
        addTimelineEntry({
          fileId: newPath,
          fileName: newPath.split("/").pop() || newPath,
          action: "rename",
          oldName: oldPath,
        });

        // Delete old file and add new one
        filesMap.delete(oldPath);
        filesMap.set(newPath, newFileData);
      }

      // Update folder structure
      updateFolderStructure();
    },
    []
  );

  // Handle clipboard paste
  const handlePaste = useMutation(
    ({ storage }, targetPath: string) => {
      if (!clipboard) return;
      const { type, path, isFolder } = clipboard;
      const filesMap = storage.get("files");
      if (!filesMap) return;

      // Determine the new path
      const name = path.split("/").pop() || "";
      const newPath = targetPath ? `${targetPath}/${name}` : name;

      if (isFolder) {
        // Copy/cut all files in the folder and its subfolders
        const folderPrefix = `${path}/`;
        const newFolderPrefix = `${newPath}/`;

        // Collect all files to copy
        const filesToCopy: {
          oldKey: string;
          newKey: string;
          data: FileData;
        }[] = [];

        filesMap.forEach((fileData, key) => {
          if (key === path) {
            // This is the folder placeholder file
            const newKey = newPath;
            filesToCopy.push({
              oldKey: key,
              newKey,
              data: { ...fileData, id: newKey, name: newKey },
            });
          } else if (key.startsWith(folderPrefix)) {
            // This is a file within the folder
            const newKey = key.replace(folderPrefix, newFolderPrefix);
            filesToCopy.push({
              oldKey: key,
              newKey,
              data: { ...fileData, id: newKey, name: newKey },
            });
          }
        });

        // Copy all files to new location
        filesToCopy.forEach(({ newKey, data }) => {
          filesMap.set(newKey, { ...data });
        });

        // If cutting, delete original files
        if (type === "cut") {
          filesToCopy.forEach(({ oldKey }) => {
            filesMap.delete(oldKey);
          });
        }
      } else {
        // Copy/cut a single file
        const fileData = filesMap.get(path);
        if (!fileData) return;

        // Create new file data
        const newFileData = {
          ...fileData,
          id: newPath,
          name: newPath,
        };

        // Copy file to new location
        filesMap.set(newPath, newFileData);

        // If cutting, delete original file
        if (type === "cut") {
          filesMap.delete(path);
        }

        // Add timeline entry
        addTimelineEntry({
          fileId: newPath,
          fileName: newPath.split("/").pop() || newPath,
          action: type === "cut" ? "rename" : "create",
          oldName: type === "cut" ? path : undefined,
        });
      }

      // Clear clipboard after paste
      setClipboard(null);

      // Update folder structure
      updateFolderStructure();
    },
    [clipboard]
  );

  // Toggle folder expansion
  const toggleFolderExpansion = (path: string) => {
    setFolderStructure((prevStructure) => {
      const newStructure = { ...prevStructure };

      // Navigate to the folder in the structure
      const pathParts = path.split("/");
      let current = newStructure;

      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        if (!current[part]) break;

        if (i === pathParts.length - 1) {
          // Toggle the expanded state
          current[part].expanded = !current[part].expanded;
        } else if (current[part].children) {
          current = current[part].children!;
        } else {
          break;
        }
      }

      return newStructure;
    });
  };

  // Build folder structure from files
  const updateFolderStructure = () => {
    if (!files) return;

    const structure: FolderStructure = {};

    files.forEach((fileData, path) => {
      // Skip hidden folder placeholder files in the UI
      if (path.endsWith("/.folder")) {
        const folderPath = path.substring(0, path.length - 8);
        const pathParts = folderPath.split("/");

        let current = structure;

        // Create folder structure
        pathParts.forEach((part, index) => {
          if (!current[part]) {
            current[part] = {
              type: "folder",
              children: {},
              expanded: true, // Default to expanded
            };
          }

          if (index < pathParts.length - 1) {
            current = current[part].children!;
          }
        });

        return;
      }

      const pathParts = path.split("/");
      const fileName = pathParts.pop()!;

      let current = structure;

      // Create folder structure for the file
      pathParts.forEach((part) => {
        if (!current[part]) {
          current[part] = {
            type: "folder",
            children: {},
            expanded: true, // Default to expanded
          };
        }

        current = current[part].children!;
      });

      // Add the file
      current[fileName] = {
        type: "file",
        fileData,
      };
    });

    setFolderStructure(structure);
  };

  // Initialize files on component mount - only when storage is loaded
  useEffect(() => {
    if (isStorageLoaded) {
      initializeFiles();
      updateFolderStructure();
    }
  }, [isStorageLoaded, initializeFiles]);

  // Update folder structure when files change
  useEffect(() => {
    if (files) {
      updateFolderStructure();
      setAvailableFolders(getAvailableFolders());
    }
  }, [files]);

  // Update timeline entries when timeline changes
  useEffect(() => {
    if (timeline) {
      // Convert LiveList to array
      const entries: TimelineEntry[] = [];
      for (let i = 0; i < timeline.length; i++) {
        entries.push(timeline[i]);
      }
      // Reverse to show newest first (since we're using push instead of unshift)
      setTimelineEntries(entries.reverse());
    }
  }, [timeline]);

  // Add a listener for the custom event to show the file creation dialog
  useEffect(() => {
    const handleShowFileCreationDialog = () => {
      setIsNewFileDialogOpen(true);
    };

    window.addEventListener(
      "showFileCreationDialog",
      handleShowFileCreationDialog
    );

    return () => {
      window.removeEventListener(
        "showFileCreationDialog",
        handleShowFileCreationDialog
      );
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files), currentPath);
    }
  };

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.webkitEntries && e.target.webkitEntries.length > 0) {
      uploadFolder(Array.from(e.target.webkitEntries));
    }
  };

  // Enhanced Open Folder button functionality
  const openFolderSelector = () => {
    // Use the hidden folder input to select a folder from the local device
    if (hiddenFolderInputRef.current) {
      hiddenFolderInputRef.current.click();
    }
  };

  const handleLocalFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.webkitEntries && e.target.webkitEntries.length > 0) {
      // Process the selected folder
      uploadFolder(Array.from(e.target.webkitEntries));
    }
  };

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Add a function to get all available folders
  const getAvailableFolders = () => {
    if (!files) return [];

    const folders = new Set<string>();

    files.forEach((_, path) => {
      if (path.endsWith("/.folder")) {
        const folderPath = path.substring(0, path.length - 8);
        folders.add(folderPath);

        // Also add parent folders
        const parts = folderPath.split("/");
        for (let i = 1; i < parts.length; i++) {
          folders.add(parts.slice(0, i).join("/"));
        }
      }
    });

    return Array.from(folders).sort();
  };

  // Add a function to navigate to a folder
  const navigateToFolder = (folderPath: string) => {
    setCurrentPath(folderPath);
    setFolderNavigationPath("");
    setIsNavigateFolderDialogOpen(false);

    // Expand the folder in the UI
    setFolderStructure((prevStructure) => {
      const newStructure = { ...prevStructure };
      const pathParts = folderPath.split("/");

      let current = newStructure;
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        if (!current[part]) break;

        current[part].expanded = true;

        if (i < pathParts.length - 1 && current[part].children) {
          current = current[part].children!;
        }
      }

      return newStructure;
    });
  };

  // Save current file to local system
  const saveFileToLocal = (path: string) => {
    const fileData = files?.get(path);

    if (fileData) {
      const blob = new Blob([fileData.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileData.name.split("/").pop() || fileData.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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

  // Handle context menu
  const handleContextMenu = (
    e: React.MouseEvent,
    path: string,
    type: "file" | "folder"
  ) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuTarget({ path, type });
  };

  // Open rename dialog
  const openRenameDialog = (path: string, type: "file" | "folder") => {
    const name = path.split("/").pop() || path;
    setRenameTarget({ path, type, name });
    setNewName(name);
    setIsRenameDialogOpen(true);
  };

  // Handle rename
  const handleRename = () => {
    if (!renameTarget || !newName.trim()) return;

    const { path, type, name } = renameTarget;

    // Get the parent path
    const pathParts = path.split("/");
    pathParts.pop(); // Remove the file/folder name
    const parentPath = pathParts.join("/");

    // Create the new path
    const newPath = parentPath ? `${parentPath}/${newName}` : newName;

    // Rename the file or folder
    renameFileOrFolder(path, newPath, type === "folder");

    setIsRenameDialogOpen(false);
    setRenameTarget(null);
    setNewName("");
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number | string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get action color
  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "text-green-500";
      case "modify":
        return "text-blue-500";
      case "delete":
        return "text-red-500";
      case "rename":
        return "text-yellow-500";
      default:
        return "text-muted-foreground";
    }
  };

  // Fetch GitHub sync operations
  useEffect(() => {
    if (sessionId) {
      const fetchSyncOperations = async () => {
        try {
          const response = await fetch(
            `/api/sessions/${sessionId}/sync-operations`
          );
          if (response.ok) {
            const data = await response.json();
            setSyncOperations(data);
          }
        } catch (error) {
          console.error("Error fetching sync operations:", error);
        }
      };

      fetchSyncOperations();

      // Set up polling to refresh sync operations every 30 seconds
      const interval = setInterval(fetchSyncOperations, 30000);
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  // Update timeline entries when timeline changes
  useEffect(() => {
    if (timeline) {
      // Convert LiveList to array
      const entries: TimelineEntry[] = [];
      for (let i = 0; i < timeline.length; i++) {
        entries.push(timeline[i]);
      }
      // Reverse to show newest first (since we're using push instead of unshift)
      setTimelineEntries(entries.reverse());
    }
  }, [timeline]);

  // Render a file or folder
  const renderItem = (
    name: string,
    item: FolderStructure[string],
    path: string,
    depth = 0
  ) => {
    const fullPath = path ? `${path}/${name}` : name;
    // Check if this file is active for the current user, not based on global activeFile
    const isActive = myPresence.currentFile === fullPath;

    // Find users viewing this file
    const usersViewingFile = others.filter(
      (user) => user.presence.currentFile === fullPath
    );

    if (item.type === "folder") {
      return (
        <div key={fullPath} className="mb-1">
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                className={`group flex items-center hover:bg-accent/50 rounded-md cursor-pointer`}
                onClick={() => toggleFolderExpansion(fullPath)}
                onContextMenu={(e) => handleContextMenu(e, fullPath, "folder")}
              >
                <div
                  className="flex items-center w-full pl-2 py-1"
                  style={{ paddingLeft: `${depth * 12 + 8}px` }}
                >
                  {item.expanded ? (
                    <ChevronDown className="h-3.5 w-3.5 mr-1 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 mr-1 text-muted-foreground flex-shrink-0" />
                  )}
                  {item.expanded ? (
                    <FolderOpen className="h-4 w-4 mr-1.5 text-blue-500 flex-shrink-0" />
                  ) : (
                    <Folder className="h-4 w-4 mr-1.5 text-blue-500 flex-shrink-0" />
                  )}
                  <span className="truncate text-sm">{name}</span>

                  {/* Three-dot menu that appears on hover */}
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPath(fullPath);
                            setIsNewFileDialogOpen(true);
                          }}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          <span>New File</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPath(fullPath);
                            setIsNewFolderDialogOpen(true);
                          }}
                        >
                          <Folder className="mr-2 h-4 w-4" />
                          <span>New Folder</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setClipboard({
                              type: "cut",
                              path: fullPath,
                              isFolder: true,
                            });
                          }}
                        >
                          <Scissors className="mr-2 h-4 w-4" />
                          <span>Cut</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setClipboard({
                              type: "copy",
                              path: fullPath,
                              isFolder: true,
                            });
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          <span>Copy</span>
                        </DropdownMenuItem>
                        {clipboard && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePaste(fullPath);
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Paste</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openRenameDialog(fullPath, "folder");
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFileOrFolder(fullPath, true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                onClick={() => {
                  setCurrentPath(fullPath);
                  setIsNewFileDialogOpen(true);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>New File</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  setCurrentPath(fullPath);
                  setIsNewFolderDialogOpen(true);
                }}
              >
                <Folder className="mr-2 h-4 w-4" />
                <span>New Folder</span>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() =>
                  setClipboard({ type: "cut", path: fullPath, isFolder: true })
                }
              >
                <Scissors className="mr-2 h-4 w-4" />
                <span>Cut</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() =>
                  setClipboard({ type: "copy", path: fullPath, isFolder: true })
                }
              >
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy</span>
              </ContextMenuItem>
              {clipboard && (
                <ContextMenuItem onClick={() => handlePaste(fullPath)}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Paste</span>
                </ContextMenuItem>
              )}
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => openRenameDialog(fullPath, "folder")}
              >
                <Edit className="mr-2 h-4 w-4" />
                <span>Rename</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => deleteFileOrFolder(fullPath, true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>

          {item.expanded && item.children && (
            <div>
              {Object.entries(item.children)
                .sort(([aName, aItem], [bName, bItem]) => {
                  // Sort folders first, then files
                  if (aItem.type === "folder" && bItem.type === "file")
                    return -1;
                  if (aItem.type === "file" && bItem.type === "folder")
                    return 1;
                  return aName.localeCompare(bName);
                })
                .map(([childName, childItem]) =>
                  renderItem(childName, childItem, fullPath, depth + 1)
                )}
            </div>
          )}
        </div>
      );
    } else {
      // Get file extension for icon
      const extension = name.split(".").pop()?.toLowerCase() || "";

      // Determine file icon based on extension
      let FileIcon = FileText;
      let iconColor = "text-muted-foreground";

      switch (extension) {
        case "js":
          FileIcon = FileCode;
          iconColor = "text-yellow-500";
          break;
        case "ts":
        case "tsx":
          FileIcon = FileCode;
          iconColor = "text-blue-500";
          break;
        case "jsx":
          FileIcon = FileCode;
          iconColor = "text-cyan-500";
          break;
        case "css":
          FileIcon = FileCode;
          iconColor = "text-purple-500";
          break;
        case "html":
          FileIcon = FileCode;
          iconColor = "text-orange-500";
          break;
        case "json":
          FileIcon = FileCode;
          iconColor = "text-yellow-400";
          break;
        case "md":
          FileIcon = FileText;
          iconColor = "text-blue-400";
          break;
      }

      return (
        <ContextMenu key={fullPath}>
          <ContextMenuTrigger>
            <div
              className={`group flex items-center justify-between rounded-md p-1 ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => setActiveFile(fullPath)}
              onContextMenu={(e) => handleContextMenu(e, fullPath, "file")}
            >
              <div className="flex items-center overflow-hidden flex-1">
                <FileIcon
                  className={`mr-1.5 h-4 w-4 flex-shrink-0 ${
                    isActive ? "text-primary" : iconColor
                  }`}
                />
                <span className="truncate text-sm">{name}</span>

                {/* User indicators */}
                <div className="flex ml-2">
                  {usersViewingFile.map((user) => (
                    <div
                      key={user.connectionId}
                      className="h-2 w-2 rounded-full ml-0.5"
                      style={{
                        backgroundColor: `hsl(${
                          user.connectionId * 60
                        }, 100%, 50%)`,
                      }}
                      title={`${user.presence.username} is viewing this file`}
                    />
                  ))}
                </div>
              </div>

              {/* Three-dot menu that appears on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => openRenameDialog(fullPath, "file")}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setClipboard({
                          type: "cut",
                          path: fullPath,
                          isFolder: false,
                        })
                      }
                    >
                      <Scissors className="mr-2 h-4 w-4" />
                      <span>Cut</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setClipboard({
                          type: "copy",
                          path: fullPath,
                          isFolder: false,
                        })
                      }
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      <span>Copy</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        saveFileToLocal(fullPath);
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      <span>Download</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const fileData = files?.get(fullPath);
                        if (fileData) {
                          navigator.clipboard.writeText(fileData.content);
                        }
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      <span>Copy Content</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => deleteFileOrFolder(fullPath, false)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => openRenameDialog(fullPath, "file")}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Rename</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                setClipboard({ type: "cut", path: fullPath, isFolder: false })
              }
            >
              <Scissors className="mr-2 h-4 w-4" />
              <span>Cut</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                setClipboard({ type: "copy", path: fullPath, isFolder: false })
              }
            >
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                saveFileToLocal(fullPath);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              <span>Download</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                const fileData = files?.get(fullPath);
                if (fileData) {
                  navigator.clipboard.writeText(fileData.content);
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy Content</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => deleteFileOrFolder(fullPath, false)}
              className="text-destructive focus:text-destructive"
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center">
          <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Files</h2>
        </div>
        <div className="flex space-x-1">
          <Dialog
            open={isNewFileDialogOpen}
            onOpenChange={setIsNewFileDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="New File"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New File</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {currentPath && (
                  <div className="px-4">
                    <p className="text-sm text-muted-foreground">
                      Creating in: {currentPath}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="filename" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="filename"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="col-span-3"
                    placeholder="filename"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="filetype" className="text-right">
                    Type
                  </Label>
                  <select
                    id="filetype"
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value)}
                    className="col-span-3 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="js">JavaScript (.js)</option>
                    <option value="ts">TypeScript (.ts)</option>
                    <option value="jsx">React JSX (.jsx)</option>
                    <option value="tsx">React TSX (.tsx)</option>
                    <option value="html">HTML (.html)</option>
                    <option value="css">CSS (.css)</option>
                    <option value="json">JSON (.json)</option>
                    <option value="md">Markdown (.md)</option>
                    <option value="py">Python (.py)</option>
                    <option value="txt">Text (.txt)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsNewFileDialogOpen(false);
                    setCurrentPath("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => createNewFile()}>Create File</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isNewFolderDialogOpen}
            onOpenChange={setIsNewFolderDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="New Folder"
              >
                <Folder className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {currentPath && (
                  <div className="px-4">
                    <p className="text-sm text-muted-foreground">
                      Creating in: {currentPath}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="foldername" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="foldername"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="col-span-3"
                    placeholder="folder name"
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsNewFolderDialogOpen(false);
                    setCurrentPath("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => createNewFolder()}>Create Folder</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isRenameDialogOpen}
            onOpenChange={setIsRenameDialogOpen}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Rename {renameTarget?.type === "folder" ? "Folder" : "File"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newname" className="text-right">
                    New Name
                  </Label>
                  <Input
                    id="newname"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="col-span-3"
                    placeholder="new name"
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRenameDialogOpen(false);
                    setRenameTarget(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleRename}>Rename</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={openFileSelector}
            title="Open File"
          >
            <FileText className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={openFolderSelector}
            title="Open Folder"
          >
            <FolderOpen className="h-4 w-4" />
          </Button>

          <Dialog
            open={isNavigateFolderDialogOpen}
            onOpenChange={setIsNavigateFolderDialogOpen}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Navigate to Folder</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="folderpath" className="text-right">
                    Folder
                  </Label>
                  <select
                    id="folderpath"
                    value={folderNavigationPath}
                    onChange={(e) => setFolderNavigationPath(e.target.value)}
                    className="col-span-3 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Root</option>
                    {availableFolders.map((folder) => (
                      <option key={folder} value={folder}>
                        {folder}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsNavigateFolderDialogOpen(false);
                    setFolderNavigationPath("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => navigateToFolder(folderNavigationPath)}>
                  Navigate
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={downloadWorkspace}
            title="Download Workspace"
          >
            <Save className="h-4 w-4" />
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />

          <input
            type="file"
            ref={folderInputRef}
            onChange={handleFolderUpload}
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
          />

          {/* Hidden input for selecting a folder from local device */}
          <input
            type="file"
            ref={hiddenFolderInputRef}
            onChange={handleLocalFolderSelect}
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.keys(folderStructure).length > 0 ? (
            <div>
              {Object.entries(folderStructure)
                .sort(([aName, aItem], [bName, bItem]) => {
                  // Sort folders first, then files
                  if (aItem.type === "folder" && bItem.type === "file")
                    return -1;
                  if (aItem.type === "file" && bItem.type === "folder")
                    return 1;
                  return aName.localeCompare(bName);
                })
                .map(([name, item]) => renderItem(name, item, "", 0))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="mb-2 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No files in workspace
              </p>
              <p className="text-xs text-muted-foreground">
                Create a new file or open existing files
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Updated Timeline section */}
      <Collapsible
        defaultOpen={true}
        open={timelineOpen}
        onOpenChange={setTimelineOpen}
        className="border-t border-border"
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between p-2 hover:bg-accent/50">
          <div className="flex items-center">
            <ChevronRight
              className={`h-4 w-4 mr-2 transition-transform ${
                timelineOpen ? "rotate-90" : ""
              }`}
            />
            <Clock className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Timeline</span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ScrollArea className="h-40">
            <div className="p-2 space-y-2">
              {/* GitHub Sync Operations */}
              {syncOperations.length > 0 && (
                <div className="mb-2">
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">
                    GitHub Activity
                  </h4>
                  {syncOperations.slice(0, 5).map((op) => (
                    <div
                      key={op._id}
                      className="text-xs border-l-2 border-blue-500 pl-2 py-1 mb-2"
                    >
                      <div className="flex items-center">
                        {op.operation === "create_repo" ? (
                          <GitBranch className="h-3 w-3 mr-1 text-blue-500" />
                        ) : op.operation === "commit" ? (
                          <GitCommit className="h-3 w-3 mr-1 text-green-500" />
                        ) : (
                          <GitPullRequest className="h-3 w-3 mr-1 text-purple-500" />
                        )}
                        <span className="font-medium">
                          {op.operation === "create_repo"
                            ? "Repository Created"
                            : op.operation === "commit"
                            ? "Committed Changes"
                            : "Synced Changes"}
                        </span>
                      </div>
                      {op.commitMessage && (
                        <div className="text-muted-foreground mt-1 italic">
                          {op.commitMessage}
                        </div>
                      )}
                      <div className="flex items-center text-muted-foreground mt-1">
                        <span>{formatTimestamp(op.createdAt)}</span>
                        <span className="mx-1">•</span>
                        <span
                          className={`px-1 rounded text-xs ${
                            op.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : op.status === "failed"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}
                        >
                          {op.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* File Changes Timeline */}
              <h4 className="text-xs font-medium text-muted-foreground mb-1">
                File Changes
              </h4>
              {timelineEntries.length > 0 ? (
                timelineEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="text-xs border-l-2 border-muted pl-2 py-1"
                  >
                    <div className="flex items-center">
                      <span
                        className={`font-medium ${getActionColor(
                          entry.action
                        )}`}
                      >
                        {entry.action.charAt(0).toUpperCase() +
                          entry.action.slice(1)}
                      </span>
                      <span className="ml-1">{entry.fileName}</span>
                    </div>
                    {entry.oldName && (
                      <div className="text-muted-foreground">
                        From: {entry.oldName.split("/").pop()}
                      </div>
                    )}
                    <div className="flex items-center text-muted-foreground mt-1">
                      <span>{entry.user}</span>
                      <span className="mx-1">•</span>
                      <span>{formatTimestamp(entry.timestamp)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground text-xs">
                  <GitCommit className="h-4 w-4 mx-auto mb-2" />
                  <p>No timeline entries yet</p>
                  <p>Changes will appear here as you work</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
