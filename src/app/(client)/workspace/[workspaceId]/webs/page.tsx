import { Globe, ExternalLink, Clock } from "lucide-react"

const MOCK_PROJECTS = [
  { id: "1", name: "Sitio Web Corporativo", url: "https://tuempresa.com", status: "live", lastUpdate: "2025-05-15", notes: "Rediseño completado. Mantenimiento mensual activo." },
  { id: "2", name: "Landing Page Campaña Verano", url: "", status: "in_progress", lastUpdate: "2025-06-10", notes: "En desarrollo. Entrega estimada 25 de junio." },
]

const STATUS: Record<string, { label: string; bg: string; text: string }> = {
  live: { label: "En vivo", bg: "bg-green-100", text: "text-green-700" },
  in_progress: { label: "En desarrollo", bg: "bg-amber-100", text: "text-amber-700" },
  paused: { label: "Pausado", bg: "bg-gray-100", text: "text-gray-600" },
}

export default function WebsPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <p className="text-sm text-gray-400 font-medium mb-1">Webs</p>
        <h1 className="text-2xl font-black text-[#0A0A0A]">Proyectos Web</h1>
      </div>
      <div className="space-y-4">
        {MOCK_PROJECTS.map(p => {
          const st = STATUS[p.status]
          return (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <Globe size={18} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-black text-[#0A0A0A] text-sm">{p.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{p.notes}</p>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={10} /> Actualizado: {p.lastUpdate}</span>
                    {p.url && (
                      <a href={p.url} target="_blank" className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition">
                        <ExternalLink size={10} /> Ver sitio
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
