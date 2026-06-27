"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  // Supabase sends the user back with a session in the URL hash — the client picks it up automatically
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Session is active, user can now set a new password
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: supabaseError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (supabaseError) {
      setError("Error al cambiar la contraseña. El link puede haber expirado — pedí uno nuevo.")
      return
    }

    setDone(true)
    setTimeout(() => router.push("/login"), 2500)
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="w-10 h-10 bg-[#FFE600] rounded-xl flex items-center justify-center mb-6">
            <span className="font-black text-sm text-[#0A0A0A]">JC</span>
          </div>

          {done ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <h1 className="text-xl font-black text-[#0A0A0A] mb-2">Contraseña actualizada</h1>
              <p className="text-sm text-gray-500">Te estamos redirigiendo al login...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-black text-[#0A0A0A] mb-1">Nueva contraseña</h1>
                <p className="text-sm text-gray-500">Elegí una contraseña segura de al menos 8 caracteres.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0A0A0A] mb-2 uppercase tracking-wide">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm text-[#0A0A0A] outline-none focus:border-[#FFE600] transition"
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A0A0A] mb-2 uppercase tracking-wide">Confirmar contraseña</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-[#0A0A0A] outline-none focus:border-[#FFE600] transition"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-xs rounded-xl px-4 py-3 font-medium">{error}</div>
                )}

                <button type="submit" disabled={loading || !password || !confirm}
                  className="w-full bg-[#0A0A0A] text-white font-bold rounded-xl py-3 text-sm hover:bg-black transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "Actualizando..." : "Cambiar contraseña"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
