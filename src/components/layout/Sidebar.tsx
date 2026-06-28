"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  FileText, Calendar, TrendingUp, Users, Globe,
  Star, Settings, LogOut, ChevronDown, LayoutDashboard,
  CreditCard, Shield, Sparkles, Target
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { type ServiceModule, type SocialNetwork } from "@/lib/types"

const NETWORK_ICONS: Record<SocialNetwork, string> = {
  instagram: "IG",
  facebook: "FB",
  tiktok: "TK",
  youtube: "YT",
  google: "GO",
  linkedin: "LI",
  twitter: "TW",
  pinterest: "PI",
  spotify: "SP",
}

const NETWORK_COLORS: Record<SocialNetwork, string> = {
  instagram: "from-purple-500 to-pink-500",
  facebook: "from-blue-600 to-blue-700",
  tiktok: "from-gray-900 to-gray-700",
  youtube: "from-red-600 to-red-700",
  google: "from-blue-500 to-green-500",
  linkedin: "from-blue-700 to-blue-800",
  twitter: "from-sky-400 to-sky-500",
  pinterest: "from-red-500 to-red-600",
  spotify: "from-green-500 to-green-600",
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  service?: ServiceModule
}

interface SidebarProps {
  workspaceId: string
  workspaceName: string
  activeServices: ServiceModule[]
  activeNetworks: SocialNetwork[]
  isJcAdmin?: boolean
  userRole?: string
}

export default function Sidebar({
  workspaceId,
  workspaceName,
  activeServices,
  activeNetworks,
  isJcAdmin,
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const base = `/workspace/${workspaceId}`

  const navItems: NavItem[] = [
    { label: "Dashboard", href: base, icon: LayoutDashboard },
    { label: "Campaigns", href: `${base}/campaigns`, icon: Target },
    { label: "Legales", href: `${base}/legales`, icon: FileText, service: "legales" },
    { label: "Social Media", href: `${base}/social-media`, icon: Calendar, service: "social_media" },
    { label: "Ads", href: `${base}/ads`, icon: TrendingUp, service: "ads" },
    { label: "Influencers", href: `${base}/influencers`, icon: Users, service: "influencers" },
    { label: "Webs", href: `${base}/webs`, icon: Globe, service: "webs" },
    { label: "Extras", href: `${base}/extras`, icon: Star, service: "extras" },
  ]

  const filteredNav = navItems.filter(item =>
    !item.service || activeServices.includes(item.service)
  )

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside className="w-60 min-h-screen bg-[#0A0A0A] flex flex-col border-r border-white/5 shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/5">
        <Image src="/jc-logo-white.png" alt="JC AIgency" width={90} height={52} className="object-contain object-left" />
      </div>

      {/* Workspace selector */}
      <div className="px-4 py-3 border-b border-white/5">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition text-left group">
          <div className="w-7 h-7 rounded-md bg-[#FFE600] flex items-center justify-center shrink-0">
            <span className="text-[#0A0A0A] font-black text-xs">
              {workspaceName.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <span className="text-white text-sm font-semibold truncate flex-1">{workspaceName}</span>
          <ChevronDown size={14} className="text-white/30 group-hover:text-white/50 transition shrink-0" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {filteredNav.map(item => {
          const active = pathname === item.href || (item.href !== base && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
                active
                  ? "bg-[#FFE600] text-[#0A0A0A]"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={16} className={active ? "text-[#0A0A0A]" : ""} />
              {item.label}
            </Link>
          )
        })}

        {/* JClaude premium */}
        <div className="pt-3 mt-3 border-t border-white/5">
          <Link
            href={`${base}/jclaude`}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition relative",
              pathname.startsWith(`${base}/jclaude`)
                ? "bg-[#FFE600] text-[#0A0A0A]"
                : "text-[#FFE600]/70 hover:text-[#FFE600] hover:bg-[#FFE600]/5"
            )}
          >
            <Sparkles size={16} />
            JClaude
            <span className={cn(
              "ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full",
              pathname.startsWith(`${base}/jclaude`)
                ? "bg-[#0A0A0A]/20 text-[#0A0A0A]"
                : "bg-[#FFE600]/20 text-[#FFE600]"
            )}>AI</span>
          </Link>
        </div>

        {/* Admin sections */}
        <div className="pt-4 mt-4 border-t border-white/5">
          <p className="px-3 text-white/20 text-[10px] font-semibold uppercase tracking-widest mb-2">Admin</p>
          <Link
            href={`${base}/admin`}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
              pathname.startsWith(`${base}/admin`)
                ? "bg-[#FFE600] text-[#0A0A0A]"
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            <CreditCard size={16} />
            Facturación
          </Link>
          <Link
            href={`${base}/equipo`}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
              pathname.startsWith(`${base}/equipo`)
                ? "bg-[#FFE600] text-[#0A0A0A]"
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            <Shield size={16} />
            Equipo & Permisos
          </Link>
        </div>

        {/* JC Admin link */}
        {isJcAdmin && (
          <div className="pt-4 mt-4 border-t border-white/5">
            <p className="px-3 text-[#FFE600]/40 text-[10px] font-semibold uppercase tracking-widest mb-2">JC Interno</p>
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#FFE600]/60 hover:text-[#FFE600] hover:bg-[#FFE600]/5 transition"
            >
              <Settings size={16} />
              Admin Panel
            </Link>
          </div>
        )}
      </nav>

      {/* Networks */}
      {activeNetworks.length > 0 && (
        <div className="px-4 py-3 border-t border-white/5">
          <p className="text-white/20 text-[10px] font-semibold uppercase tracking-widest mb-2">Redes activas</p>
          <div className="flex flex-wrap gap-1.5">
            {activeNetworks.map(n => (
              <div
                key={n}
                className={cn("w-7 h-7 rounded-md bg-gradient-to-br flex items-center justify-center", NETWORK_COLORS[n])}
                title={n}
              >
                <span className="text-white text-[9px] font-black">{NETWORK_ICONS[n]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="px-3 pb-4 pt-2 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/30 hover:text-white hover:bg-white/5 transition"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
