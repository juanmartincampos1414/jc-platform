import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function WorkspaceRedirect() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data } = await supabase
    .from("workspace_users")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (data?.workspace_id) redirect(`/workspace/${data.workspace_id}`)
  redirect("/login")
}
