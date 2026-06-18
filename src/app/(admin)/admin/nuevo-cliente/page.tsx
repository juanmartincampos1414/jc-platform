"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { toast } from "sonner"

const SERVICES = [
  { key: "legales", label: "Legales", desc: "Firma digital de documentos" },
  { key: "social_media", label: "Social Media", desc: "Calendario y aprobaciones" },
  { key: "ads", label: "Ads", desc: "Campañas publicitarias" },
  { key: "influencers", label: "Influencers", desc: "Workflow completo" },
  { key: "webs", label: "Webs", desc: "Proyectos web" },
  { key: "extras", label: "Extras", desc: "Servicios adicionales" },
]

const NETWORKS = ["instagram", "facebook", "tiktok", "youtube", "google", "linkedin", "twitter", "spotify"]
const NET_LABELS: Record<string, string> = {
  instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", youtube: "YouTube",
  google: "Google", linkedin: "LinkedIn", twitter: "X (Twitter)", spotify: "Spotify"
}

export default function NuevoClientePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminName, setAdminName] = useState("")
  const [services, setServices] = useState<string[]>(["legales"])
  const [networks, setNetworks] = useState<string[]>(["instagram"])
  const [fee, setFee] = useState("")
  const [adsBudget, setAdsBudget] = useState("")
  const [loading, setLoading] = useState(false)

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !adminEmail || !adminName || services.length === 0) {
      toast.error("Completá todos los campos requeridos")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/admin/create-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, adminEmail, adminName, services, networks, fee, adsBudget }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al crear el cliente")
        return
      }
      toast.success(`✅ Workspace "${name}" creado. Invitación enviada a ${adminEmail}.`)
      router.push("/admin/clientes")
    } catch {
      toast.error("Error de conexión. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <p className="text-sm text-[#FFE600] font-bold mb-1">Admin</p>
        <h1 className="text-2xl font-black text-[#0A0A0A]">Nuevo Cliente</h1>
        <p className="text-gray-400 text-sm mt-1">Creá el workspace y configurá los servicios contratados.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <h2 className="font-black text-sm text-[#0A0A0A] uppercase tracking-wide">Información del cliente</h2>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Nombre de la empresa / marca *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Empresa SA" required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FFE600] transition" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">Nombre del admin *</label>
              <input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Juan García" required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FFE600] transition" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">Email del admin *</label>
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="juan@empresa.com" required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FFE600] transition" />
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-black text-sm text-[#0A0A0A] uppercase tracking-wide mb-4">Servicios contratados *</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SERVICES.map(s => {
              const active = services.includes(s.key)
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setServices(toggle(services, s.key))}
                  className={`flex flex-col items-start p-3 rounded-xl border-2 transition text-left ${active ? "border-[#FFE600] bg-[#FFE600]/5" : "border-gray-100 hover:border-gray-200"}`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {active && <Check size={11} className="text-[#0A0A0A]" />}
                    <span className="font-bold text-xs text-[#0A0A0A]">{s.label}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">{s.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Networks */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-black text-sm text-[#0A0A0A] uppercase tracking-wide mb-4">Redes sociales activas</h2>
          <div className="flex flex-wrap gap-2">
            {NETWORKS.map(n => {
              const active = networks.includes(n)
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNetworks(toggle(networks, n))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${active ? "border-[#FFE600] bg-[#FFE600]/5 text-[#0A0A0A]" : "border-gray-100 text-gray-400 hover:border-gray-200"}`}
                >
                  {active && <Check size={10} />}
                  {NET_LABELS[n]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Billing */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <h2 className="font-black text-sm text-[#0A0A0A] uppercase tracking-wide">Facturación</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">Fee mensual (ARS)</label>
              <input type="number" value={fee} onChange={e => setFee(e.target.value)} placeholder="250000" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FFE600] transition" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">Presupuesto ads mensual (ARS)</label>
              <input type="number" value={adsBudget} onChange={e => setAdsBudget(e.target.value)} placeholder="280000" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FFE600] transition" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-white transition">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="flex-1 bg-[#0A0A0A] text-white rounded-xl py-3 text-sm font-bold hover:bg-black transition disabled:opacity-50">
            {loading ? "Creando..." : "Crear workspace y enviar invitación"}
          </button>
        </div>
      </form>
    </div>
  )
}
