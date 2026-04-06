"use client";

import { useEffect, useRef, useState } from "react";
import {
  useMyPresence,
  useOthers,
  useStorage,
  useStorageStatus,
  useSelf,
} from "@/liveblocks.config";
import { useMutation } from "@liveblocks/react";
import type { editor } from "monaco-editor";
import dynamic from "next/dynamic";
import { LiveList } from "@liveblocks/client";

// Dynamically import monaco editor
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
});

// Add theme prop to the Editor component
interface EditorProps {
  theme: "light" | "dark";
}

export default function Editor({ theme }: EditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const isApplyingExternalUpdateRef = useRef(false);
  const modifyTimelineTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const self = useSelf();

  // Check if storage is loaded
  const storageStatus = useStorageStatus();
  const isStorageLoaded = storageStatus === "synchronized";

  // Get files from storage
  const files = useStorage((root) => root.files);

  const [currentLanguage, setCurrentLanguage] = useState("javascript");

  // Handle editor mount
  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: typeof import("monaco-editor")
  ) => {
    editorRef.current = editor;
    setEditorReady(true);

    // Set window.monaco for other components to use
    if (typeof window !== "undefined") {
      window.monaco = monaco;
      window.codeCollabEditor = editor;
      window.codeCollabCurrentFile = null;

      // Add custom CSS for cursor tooltips
      const style = document.createElement("style");
      style.textContent = `
        .monaco-editor .cursor-tooltip {
          position: absolute;
          background-color: var(--tooltip-bg);
          color: var(--tooltip-fg);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          pointer-events: none;
          z-index: 100;
          white-space: nowrap;
          transform: translate(-50%, -100%);
          margin-top: -4px;
        }
        
        .monaco-editor .cursor-user {
          position: absolute;
          width: 2px;
          z-index: 1;
          pointer-events: none;
        }
        
        .dark .monaco-editor .cursor-tooltip {
          --tooltip-bg: #333;
          --tooltip-fg: #fff;
        }
        
        .light .monaco-editor .cursor-tooltip {
          --tooltip-bg: #f5f5f5;
          --tooltip-fg: #333;
        }
      `;
      document.head.appendChild(style);
    }
  };

  // Update file content in storage
  const updateFileContent = useMutation(
    ({ storage }, fileId: string, content: string) => {
      const filesMap = storage.get("files");
      if (!filesMap) return;

      const file = filesMap.get(fileId);
      if (file && file.content !== content) {
        filesMap.set(fileId, {
          ...file,
          content,
          lastModified: Date.now(),
        });
      }
    },
    []
  );

  const addModifyTimelineEntry = useMutation(
    ({ storage }, fileId: string) => {
      const timelineList = storage.get("timeline");
      const username = self?.presence.username || "Anonymous";

      const newEntry = {
        id: Date.now().toString(),
        fileId,
        fileName: fileId.split("/").pop() || fileId,
        user: username,
        action: "modify" as const,
        timestamp: Date.now(),
      };

      if (!timelineList) {
        // Initialize timeline as LiveList if it doesn't exist
        storage.set("timeline", new LiveList([newEntry]));
        return;
      }

      timelineList.push(newEntry);

      if (timelineList.length > 50) {
        timelineList.delete(0);
      }
    },
    [self]
  );

  // Handle content changes from the editor
  useEffect(() => {
    if (
      !editorReady ||
      !editorRef.current ||
      !isStorageLoaded ||
      !myPresence.currentFile
    )
      return;

    const editor = editorRef.current;
    const currentFileId = myPresence.currentFile;

    const handleContentChange = () => {
      if (isApplyingExternalUpdateRef.current) {
        return;
      }

      const content = editor.getValue();
      updateFileContent(currentFileId, content);

      if (modifyTimelineTimeoutRef.current) {
        clearTimeout(modifyTimelineTimeoutRef.current);
      }

      modifyTimelineTimeoutRef.current = setTimeout(() => {
        addModifyTimelineEntry(currentFileId);
      }, 1000);
    };

    const disposable = editor.onDidChangeModelContent(handleContentChange);

    return () => {
      if (modifyTimelineTimeoutRef.current) {
        clearTimeout(modifyTimelineTimeoutRef.current);
        modifyTimelineTimeoutRef.current = null;
      }
      disposable.dispose();
    };
  }, [
    addModifyTimelineEntry,
    editorReady,
    isStorageLoaded,
    myPresence.currentFile,
    updateFileContent,
  ]);

  // Update editor when active file changes
  useEffect(() => {
    if (!editorReady || !editorRef.current || !files || !myPresence.currentFile)
      return;

    const currentFileId = myPresence.currentFile;
    const fileData = files.get(currentFileId);

    if (fileData) {
      const editor = editorRef.current;

      if (typeof window !== "undefined") {
        window.codeCollabCurrentFile = currentFileId;
      }

      // Determine language based on file extension
      let language = "javascript"; // default
      const extension = fileData.type.toLowerCase();

      switch (extension) {
        case "js":
          language = "javascript";
          break;
        case "ts":
          language = "typescript";
          break;
        case "jsx":
        case "tsx":
          language = "typescript";
          break;
        case "html":
          language = "html";
          break;
        case "css":
          language = "css";
          break;
        case "json":
          language = "json";
          break;
        case "md":
          language = "markdown";
          break;
        case "py":
          language = "python";
          break;
        default:
          language = "plaintext";
      }

      setCurrentLanguage(language);

      const nextContent = fileData.content || "";

      if (editor.getValue() !== nextContent) {
        // Save current cursor position
        const position = editor.getPosition();

        // Update content
        isApplyingExternalUpdateRef.current = true;
        editor.setValue(nextContent);
        isApplyingExternalUpdateRef.current = false;

        // Restore cursor position
        if (position) {
          editor.setPosition(position);
          editor.revealPositionInCenter(position);
        }
      }
    }
  }, [editorReady, files, myPresence.currentFile]);

  // Handle cursor and selection updates
  useEffect(() => {
    if (!editorReady || !editorRef.current) return;

    const editor = editorRef.current;
    let timeoutId: NodeJS.Timeout;

    const updateCursorAndSelection = () => {
      const selection = editor.getSelection();
      if (!selection) return;

      const position = editor.getPosition();
      if (!position) return;

      // Throttle cursor updates to 50ms to prevent presence flooding
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateMyPresence({
          cursor: {
            line: position.lineNumber,
            column: position.column,
          },
          selection: selection
            ? {
                startLine: selection.startLineNumber,
                startColumn: selection.startColumn,
                endLine: selection.endLineNumber,
                endColumn: selection.endColumn,
              }
            : null,
        });
      }, 50);
    };

    const disposables = [
      editor.onDidChangeCursorPosition(updateCursorAndSelection),
      editor.onDidChangeCursorSelection(updateCursorAndSelection),
    ];

    return () => {
      clearTimeout(timeoutId);
      disposables.forEach((disposable) => disposable.dispose());
    };
  }, [editorReady, updateMyPresence]);

  // Render other users' cursors and selections
  useEffect(() => {
    if (!editorReady || !editorRef.current) return;

    const editor = editorRef.current;
    const monaco = window.monaco;
    if (!monaco) return;

    const decorations = new Map();
    const cursorElements = new Map();

    // Remove all existing decorations
    decorations.forEach((decorationId) => {
      editor.removeDecorations([decorationId]);
    });
    decorations.clear();

    // Remove all existing cursor elements
    cursorElements.forEach((element) => {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    cursorElements.clear();

    // Add decorations for each user
    others.forEach((user) => {
      if (
        !user.presence.cursor ||
        !user.presence.username ||
        user.presence.currentFile !== myPresence.currentFile
      )
        return;

      const { cursor, selection, username } = user.presence;
      const userColor = `hsl(${user.connectionId * 60}, 100%, 50%)`;

      // Create cursor element
      const cursorElement = document.createElement("div");
      cursorElement.className = "cursor-user";
      cursorElement.style.backgroundColor = userColor;
      cursorElement.style.height = "18px";

      // Create tooltip element
      const tooltipElement = document.createElement("div");
      tooltipElement.className = "cursor-tooltip";
      tooltipElement.style.backgroundColor = userColor;
      tooltipElement.textContent = username;
      cursorElement.appendChild(tooltipElement);

      // Add cursor element to editor DOM
      const editorDomNode = editor.getDomNode();
      if (editorDomNode) {
        editorDomNode.appendChild(cursorElement);
        cursorElements.set(user.connectionId, cursorElement);
      }

      // Position the cursor element
      const updateCursorPosition = () => {
        if (!editor || !cursorElement) return;

        const position = {
          lineNumber: cursor.line,
          column: cursor.column,
        };

        const coordinates = editor.getScrolledVisiblePosition(position);
        if (coordinates) {
          cursorElement.style.left = `${coordinates.left}px`;
          cursorElement.style.top = `${coordinates.top}px`;
          cursorElement.style.display = "block";
        } else {
          cursorElement.style.display = "none";
        }
      };

      // Initial positioning
      updateCursorPosition();

      // Update position on editor scroll or resize
      const scrollDisposable = editor.onDidScrollChange(updateCursorPosition);
      const resizeDisposable = editor.onDidLayoutChange(updateCursorPosition);

      // Add selection decoration if exists
      if (selection) {
        const selectionDecoration = {
          range: new monaco.Range(
            selection.startLine,
            selection.startColumn,
            selection.endLine,
            selection.endColumn
          ),
          options: {
            className: `opacity-30`,
            inlineClassName: `bg-[${userColor}]`,
            hoverMessage: { value: username },
          },
        };

        const decorationIds = editor.deltaDecorations(
          [],
          [selectionDecoration]
        );
        decorations.set(user.connectionId, {
          ids: decorationIds,
          dispose: () => {
            scrollDisposable.dispose();
            resizeDisposable.dispose();
            editor.deltaDecorations(decorationIds, []);
          },
        });
      } else {
        decorations.set(user.connectionId, {
          ids: [],
          dispose: () => {
            scrollDisposable.dispose();
            resizeDisposable.dispose();
          },
        });
      }
    });

    return () => {
      // Clean up decorations
      decorations.forEach((decoration) => {
        if (decoration.dispose) {
          decoration.dispose();
        }
      });

      // Clean up cursor elements
      cursorElements.forEach((element) => {
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    };
  }, [others, editorReady, myPresence.currentFile]);

  // Add a useEffect to update the editor theme when the application theme changes
  useEffect(() => {
    if (editorReady && editorRef.current) {
      const isDarkTheme = document.documentElement.classList.contains("dark");
      const monaco = window.monaco;

      if (monaco) {
        monaco.editor.setTheme(isDarkTheme ? "vs-dark" : "light");
      }
    }
  }, [editorReady, theme]); // Add theme as a dependency

  useEffect(() => {
    return () => {
      if (
        typeof window !== "undefined" &&
        window.codeCollabEditor === editorRef.current
      ) {
        window.codeCollabEditor = null;
        window.codeCollabCurrentFile = null;
      }
    };
  }, []);

  // Update the MonacoEditor component to use a dynamic theme
  return (
    <div className="relative h-full w-full">
      <MonacoEditor
        height="100%"
        language={currentLanguage}
        theme={theme === "dark" ? "vs-dark" : "light"}
        options={{
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: "on",
          renderLineHighlight: "all",
          cursorBlinking: "blink",
          cursorSmoothCaretAnimation: "on",
        }}
        onMount={handleEditorDidMount}
      />
      {!isStorageLoaded && (
        <div className="absolute bottom-4 left-4 rounded-md bg-card px-3 py-2 text-sm text-amber-500">
          Connecting to collaboration server...
        </div>
      )}
    </div>
  );
}
