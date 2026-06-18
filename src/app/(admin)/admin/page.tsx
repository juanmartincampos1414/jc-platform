import Link from "next/link"
import { Users, TrendingUp, FileText, AlertCircle, ArrowRight } from "lucide-react"

const MOCK_CLIENTS = [
  { id: "ws-1", name: "Empresa A", services: ["Social Media", "Ads"], pendingApprovals: 4, invoiceStatus: "sent", monthlyFee: 250000 },
  { id: "ws-2", name: "Empresa B", services: ["Influencers", "Social Media"], pendingApprovals: 2, invoiceStatus: "overdue", monthlyFee: 180000 },
  { id: "ws-3", name: "Empresa C", services: ["Ads", "Webs"], pendingApprovals: 0, invoiceStatus: "paid", monthlyFee: 320000 },
  { id: "ws-4", name: "Empresa D", services: ["Social Media"], pendingApprovals: 1, invoiceStatus: "pending", monthlyFee: 120000 },
]

const INV_COLORS: Record<string, string> = {
  paid: "text-green-700 bg-green-100",
  sent: "text-amber-700 bg-amber-100",
  pending: "text-gray-600 bg-gray-100",
  overdue: "text-red-700 bg-red-100",
}
const INV_LABELS: Record<string, string> = {
  paid: "Pagado", sent: "Enviada", pending: "Pendiente", overdue: "Vencida"
}

function formatARS(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
}

export default function AdminDashboard() {
  const totalPending = MOCK_CLIENTS.reduce((a, c) => a + c.pendingApprovals, 0)
  const totalFees = MOCK_CLIENTS.reduce((a, c) => a + c.monthlyFee, 0)
  const overdueCount = MOCK_CLIENTS.filter(c => c.invoiceStatus === "overdue").length

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <p className="text-sm text-[#FFE600] font-bold mb-1">JC AIgency</p>
        <h1 className="text-2xl font-black text-[#0A0A0A]">Admin Dashboard</h1>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Clientes activos", value: MOCK_CLIENTS.length.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Aprobaciones pendientes", value: totalPending.toString(), icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Fees mensuales totales", value: formatARS(totalFees), icon: TrendingUp, color: "text-green-700", bg: "bg-green-50" },
          { label: "Facturas vencidas", value: overdueCount.toString(), icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-gray-100`}>
            <card.icon className={`${card.color} mb-2`} size={18} />
            <p className={`font-black text-xl ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Clients table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-sm text-[#0A0A0A]">Clientes</h2>
          <Link href="/admin/nuevo-cliente" className="flex items-center gap-1.5 text-xs text-[#0A0A0A] font-bold border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
            + Nuevo cliente
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {MOCK_CLIENTS.map(client => (
            <div key={client.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition">
              <div className="w-9 h-9 rounded-xl bg-[#0A0A0A] flex items-center justify-center shrink-0">
                <span className="text-white font-black text-xs">{client.name.slice(0,2).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#0A0A0A]">{client.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {client.services.map(s => (
                    <span key={s} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500">{s}</span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm text-[#0A0A0A]">{formatARS(client.monthlyFee)}</p>
                <p className="text-xs text-gray-400">fee mensual</p>
              </div>
              {client.pendingApprovals > 0 && (
                <div className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full shrink-0">
                  {client.pendingApprovals} pendientes
                </div>
              )}
              <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${INV_COLORS[client.invoiceStatus]}`}>
                {INV_LABELS[client.invoiceStatus]}
              </span>
              <Link href={`/workspace/${client.id}`} className="text-gray-300 hover:text-[#0A0A0A] transition shrink-0">
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
