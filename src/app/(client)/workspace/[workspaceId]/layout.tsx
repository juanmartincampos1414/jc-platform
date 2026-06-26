import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Sidebar from "@/components/layout/Sidebar"
import type { ServiceModule, SocialNetwork } from "@/lib/types"

const FALLBACK_WORKSPACE = {
  name: "Mi Workspace",
  activeServices: ["legales", "social_media", "ads", "influencers", "webs", "extras"] as ServiceModule[],
  activeNetworks: ["instagram", "facebook", "tiktok", "google"] as SocialNetwork[],
}

async function getWorkspace(id: string) {
  if (DEMO_MODE) return { id, ...FALLBACK_WORKSPACE }
  const supabase = await createClient()
  const { data } = await supabase
    .from("workspaces")
    .select("name, active_services, active_networks")
    .eq("id", id)
    .single()
  if (!data) return { id, ...FALLBACK_WORKSPACE }
  return {
    id,
    name: data.name,
    activeServices: (data.active_services ?? FALLBACK_WORKSPACE.activeServices) as ServiceModule[],
    activeNetworks: (data.active_networks ?? FALLBACK_WORKSPACE.activeNetworks) as SocialNetwork[],
  }
}

const DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http')

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params

  if (!DEMO_MODE && workspaceId !== "ws-1") {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")
  }
  const workspace = await getWorkspace(workspaceId)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9F9F9]">
      <Sidebar
        workspaceId={workspaceId}
        workspaceName={workspace.name}
        activeServices={workspace.activeServices}
        activeNetworks={workspace.activeNetworks}
        isJcAdmin={false}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
