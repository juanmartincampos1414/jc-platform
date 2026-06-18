"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error("Email o contraseña incorrectos")
      setLoading(false)
      return
    }
    router.push("/workspace")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-[#0A0A0A] border-r border-white/10">
        <Image src="/jc-logo-white.png" alt="JC AIgency" width={140} height={80} className="object-contain object-left" />
        <div>
          <h1 className="text-5xl font-black text-white leading-tight mb-4">
            Tu agencia.<br />
            <span className="text-[#FFE600]">En tiempo real.</span>
          </h1>
          <p className="text-white/50 text-lg max-w-sm leading-relaxed">
            Gestioná creatividades, aprobá contenido, seguí tus ads y firmá documentos — todo desde un solo lugar.
          </p>
        </div>
        <div className="flex gap-4 text-white/30 text-sm">
          <span>© 2025 JC AIgency</span>
          <span>·</span>
          <span>Plataforma colaborativa</span>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 flex justify-center">
            <Image src="/jc-logo-white.png" alt="JC AIgency" width={100} height={60} className="object-contain" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-white mb-1">Ingresar</h2>
            <p className="text-white/40 text-sm">Accedé a tu workspace de JC AIgency</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                required
                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#FFE600] focus:ring-1 focus:ring-[#FFE600] transition"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-lg px-4 py-3 pr-11 text-sm outline-none focus:border-[#FFE600] focus:ring-1 focus:ring-[#FFE600] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <a href="/forgot-password" className="text-xs text-white/40 hover:text-[#FFE600] transition">
                Olvidé mi contraseña
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFE600] text-[#0A0A0A] font-bold rounded-lg py-3 text-sm hover:bg-[#FFE600]/90 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="mt-8 text-center text-white/20 text-xs">
            ¿No tenés acceso? Contactá a tu equipo de JC AIgency
          </p>
        </div>
      </div>
    </div>
  )
}
