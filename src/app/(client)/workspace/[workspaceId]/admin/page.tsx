"use client"

import { useState } from "react"
import { CheckCircle, Clock, AlertCircle, FileText, TrendingUp, DollarSign } from "lucide-react"

type InvoiceStatus = "pending" | "sent" | "paid" | "overdue"

interface BillingRecord {
  id: string
  month: string
  monthlyFee?: number
  adsInvestmentApproved?: number
  adsInvestmentExecuted?: number
  invoiceStatus: InvoiceStatus
  invoiceDate?: string
  paymentDate?: string
  notes?: string
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; bg: string; text: string; icon: typeof CheckCircle }> = {
  pending: { label: "Pendiente", bg: "bg-gray-100", text: "text-gray-600", icon: Clock },
  sent: { label: "Enviada", bg: "bg-amber-100", text: "text-amber-700", icon: FileText },
  paid: { label: "Pagado", bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  overdue: { label: "Vencida", bg: "bg-red-100", text: "text-red-700", icon: AlertCircle },
}

const MOCK_BILLING: BillingRecord[] = [
  { id: "1", month: "Junio 2025", monthlyFee: 250000, adsInvestmentApproved: 280000, adsInvestmentExecuted: 179700, invoiceStatus: "sent", invoiceDate: "2025-06-01", notes: "Incluye setup de nueva campaña" },
  { id: "2", month: "Mayo 2025", monthlyFee: 250000, adsInvestmentApproved: 250000, adsInvestmentExecuted: 248300, invoiceStatus: "paid", invoiceDate: "2025-05-01", paymentDate: "2025-05-08" },
  { id: "3", month: "Abril 2025", monthlyFee: 200000, adsInvestmentApproved: 200000, adsInvestmentExecuted: 199100, invoiceStatus: "paid", invoiceDate: "2025-04-01", paymentDate: "2025-04-05" },
  { id: "4", month: "Marzo 2025", monthlyFee: 200000, adsInvestmentApproved: 180000, adsInvestmentExecuted: 178500, invoiceStatus: "paid", invoiceDate: "2025-03-01", paymentDate: "2025-03-10" },
]

function formatARS(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
}

export default function AdminPage() {
  const [records] = useState<BillingRecord[]>(MOCK_BILLING)
  const current = records[0]

  const totalFees = records.filter(r => r.invoiceStatus === "paid").reduce((a, r) => a + (r.monthlyFee ?? 0), 0)
  const totalAds = records.filter(r => r.invoiceStatus === "paid").reduce((a, r) => a + (r.adsInvestmentExecuted ?? 0), 0)

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <p className="text-sm text-gray-400 font-medium mb-1">Administración</p>
        <h1 className="text-2xl font-black text-[#0A0A0A]">Facturación y Finanzas</h1>
      </div>

      {/* Current month highlight */}
      {current && (
        <div className="bg-[#0A0A0A] rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/40 text-sm font-medium mb-0.5">Mes actual</p>
              <h2 className="font-black text-xl">{current.month}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_CONFIG[current.invoiceStatus].bg} ${STATUS_CONFIG[current.invoiceStatus].text}`}>
                {STATUS_CONFIG[current.invoiceStatus].label}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">Fee mensual</p>
              <p className="font-black text-lg text-[#FFE600]">{formatARS(current.monthlyFee ?? 0)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">Inversión aprobada en Ads</p>
              <p className="font-black text-lg text-white">{formatARS(current.adsInvestmentApproved ?? 0)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">Ejecutado hasta hoy</p>
              <p className="font-black text-lg text-white">{formatARS(current.adsInvestmentExecuted ?? 0)}</p>
              {current.adsInvestmentApproved && (
                <div className="w-full bg-white/10 rounded-full h-1 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-[#FFE600] rounded-full"
                    style={{ width: `${Math.min(100, Math.round(((current.adsInvestmentExecuted ?? 0) / current.adsInvestmentApproved) * 100))}%` }}
                  />
                </div>
              )}
            </div>
          </div>
          {current.notes && (
            <p className="text-white/30 text-xs mt-4 italic">{current.notes}</p>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total fees pagados (2025)", value: formatARS(totalFees), icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total ads ejecutados (2025)", value: formatARS(totalAds), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Meses activos", value: `${records.filter(r => r.invoiceStatus === "paid").length}`, icon: CheckCircle, color: "text-gray-600", bg: "bg-gray-50" },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-gray-100`}>
            <card.icon className={`${card.color} mb-2`} size={18} />
            <p className={`font-black text-xl ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">{card.label}</p>
          </div>
        ))}
      </div>

      {/* History table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-black text-sm text-[#0A0A0A]">Historial de facturación</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {records.map(record => {
            const st = STATUS_CONFIG[record.invoiceStatus]
            const Icon = st.icon
            return (
              <div key={record.id} className="px-5 py-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-bold text-sm text-[#0A0A0A]">{record.month}</p>
                    {record.invoiceDate && (
                      <p className="text-xs text-gray-400 mt-0.5">Factura emitida: {record.invoiceDate}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Fee</p>
                      <p className="font-bold text-sm text-[#0A0A0A]">{record.monthlyFee ? formatARS(record.monthlyFee) : "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Ads aprobados</p>
                      <p className="font-bold text-sm text-[#0A0A0A]">{record.adsInvestmentApproved ? formatARS(record.adsInvestmentApproved) : "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Ads ejecutados</p>
                      <p className="font-bold text-sm text-[#0A0A0A]">{record.adsInvestmentExecuted ? formatARS(record.adsInvestmentExecuted) : "—"}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
                        <Icon size={10} /> {st.label}
                      </span>
                    </div>
                    {record.paymentDate && (
                      <p className="text-xs text-gray-400">Pagado: {record.paymentDate}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
