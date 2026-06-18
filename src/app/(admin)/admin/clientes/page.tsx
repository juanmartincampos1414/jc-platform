import Link from "next/link"
import { ArrowRight, Plus } from "lucide-react"

const MOCK_CLIENTS = [
  { id: "ws-1", name: "Empresa A", adminEmail: "maria@empresa-a.com", services: ["Social Media", "Ads"], fee: 250000, invoiceStatus: "sent", networks: ["instagram","facebook","google"] },
  { id: "ws-2", name: "Empresa B", adminEmail: "carlos@empresa-b.com", services: ["Influencers", "Social Media"], fee: 180000, invoiceStatus: "overdue", networks: ["instagram","tiktok"] },
  { id: "ws-3", name: "Empresa C", adminEmail: "ana@empresa-c.com", services: ["Ads", "Webs"], fee: 320000, invoiceStatus: "paid", networks: ["google","instagram","facebook"] },
]

const INV = { paid: "Pagado", sent: "Enviada", pending: "Pendiente", overdue: "Vencida" } as Record<string, string>
const INV_C = { paid: "bg-green-100 text-green-700", sent: "bg-amber-100 text-amber-700", pending: "bg-gray-100 text-gray-600", overdue: "bg-red-100 text-red-700" } as Record<string, string>

function formatARS(n: number) { return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }) }

export default function ClientesPage() {
  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-[#FFE600] font-bold mb-1">Admin</p>
          <h1 className="text-2xl font-black text-[#0A0A0A]">Clientes</h1>
        </div>
        <Link href="/admin/nuevo-cliente" className="flex items-center gap-2 bg-[#FFE600] text-[#0A0A0A] font-bold rounded-xl px-4 py-2.5 text-sm hover:bg-[#FFE600]/80 transition">
          <Plus size={15} /> Nuevo cliente
        </Link>
      </div>
      <div className="space-y-3">
        {MOCK_CLIENTS.map(c => (
          <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] flex items-center justify-center shrink-0">
              <span className="text-white font-black text-xs">{c.name.slice(0,2).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-[#0A0A0A] text-sm">{c.name}</p>
              <p className="text-xs text-gray-400">{c.adminEmail}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {c.services.map(s => (
                  <span key={s} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{s}</span>
                ))}
                {c.networks.map(n => (
                  <span key={n} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFE600]/10 text-[#0A0A0A]">{n}</span>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-black text-sm text-[#0A0A0A]">{formatARS(c.fee)}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${INV_C[c.invoiceStatus]}`}>{INV[c.invoiceStatus]}</span>
            </div>
            <Link href={`/workspace/${c.id}`} className="text-gray-300 hover:text-[#0A0A0A] transition shrink-0">
              <ArrowRight size={16} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
