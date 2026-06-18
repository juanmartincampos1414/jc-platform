import { redirect } from "next/navigation"

// Redirects to the first workspace — in production, fetch from Supabase
export default function WorkspaceRedirect() {
  redirect("/workspace/ws-1")
}
