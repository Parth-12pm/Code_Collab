
<div align="center">
  CodeCollab

**A real-time collaborative code editor built for teams**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-code--collab--self.vercel.app-blue?style=for-the-badge)](https://code-collab-self.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

</div>

---

## Overview

CodeCollab is a feature-rich, real-time collaborative coding platform that enables developers to write, run, and review code together — from anywhere. Built with Next.js 15, it combines live presence tracking, multi-language code execution, integrated AI assistance, and video calling into a single seamless environment.

![CodeCollab Editor](https://code-collab-self.vercel.app/)

---

## Features

### 🖊️ Real-Time Collaborative Editing
- Live multi-cursor presence — see exactly where teammates are typing
- Conflict-free collaborative state powered by [Liveblocks](https://liveblocks.io/)
- Per-user colour-coded cursor overlays and selection highlights

### 📁 Multi-File Workspace
- Full folder/file tree with drag-and-drop-style management
- Create, rename, delete, cut, copy, and paste files and folders
- Upload local files or entire folder structures from your machine
- Download the entire workspace as a `.zip` archive

### ▶️ Code Execution
- **Web languages** (HTML/CSS/JS, React, Vue, Svelte) — live Sandpack preview with hot reload
- **Server-side languages** (Python, TypeScript, Java, C, C++, C#, Go, Ruby, Rust, PHP) — executed via the Wandbox API
- Integrated terminal (xterm.js) with `run` command support
- Split Preview + Console panel layout

### 🤖 AI Coding Assistant
- Powered by Google Gemini 1.5 Pro
- Context-aware: automatically reads the file you're currently editing
- Streamed responses with syntax-highlighted Markdown and code blocks
- Copy-to-clipboard for every code snippet

### 🎥 Video Calls
- Floating, draggable, resizable video call window
- Built on [ZegoCloud UIKit Prebuilt](https://www.zegocloud.com/)
- Start/end call synced across all session participants via Liveblocks events
- Camera and mic toggles, screen sharing, participant list

### 💬 Real-Time Chat
- Room-scoped chat persisted in Liveblocks storage
- Read receipts — "Sent", "Read by N of M", "Read by all"
- Unread message badge on the chat toggle button

### 🐙 GitHub Integration
- Create a private GitHub repository directly from a session
- Commit selected files with a custom commit message
- View repository info and full sync operation history
- Requires the `repo` OAuth scope — prompted automatically on sign-in

### 🔒 Session Management
- Public and password-protected private sessions
- Shareable session link — join by entering the session ID
- Persistent session metadata stored in MongoDB
- Session owner can delete sessions; collaborators can leave

### ⏱️ Activity Timeline
- Per-file change log (create, modify, rename, delete) in the sidebar
- GitHub commit history alongside file-change events

### 🎨 Theming
- Light / Dark mode toggle, applied both to the UI and Monaco Editor
- Persists per-user within the session

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS + shadcn/ui + Framer Motion |
| **Database** | MongoDB via Mongoose |
| **Auth** | NextAuth.js — GitHub OAuth + Credentials |
| **Real-time** | Liveblocks (presence, storage, events) |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) |
| **Web Preview** | Sandpack (`@codesandbox/sandpack-react`) |
| **Code Execution** | Wandbox REST API |
| **Terminal** | xterm.js (`@xterm/xterm`) |
| **AI** | Google Gemini 1.5 Pro (`@google/generative-ai`) |
| **Video Calls** | ZegoCloud UIKit Prebuilt |
| **GitHub API** | Octokit REST (`@octokit/rest`) |
| **Deployment** | Vercel |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm (recommended) — `npm install -g pnpm`
- A MongoDB instance (local or [Atlas](https://www.mongodb.com/atlas))

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/code-collab.git
cd code-collab
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# MongoDB
MONGODB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/codecollab

# NextAuth
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth App (https://github.com/settings/developers)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Liveblocks (https://liveblocks.io/dashboard)
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_dev_xxxxxxxxxxxxxxxxxxxx

# Google Gemini AI (https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your-gemini-api-key

# ZegoCloud (https://console.zegocloud.com/)
NEXT_PUBLIC_ZEGO_APP_ID=123456789
NEXT_PUBLIC_ZEGO_SERVER_SECRET=your-zego-server-secret
```

### 4. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth handlers + signup endpoint
│   │   ├── chat/          # Gemini AI streaming endpoint
│   │   ├── execute/       # Wandbox code execution proxy
│   │   ├── github/        # Create repo + commit endpoints
│   │   └── sessions/      # Session CRUD + file management
│   ├── auth/              # Login / register pages
│   ├── editor/            # Dashboard + [sessionid] editor page
│   └── page.tsx           # Landing page
│
├── components/
│   ├── collab-editor/     # Core editor components
│   │   ├── editor.tsx           # Monaco editor + live cursors
│   │   ├── sidebar.tsx          # File tree + timeline
│   │   ├── toolbar.tsx          # Session controls
│   │   ├── chat-panel.tsx       # Real-time chat
│   │   ├── chat-interface.tsx   # AI assistant
│   │   ├── code-execution.tsx   # Run panel + terminal
│   │   ├── sandpack-preview.tsx # Web preview
│   │   └── video-call.tsx       # ZegoCloud wrapper
│   ├── editor/dashboard/  # Session dashboard UI
│   └── ui/                # shadcn/ui primitives
│
├── lib/
│   ├── auth-opt.ts        # NextAuth config
│   ├── github-sync.ts     # GitHub operation queue
│   └── monogdb.ts         # Mongoose connection
│
├── models/                # Mongoose schemas
│   ├── User.ts
│   ├── EditorSession.ts
│   ├── SyncOperation.ts
│   └── SyncQueue.ts
│
├── types/                 # Global type declarations
│   ├── next-auth.d.ts
│   └── types.d.ts
│
└── liveblocks.config.ts   # Presence + Storage type definitions
```

---

## Key Concepts

### Sessions

A **session** is the top-level collaboration unit. Each session has:
- A unique `roomId` used as both the URL slug and the Liveblocks room identifier
- A list of **participants** with roles (`owner` or `collaborator`)
- Optional **password protection** for private sessions
- Optional linked **GitHub repository**

### Liveblocks Storage Schema

```ts
type Storage = {
  document:       LiveObject<{ content: string }>
  files:          LiveMap<string, FileData>       // key = file path
  messages:       LiveList<Message>
  timeline:       LiveList<TimelineEntry>
  roomSettings:   LiveObject<RoomSettings>
  executionResults: LiveMap<string, ExecutionResult>
}
```

### Code Execution Flow

```
User clicks Run
    │
    ▼
Language detected from file extension
    │
    ├─ Web (HTML/JSX/TSX/Vue/Svelte) ──► Sandpack in-browser bundler
    │
    └─ Server-side ──► POST /api/execute ──► Wandbox API ──► stdout/stderr
```

---

## Supported Languages

| Language | Execution | Live Preview |
|---|---|---|
| HTML / CSS / JS | ✅ | ✅ Sandpack |
| React (JSX/TSX) | ✅ | ✅ Sandpack |
| Vue | ✅ | ✅ Sandpack |
| Svelte | ✅ | ✅ Sandpack |
| Python | ✅ Wandbox | — |
| TypeScript (Node) | ✅ Wandbox | — |
| JavaScript (Node) | ✅ Wandbox | — |
| Java | ✅ Wandbox | — |
| C / C++ | ✅ Wandbox | — |
| C# | ✅ Wandbox | — |
| Go | ✅ Wandbox | — |
| Ruby | ✅ Wandbox | — |
| Rust | ✅ Wandbox | — |
| PHP | ✅ Wandbox | — |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URL` | ✅ | MongoDB connection string |
| `NEXTAUTH_SECRET` | ✅ | Random string for JWT signing |
| `NEXTAUTH_URL` | ✅ | Base URL of your deployment |
| `GITHUB_CLIENT_ID` | ✅ | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | ✅ | GitHub OAuth App client secret |
| `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` | ✅ | Liveblocks public API key |
| `GEMINI_API_KEY` | ✅ | Google Generative AI key |
| `NEXT_PUBLIC_ZEGO_APP_ID` | ✅ | ZegoCloud App ID |
| `NEXT_PUBLIC_ZEGO_SERVER_SECRET` | ✅ | ZegoCloud server secret |

---

## Deployment

The project is pre-configured for **Vercel**.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Add all environment variables listed above in your Vercel project settings under **Settings → Environment Variables**.

> **Note:** For GitHub OAuth, set your GitHub App's callback URL to `https://your-domain.vercel.app/api/auth/callback/github`.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

This project is for educational and demonstration purposes. See individual dependency licences for third-party terms.

---

## Acknowledgements

- [Liveblocks](https://liveblocks.io/) — real-time collaboration infrastructure
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — the VS Code editor engine
- [Sandpack](https://sandpack.codesandbox.io/) — in-browser code bundler by CodeSandbox
- [ZegoCloud](https://www.zegocloud.com/) — video call SDK
- [Wandbox](https://wandbox.org/) — online compiler API
- [shadcn/ui](https://ui.shadcn.com/) — accessible component primitives

---

<div align="center">

Built by **Team BitMasters**

[🌐 Live Demo](https://code-collab-self.vercel.app/)

</div>
