import Image from "next/image"
import Link from "next/link"
import { LayoutDashboard, Users, Plus, Settings } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F9F9F9]">
      {/* JC Admin sidebar */}
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
            { label: "Configuración", href: "/admin/config", icon: Settings },
          ].map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition">
              <item.icon size={15} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#FFE600] flex items-center justify-center">
              <span className="text-[#0A0A0A] text-[9px] font-black">JC</span>
            </div>
            <span className="text-white/40 text-xs">JC AIgency</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
