import { SessionPage } from "@/components/editor/session/session-page"

export default async function EditorSessionPage({
  params,
}: {
  params: { sessionid: string }
}) {

  const sessionid = await params.sessionid;

  return <SessionPage sessionId={sessionid} />
}

