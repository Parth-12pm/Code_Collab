export function getInitialFileContent(fileName: string, fileType: string) {
  switch (fileType) {
    case "js":
      return `console.log("Hello from ${fileName}");\n`;
    case "ts":
      return `const message: string = "Hello from ${fileName}";\nconsole.log(message);\n`;
    case "jsx":
      return `export default function App() {\n  return (\n    <main style={{ padding: "24px", fontFamily: "sans-serif" }}>\n      <h1>Hello from ${fileName}</h1>\n      <p>Your React preview is working.</p>\n    </main>\n  );\n}\n`;
    case "tsx":
      return `export default function App(): JSX.Element {\n  return (\n    <main style={{ padding: "24px", fontFamily: "sans-serif" }}>\n      <h1>Hello from ${fileName}</h1>\n      <p>Your React TypeScript preview is working.</p>\n    </main>\n  );\n}\n`;
    case "html":
      return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${fileName}</title>\n</head>\n<body>\n  <main>\n    <h1>Hello from ${fileName}</h1>\n    <p>Your HTML preview is working.</p>\n  </main>\n</body>\n</html>\n`;
    case "css":
      return `body {\n  margin: 0;\n  padding: 24px;\n  font-family: sans-serif;\n  background: #0f172a;\n  color: #f8fafc;\n}\n\nh1 {\n  margin: 0 0 12px;\n}\n`;
    case "json":
      return `{\n  "file": "${fileName}",\n  "status": "ready"\n}\n`;
    case "md":
      return `# ${fileName}\n\nYour markdown file is ready.\n`;
    case "py":
      return `print("Hello from ${fileName}")\n`;
    case "txt":
      return `Hello from ${fileName}\n`;
    default:
      return "";
  }
}
