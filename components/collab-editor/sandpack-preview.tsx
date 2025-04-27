"use client"

import { useEffect, useState } from "react"
import {
  SandpackProvider,
  SandpackPreview as SandpackPreviewComponent,
  SandpackConsole,
  SandpackLayout,
} from "@codesandbox/sandpack-react"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

interface SandpackPreviewProps {
  language: string
  code: string
}

export function SandpackPreview({ language, code }: SandpackPreviewProps) {
  const [files, setFiles] = useState<Record<string, { code: string }>>({})
  const [isHtmlOnly, setIsHtmlOnly] = useState(false)

  useEffect(() => {
    // Check if the code is pure HTML
    const isPureHtml =
      code.trim().startsWith("<!DOCTYPE html>") ||
      code.trim().startsWith("<html>") ||
      !!code.trim().match(/<html\s[^>]*>/i)

    setIsHtmlOnly(isPureHtml)

    // Set up the files based on the language and code content
    if (language === "html" || isPureHtml) {
      // For HTML, just use the code directly
      setFiles({
        "/index.html": {
          code: code,
        },
      })
    } else if (language === "react") {
      // React setup code remains the same
      setFiles({
        "/App.js": {
          code,
        },
        "/index.js": {
          code: `
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
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
      })
    } else if (language === "vue") {
      // Vue setup code remains the same
      setFiles({
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
      })
    } else if (language === "svelte") {
      // Svelte setup code remains the same
      setFiles({
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
      })
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

      setFiles(jsFiles)
    }
  }, [language, code])

  // Get the template based on the language
  const getTemplate = () => {
    if (isHtmlOnly) {
      return "static" // Use static template for pure HTML
    }

    switch (language) {
      case "react":
        return "react"
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
          recompileMode: "delayed",
          recompileDelay: 500,
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
