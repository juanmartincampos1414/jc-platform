"use client"

import { useState } from "react"
import { FileText, Download, CheckCircle, Clock, PenLine, X } from "lucide-react"
import { toast } from "sonner"

type DocStatus = "pending" | "signed"

interface Doc {
  id: string
  title: string
  description: string
  date: string
  status: DocStatus
  signedAt?: string
}

const MOCK_DOCS: Doc[] = [
  {
    id: "1",
    title: "Carta Oferta — Servicio Social Media Q3 2025",
    description: "Propuesta de servicios de manejo de redes sociales para el período Julio–Septiembre 2025.",
    date: "2025-06-10",
    status: "pending",
  },
  {
    id: "2",
    title: "Carta Oferta — Campaña Influencers Mayo 2025",
    description: "Propuesta aprobada para campaña de influencers de temporada.",
    date: "2025-05-01",
    status: "signed",
    signedAt: "2025-05-03",
  },
  {
    id: "3",
    title: "Carta Oferta — Setup inicial JC Platform",
    description: "Acuerdo de onboarding y configuración inicial de la plataforma.",
    date: "2025-04-01",
    status: "signed",
    signedAt: "2025-04-02",
  },
]

export default function LegalesPage() {
  const [docs, setDocs] = useState<Doc[]>(MOCK_DOCS)
  const [signing, setSigning] = useState<string | null>(null)
  const [signatureValue, setSignatureValue] = useState("")
  const [confirmModal, setConfirmModal] = useState<string | null>(null)

  function openSign(id: string) {
    setSigning(id)
    setSignatureValue("")
  }

  function handleSign(id: string) {
    if (!signatureValue.trim()) {
      toast.error("Escribí tu nombre completo para firmar")
      return
    }
    setDocs(prev => prev.map(d => d.id === id
      ? { ...d, status: "signed", signedAt: new Date().toLocaleDateString("es-AR") }
      : d
    ))
    setSigning(null)
    setConfirmModal(null)
    toast.success("Documento firmado correctamente")
  }

  const pendingDocs = docs.filter(d => d.status === "pending")
  const signedDocs = docs.filter(d => d.status === "signed")

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <p className="text-sm text-gray-400 font-medium mb-1">Legales</p>
        <h1 className="text-2xl font-black text-[#0A0A0A]">Documentos y Firma Digital</h1>
        <p className="text-gray-500 text-sm mt-1">Revisá y firmá los documentos enviados por JC AIgency.</p>
      </div>

      {/* Pending */}
      {pendingDocs.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className="text-amber-500" />
            <h2 className="font-bold text-sm text-[#0A0A0A]">Pendientes de firma</h2>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingDocs.length}</span>
          </div>
          <div className="space-y-3">
            {pendingDocs.map(doc => (
              <div key={doc.id} className="bg-white border-2 border-amber-200 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#0A0A0A] text-sm mb-1">{doc.title}</h3>
                    <p className="text-gray-500 text-xs mb-2 leading-relaxed">{doc.description}</p>
                    <p className="text-gray-400 text-xs">Enviado el {new Date(doc.date).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition">
                      <Download size={12} /> Ver PDF
                    </button>
                    <button
                      onClick={() => openSign(doc.id)}
                      className="flex items-center gap-1.5 text-xs bg-[#FFE600] text-[#0A0A0A] font-bold rounded-lg px-3 py-1.5 hover:bg-[#FFE600]/80 transition"
                    >
                      <PenLine size={12} /> Firmar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Signed */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={14} className="text-green-500" />
          <h2 className="font-bold text-sm text-[#0A0A0A]">Firmados</h2>
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{signedDocs.length}</span>
        </div>
        <div className="space-y-3">
          {signedDocs.map(doc => (
            <div key={doc.id} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle size={18} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#0A0A0A] text-sm mb-1">{doc.title}</h3>
                  <p className="text-gray-500 text-xs mb-2 leading-relaxed">{doc.description}</p>
                  <p className="text-gray-400 text-xs">Firmado el {doc.signedAt}</p>
                </div>
                <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition shrink-0">
                  <Download size={12} /> Descargar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sign modal */}
      {signing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-[#0A0A0A]">Firmar documento</h3>
              <button onClick={() => setSigning(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {docs.find(d => d.id === signing)?.title}
            </p>
            <div className="mb-4">
              <label className="text-sm font-bold text-[#0A0A0A] block mb-2">
                Escribí tu nombre completo para firmar
              </label>
              <input
                type="text"
                value={signatureValue}
                onChange={e => setSignatureValue(e.target.value)}
                placeholder="Nombre Apellido"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-medium text-[#0A0A0A] outline-none focus:border-[#FFE600] transition text-lg"
                style={{ fontFamily: "cursive" }}
              />
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-5">
              <p className="text-xs text-gray-500 leading-relaxed">
                Al firmar, confirmo que leí y acepto los términos del documento. Esta firma digital tiene validez legal.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSigning(null)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSign(signing)}
                className="flex-1 bg-[#0A0A0A] text-white rounded-xl py-2.5 text-sm font-bold hover:bg-black transition"
              >
                Confirmar firma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
