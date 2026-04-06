"use client"

import { useEffect, useState } from "react"
import {
  SandpackProvider,
  SandpackPreview as SandpackPreviewComponent,
  SandpackConsole,
  SandpackLayout,
} from "@codesandbox/sandpack-react"

interface SandpackPreviewProps {
  language: string
  code: string
  workspaceFiles?: Record<string, string>
  activeFilePath?: string
}

const DEFAULT_STATIC_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Preview</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <main id="app" class="preview-shell">
    <h1>Live Preview</h1>
    <p>Update your HTML or CSS file to see changes here.</p>
    <button class="preview-button">Interactive Button</button>
  </main>
  <script src="/index.js"></script>
</body>
</html>`

const DEFAULT_STATIC_CSS = `body {
  font-family: sans-serif;
  margin: 0;
  padding: 24px;
  background: #111827;
  color: #f9fafb;
}

.preview-shell {
  max-width: 720px;
}

.preview-button {
  border: 0;
  border-radius: 999px;
  padding: 10px 16px;
  background: #22c55e;
  color: #052e16;
  font-weight: 700;
}`

const DEFAULT_STATIC_JS = `document.getElementById("app")?.insertAdjacentHTML(
  "beforeend",
  "<p>JavaScript preview is ready.</p>"
)`

export function SandpackPreview({
  language,
  code,
  workspaceFiles,
  activeFilePath,
}: SandpackPreviewProps) {
  const [files, setFiles] = useState<Record<string, { code: string }>>({})
  const [isHtmlOnly, setIsHtmlOnly] = useState(false)
  const normalizedActiveFilePath = activeFilePath
    ? activeFilePath.startsWith("/") ? activeFilePath : `/${activeFilePath}`
    : ""
  const activeExtension = normalizedActiveFilePath.split(".").pop()?.toLowerCase()
  const isCssFile = activeExtension === "css"
  const isReactTypescriptFile = language === "react" && activeExtension === "tsx"

  useEffect(() => {
    const normalizedWorkspaceFiles = Object.fromEntries(
      Object.entries(workspaceFiles || {}).map(([path, fileCode]) => [
        path.startsWith("/") ? path : `/${path}`,
        fileCode,
      ])
    )

    // Check if the code is pure HTML
    const isPureHtml =
      code.trim().startsWith("<!DOCTYPE html>") ||
      code.trim().startsWith("<html>") ||
      !!code.trim().match(/<html\s[^>]*>/i)

    setIsHtmlOnly(isPureHtml)

    // Set up the files based on the language and code content
    if (language === "html" || isPureHtml) {
      const staticFiles: Record<string, { code: string }> = {
        "/index.html": {
          code: isCssFile
            ? normalizedWorkspaceFiles["/index.html"] || DEFAULT_STATIC_HTML
            : code || normalizedWorkspaceFiles["/index.html"] || DEFAULT_STATIC_HTML,
        },
        "/styles.css": {
          code: isCssFile
            ? code
            : normalizedWorkspaceFiles["/styles.css"] || DEFAULT_STATIC_CSS,
        },
        "/index.js": {
          code: normalizedWorkspaceFiles["/index.js"] || DEFAULT_STATIC_JS,
        },
      }

      Object.entries(normalizedWorkspaceFiles).forEach(([path, fileCode]) => {
        staticFiles[path] = { code: fileCode }
      })

      if (isCssFile) {
        staticFiles["/styles.css"] = { code }
      } else {
        staticFiles["/index.html"] = { code }
      }

      setFiles(staticFiles)
    } else if (language === "react") {
      const appPath = isReactTypescriptFile ? "/App.tsx" : "/App.js"
      const entryPath = isReactTypescriptFile ? "/index.tsx" : "/index.js"
      const reactFiles: Record<string, { code: string }> = {
        [appPath]: {
          code,
        },
        [entryPath]: {
          code: isReactTypescriptFile
            ? `
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
            `
            : `
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
            `,
        },
        "/index.html": {
          code: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>React Preview</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
          `,
        },
      }

      Object.entries(normalizedWorkspaceFiles).forEach(([path, fileCode]) => {
        reactFiles[path] = { code: fileCode }
      })

      reactFiles[appPath] = { code }
      setFiles(reactFiles)
    } else if (language === "vue") {
      // Vue setup code remains the same
      const vueFiles: Record<string, { code: string }> = {
        "/App.vue": {
          code,
        },
        "/main.js": {
          code: `
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
          `,
        },
        "/index.html": {
          code: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Vue Preview</title>
</head>
<body>
  <div id="app"></div>
</body>
</html>
          `,
        },
      }

      Object.entries(normalizedWorkspaceFiles).forEach(([path, fileCode]) => {
        vueFiles[path] = { code: fileCode }
      })

      vueFiles["/App.vue"] = { code }
      setFiles(vueFiles)
    } else if (language === "svelte") {
      // Svelte setup code remains the same
      const svelteFiles: Record<string, { code: string }> = {
        "/App.svelte": {
          code,
        },
        "/main.js": {
          code: `
import App from "./App.svelte";

const app = new App({
  target: document.body
});

export default app;
          `,
        },
        "/index.html": {
          code: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Svelte Preview</title>
</head>
<body>
</body>
</html>
          `,
        },
      }

      Object.entries(normalizedWorkspaceFiles).forEach(([path, fileCode]) => {
        svelteFiles[path] = { code: fileCode }
      })

      svelteFiles["/App.svelte"] = { code }
      setFiles(svelteFiles)
    } else {
      // Default to vanilla JavaScript with app div
      const jsFiles: Record<string, { code: string }> = {
        "/index.html": {
          code: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Preview</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app"></div>
  <script src="index.js"></script>
</body>
</html>
          `,
        },
        "/styles.css": {
          code: `
/* Default CSS styles */
body {
  font-family: sans-serif;
  margin: 0;
  padding: 1rem;
}
          `,
        },
      }

      // Only add JavaScript file if we're not in HTML-only mode
      if (!isPureHtml) {
        jsFiles["/index.js"] = {
          code:
            code ||
            `
// Default JavaScript code
document.getElementById("app").innerHTML = \`
  <h1>Hello world</h1>
\`;
          `,
        }
      }

      // Finally, if workspaceFiles are provided, layer them on top dynamically
      // so users have access to all their custom files across all templates.
      if (Object.keys(normalizedWorkspaceFiles).length > 0) {
        // Special handling depending on language base
        let baseFiles = jsFiles;
        if (language === 'html' || isPureHtml) {
          baseFiles = {
            "/index.html": { code: DEFAULT_STATIC_HTML },
            "/styles.css": { code: DEFAULT_STATIC_CSS },
            "/index.js": { code: DEFAULT_STATIC_JS },
          };
        } else if (language === 'react') {
            baseFiles = {
              [isReactTypescriptFile ? "/App.tsx" : "/App.js"]: { code },
              [isReactTypescriptFile ? "/index.tsx" : "/index.js"]: {
                code: isReactTypescriptFile
                  ? `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\nReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<React.StrictMode><App /></React.StrictMode>);`
                  : `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\nReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);`,
              },
              "/index.html": { code: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>React Preview</title></head><body><div id="root"></div></body></html>` }
            };
        } else if (language === 'vue') {
            baseFiles = {
              "/App.vue": { code },
              "/main.js": { code: `import { createApp } from "vue";\nimport App from "./App.vue";\ncreateApp(App).mount("#app");` },
              "/index.html": { code: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Vue Preview</title></head><body><div id="app"></div></body></html>` }
            };
        } else if (language === 'svelte') {
            baseFiles = {
              "/App.svelte": { code },
              "/main.js": { code: `import App from "./App.svelte";\nconst app = new App({target: document.body});\nexport default app;` },
              "/index.html": { code: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Svelte Preview</title></head><body></body></html>` }
            };
        }

        // Apply all workspace files over top
        Object.entries(normalizedWorkspaceFiles).forEach(([normalizedPath, fileCode]) => {
          baseFiles[normalizedPath] = { code: fileCode };
        });

        // Ensure the active code is the entry/main view
        if (language === 'react') {
            baseFiles[isReactTypescriptFile ? '/App.tsx' : '/App.js'] = { code };
        } else if (language === 'vue') {
            baseFiles['/App.vue'] = { code };
        } else if (language === 'svelte') {
            baseFiles['/App.svelte'] = { code };
        } else if (language === 'html' || isPureHtml) {
            baseFiles[isCssFile ? '/styles.css' : '/index.html'] = { code };
        }

        setFiles(baseFiles);
      } else {
        setFiles(jsFiles);
      }

    }
  }, [
    activeFilePath,
    code,
    isCssFile,
    isReactTypescriptFile,
    language,
    workspaceFiles,
  ])

  // Get the template based on the language
  const getTemplate = () => {
    if (isHtmlOnly || language === "html") {
      return "static" // Use static template for pure HTML
    }

    switch (language) {
      case "react":
        return isReactTypescriptFile ? "react-ts" : "react"
      case "vue":
        return "vue"
      case "svelte":
        return "svelte"
      default:
        return "vanilla"
    }
  }

  return (
    <div className="h-full flex flex-col">
      <SandpackProvider
        template={getTemplate()}
        files={files}
        theme="dark"
        options={{
          recompileMode: "immediate",
        }}
      >
        <SandpackLayout className="h-full flex-1 !p-0 !m-0">
              <div className="h-full w-full">
                <SandpackPreviewComponent showNavigator={true} className="w-full h-full" />
              </div>
              <div className="h-full w-full">
                <SandpackConsole className="w-full h-full" />
              </div>
        </SandpackLayout>
      </SandpackProvider>
    </div>
  )
}
