import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Sidebar from "@/components/layout/Sidebar"
import type { ServiceModule, SocialNetwork } from "@/lib/types"

// Demo data — replace with real Supabase queries after DB setup
function getMockWorkspace(id: string) {
  return {
    id,
    name: "Cliente Demo",
    activeServices: ["legales", "social_media", "ads", "influencers", "webs", "extras"] as ServiceModule[],
    activeNetworks: ["instagram", "facebook", "tiktok", "google"] as SocialNetwork[],
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
  if (!DEMO_MODE) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")
  }

  const { workspaceId } = await params
  const workspace = getMockWorkspace(workspaceId)

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
