import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Image from "next/image"
import Link from "next/link"
import { LayoutDashboard, Users, Plus, LogOut } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Verify jc_admin role
  const { data: wsUser } = await supabase
    .from("workspace_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "jc_admin")
    .single()

  if (!wsUser) redirect("/workspace")

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9F9F9]">
      <aside className="w-56 bg-[#0A0A0A] flex flex-col border-r border-white/5 shrink-0">
        <div className="px-5 py-6 border-b border-white/5">
          <Image src="/jc-logo-white.png" alt="JC AIgency" width={80} height={46} className="object-contain object-left" />
          <span className="text-[#FFE600] text-[9px] font-black uppercase tracking-widest mt-1 block">Admin Panel</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {[
            { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
            { label: "Clientes", href: "/admin/clientes", icon: Users },
            { label: "Nuevo cliente", href: "/admin/nuevo-cliente", icon: Plus },
          ].map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition">
              <item.icon size={15} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 pb-4 border-t border-white/5 pt-3 space-y-1">
          <div className="px-3 py-2">
            <p className="text-white/60 text-xs font-medium truncate">{user.email}</p>
            <p className="text-[#FFE600] text-[9px] font-black uppercase tracking-widest">JC Admin</p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/30 hover:text-white hover:bg-white/5 transition">
              <LogOut size={15} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
