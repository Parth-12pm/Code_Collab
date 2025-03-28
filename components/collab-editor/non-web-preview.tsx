"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

interface NonWebPreviewProps {
  result: any;
}

export function NonWebPreview({ result }: NonWebPreviewProps) {
  if (!result) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Run your code to see the results
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 font-mono text-sm">
        {result.run?.stdout && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold mb-1 text-muted-foreground">
              STDOUT:
            </h3>
            <pre className="bg-muted p-3 rounded-md overflow-x-auto">
              {result.run.stdout}
            </pre>
          </div>
        )}

        {result.run?.stderr && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold mb-1 text-destructive">
              STDERR:
            </h3>
            <pre className="bg-destructive/10 p-3 rounded-md overflow-x-auto text-destructive">
              {result.run.stderr}
            </pre>
          </div>
        )}

        {result.run?.output && !result.run.stdout && !result.run.stderr && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold mb-1 text-muted-foreground">
              OUTPUT:
            </h3>
            <pre className="bg-muted p-3 rounded-md overflow-x-auto">
              {result.run.output}
            </pre>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>Execution time: {result.run?.time || 0}ms</p>
          <p>Memory used: {Math.round((result.run?.memory || 0) / 1024)}KB</p>
          <p>Exit code: {result.run?.code || 0}</p>
        </div>
      </div>
    </ScrollArea>
  );
}
