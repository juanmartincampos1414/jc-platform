import { Star, CheckCircle, Clock } from "lucide-react"

const MOCK_EXTRAS = [
  { id: "1", name: "Sesión de fotos producto", status: "completed", date: "2025-05-20", notes: "40 fotos entregadas. Ver carpeta de Drive compartida." },
  { id: "2", name: "Diseño de presentación corporativa", status: "in_progress", date: "2025-06-22", notes: "En proceso. JC contactará para revisión." },
  { id: "3", name: "Auditoría de redes sociales", status: "pending", date: "2025-07-01", notes: "Programada para julio." },
]

const STATUS: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  completed: { label: "Completado", icon: CheckCircle, color: "text-green-600" },
  in_progress: { label: "En progreso", icon: Clock, color: "text-amber-600" },
  pending: { label: "Pendiente", icon: Clock, color: "text-gray-400" },
}

export default function ExtrasPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <p className="text-sm text-gray-400 font-medium mb-1">Extras</p>
        <h1 className="text-2xl font-black text-[#0A0A0A]">Servicios Adicionales</h1>
      </div>
      <div className="space-y-4">
        {MOCK_EXTRAS.map(e => {
          const st = STATUS[e.status]
          const Icon = st.icon
          return (
            <div key={e.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#FFE600]/10 flex items-center justify-center shrink-0">
                <Star size={18} className="text-[#FFE600]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-[#0A0A0A] text-sm">{e.name}</h3>
                  <Icon size={12} className={st.color} />
                  <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
                </div>
                <p className="text-xs text-gray-400 mb-1">{e.notes}</p>
                <p className="text-xs text-gray-300">Fecha: {e.date}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
