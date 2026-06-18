"use client"

import { useState } from "react"
import { Shield, UserPlus, Trash2, ChevronDown } from "lucide-react"
import { toast } from "sonner"

type PermLevel = "none" | "view" | "comment" | "approve" | "edit"
type Section = "legales" | "social_media" | "ads" | "influencers" | "webs" | "extras" | "admin"

const SECTIONS: { key: Section; label: string }[] = [
  { key: "legales", label: "Legales" },
  { key: "social_media", label: "Social Media" },
  { key: "ads", label: "Ads" },
  { key: "influencers", label: "Influencers" },
  { key: "webs", label: "Webs" },
  { key: "extras", label: "Extras" },
  { key: "admin", label: "Facturación" },
]

const PERM_LEVELS: { value: PermLevel; label: string; color: string }[] = [
  { value: "none", label: "Sin acceso", color: "text-gray-300" },
  { value: "view", label: "Ver", color: "text-blue-500" },
  { value: "comment", label: "Comentar", color: "text-amber-500" },
  { value: "approve", label: "Aprobar", color: "text-green-500" },
  { value: "edit", label: "Editar", color: "text-purple-500" },
]

interface TeamMember {
  id: string
  name: string
  email: string
  role: "client_admin" | "client_user"
  permissions: Record<Section, PermLevel>
}

const DEFAULT_PERMS: Record<Section, PermLevel> = {
  legales: "view", social_media: "view", ads: "view",
  influencers: "none", webs: "none", extras: "none", admin: "none"
}

const MOCK_TEAM: TeamMember[] = [
  {
    id: "1", name: "María García", email: "maria@empresa.com", role: "client_admin",
    permissions: { legales: "edit", social_media: "approve", ads: "view", influencers: "approve", webs: "view", extras: "view", admin: "view" }
  },
  {
    id: "2", name: "Carlos López", email: "carlos@empresa.com", role: "client_user",
    permissions: { legales: "view", social_media: "comment", ads: "view", influencers: "none", webs: "none", extras: "none", admin: "none" }
  },
  {
    id: "3", name: "Ana Torres", email: "ana@empresa.com", role: "client_user",
    permissions: { legales: "none", social_media: "approve", ads: "none", influencers: "approve", webs: "none", extras: "none", admin: "none" }
  },
]

function PermSelect({ value, onChange }: { value: PermLevel; onChange: (v: PermLevel) => void }) {
  const current = PERM_LEVELS.find(p => p.value === value)!
  return (
    <div className="relative group">
      <select
        value={value}
        onChange={e => onChange(e.target.value as PermLevel)}
        className={`text-xs font-bold border border-gray-100 rounded-lg px-2 py-1 pr-6 appearance-none bg-white cursor-pointer outline-none focus:border-[#FFE600] transition ${current.color}`}
      >
        {PERM_LEVELS.map(p => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}

export default function EquipoPage() {
  const [team, setTeam] = useState<TeamMember[]>(MOCK_TEAM)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")

  function updatePerm(userId: string, section: Section, level: PermLevel) {
    setTeam(prev => prev.map(m => m.id === userId
      ? { ...m, permissions: { ...m.permissions, [section]: level } }
      : m
    ))
  }

  function handleInvite() {
    if (!inviteEmail || !inviteName) { toast.error("Completá nombre y email"); return }
    const newMember: TeamMember = {
      id: Date.now().toString(), name: inviteName, email: inviteEmail,
      role: "client_user", permissions: { ...DEFAULT_PERMS }
    }
    setTeam(prev => [...prev, newMember])
    setInviteEmail(""); setInviteName(""); setShowInvite(false)
    toast.success(`Invitación enviada a ${inviteEmail}`)
  }

  function removeMember(id: string) {
    setTeam(prev => prev.filter(m => m.id !== id))
    toast.success("Usuario eliminado")
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-gray-400 font-medium mb-1">Configuración</p>
          <h1 className="text-2xl font-black text-[#0A0A0A]">Equipo & Permisos</h1>
          <p className="text-gray-400 text-sm mt-1">Controlá quién tiene acceso a cada sección de tu workspace.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 bg-[#0A0A0A] text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-black transition"
        >
          <UserPlus size={15} /> Invitar usuario
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide w-full mb-1">Niveles de permiso</p>
        {PERM_LEVELS.map(p => (
          <div key={p.value} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full bg-current ${p.color}`} />
            <span className={`text-xs font-medium ${p.color}`}>{p.label}</span>
          </div>
        ))}
      </div>

      {/* Team table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[200px_1fr] border-b border-gray-100">
          <div className="px-5 py-3 border-r border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Usuario</p>
          </div>
          <div className="grid grid-cols-7 divide-x divide-gray-50">
            {SECTIONS.map(s => (
              <div key={s.key} className="px-2 py-3 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Member rows */}
        {team.map(member => (
          <div key={member.id} className="grid grid-cols-[200px_1fr] border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition group">
            <div className="px-5 py-4 border-r border-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0A0A0A] flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-black">{member.name.slice(0,2).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-[#0A0A0A] truncate">{member.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{member.email}</p>
                  <span className={`text-[9px] font-bold ${member.role === "client_admin" ? "text-[#FFE600]" : "text-gray-400"}`}>
                    {member.role === "client_admin" ? "ADMIN" : "USER"}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-7 divide-x divide-gray-50">
              {SECTIONS.map(s => (
                <div key={s.key} className="flex items-center justify-center px-2 py-4">
                  {member.role === "client_admin" ? (
                    <span className="text-[10px] font-bold text-[#FFE600]">FULL</span>
                  ) : (
                    <PermSelect value={member.permissions[s.key]} onChange={v => updatePerm(member.id, s.key, v)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions per member */}
      <div className="mt-4 space-y-2">
        {team.filter(m => m.role !== "client_admin").map(m => (
          <div key={m.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
            <span className="text-sm text-gray-600">{m.name} — {m.email}</span>
            <button onClick={() => removeMember(m.id)} className="text-gray-300 hover:text-red-500 transition">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#FFE600] flex items-center justify-center">
                <UserPlus size={18} className="text-[#0A0A0A]" />
              </div>
              <div>
                <h3 className="font-black text-[#0A0A0A]">Invitar usuario</h3>
                <p className="text-xs text-gray-400">Recibirá un email de acceso</p>
              </div>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Nombre completo</label>
                <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Juan García" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#FFE600] transition" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Email</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="juan@empresa.com" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#FFE600] transition" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowInvite(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={handleInvite} className="flex-1 bg-[#0A0A0A] text-white rounded-xl py-2.5 text-sm font-bold hover:bg-black transition">Invitar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
