"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (supabaseError) {
      setError("No pudimos procesar tu solicitud. Revisá el email e intentá de nuevo.")
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          {/* Logo */}
          <div className="w-10 h-10 bg-[#FFE600] rounded-xl flex items-center justify-center mb-6">
            <span className="font-black text-sm text-[#0A0A0A]">JC</span>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <h1 className="text-xl font-black text-[#0A0A0A] mb-2">Revisá tu email</h1>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Te enviamos un link para restablecer tu contraseña a <strong>{email}</strong>. Puede tardar unos minutos.
              </p>
              <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-[#0A0A0A] hover:text-gray-600 transition">
                <ArrowLeft size={14} /> Volver al login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-black text-[#0A0A0A] mb-1">Olvidé mi contraseña</h1>
                <p className="text-sm text-gray-500">Te enviamos un link por email para que puedas restablecerla.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0A0A0A] mb-2 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nombre@empresa.com"
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-[#0A0A0A] outline-none focus:border-[#FFE600] transition placeholder:text-gray-400"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-xs rounded-xl px-4 py-3 font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-[#0A0A0A] text-white font-bold rounded-xl py-3 text-sm hover:bg-black transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "Enviando..." : "Enviar link de recuperación"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition font-medium">
                  <ArrowLeft size={12} /> Volver al login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
