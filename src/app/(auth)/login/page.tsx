"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react"

type Mode = "platform" | "jclaude-login" | "jclaude-register"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("platform")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
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
    if (mode === "jclaude-login") {
      // Find their workspace and go to JClaude
      const { data } = await supabase.from("workspace_users").select("workspace_id").limit(1).single()
      if (data?.workspace_id) {
        router.push(`/workspace/${data.workspace_id}/jclaude`)
      } else {
        router.push("/workspace")
      }
    } else {
      router.push("/workspace")
    }
    router.refresh()
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al registrarse")
        setLoading(false)
        return
      }
      // Auto login after register
      const supabase = createClient()
      await supabase.auth.signInWithPassword({ email, password })
      router.push(`/workspace/${data.workspaceId}/jclaude`)
      router.refresh()
    } catch {
      toast.error("Error al registrarse")
      setLoading(false)
    }
  }

  const isJClaude = mode === "jclaude-login" || mode === "jclaude-register"

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-[#0A0A0A] border-r border-white/10">
        <Image src="/jc-logo-white.png" alt="JC AIgency" width={140} height={80} className="object-contain object-left" />
        <div>
          {isJClaude ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFE600] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#0A0A0A]" />
                </div>
                <span className="text-white font-bold text-2xl">JClaude</span>
              </div>
              <h1 className="text-5xl font-black text-white leading-tight mb-4">
                Tu contenido.<br />
                <span className="text-[#FFE600]">En piloto automático.</span>
              </h1>
              <p className="text-white/50 text-lg max-w-sm leading-relaxed">
                Calendarios de contenido con IA, aprobación en un click y publicación automática en Instagram y Facebook.
              </p>
              <div className="mt-6 flex items-center gap-2 text-green-400 text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                7 días de prueba gratis · Sin tarjeta requerida
              </div>
            </>
          ) : (
            <>
              <h1 className="text-5xl font-black text-white leading-tight mb-4">
                Tu agencia.<br />
                <span className="text-[#FFE600]">En tiempo real.</span>
              </h1>
              <p className="text-white/50 text-lg max-w-sm leading-relaxed">
                Gestioná creatividades, aprobá contenido, seguí tus ads y firmá documentos — todo desde un solo lugar.
              </p>
            </>
          )}
        </div>
        <div className="flex gap-4 text-white/30 text-sm">
          <span>© 2025 JC AIgency</span>
          <span>·</span>
          <span>Plataforma colaborativa</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10 flex justify-center">
            <Image src="/jc-logo-white.png" alt="JC AIgency" width={100} height={60} className="object-contain" />
          </div>

          {/* Mode selector */}
          {mode === "platform" && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-black text-white mb-1">Ingresar</h2>
                <p className="text-white/40 text-sm">Accedé a tu workspace de JC AIgency</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-white/70 text-sm font-medium block mb-1.5">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@empresa.com" required
                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#FFE600] focus:ring-1 focus:ring-[#FFE600] transition" />
                </div>
                <div>
                  <label className="text-white/70 text-sm font-medium block mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                      className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-lg px-4 py-3 pr-11 text-sm outline-none focus:border-[#FFE600] focus:ring-1 focus:ring-[#FFE600] transition" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <a href="/forgot-password" className="text-xs text-white/40 hover:text-[#FFE600] transition">Olvidé mi contraseña</a>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#FFE600] text-[#0A0A0A] font-bold rounded-lg py-3 text-sm hover:bg-[#FFE600]/90 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Ingresando..." : "Ingresar"}
                </button>
              </form>

              <div className="mt-6 relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center"><span className="bg-[#0A0A0A] px-3 text-white/30 text-xs">o</span></div>
              </div>

              <button onClick={() => setMode("jclaude-login")}
                className="mt-4 w-full flex items-center justify-center gap-2.5 border border-[#FFE600]/30 text-[#FFE600] font-semibold rounded-lg py-3 text-sm hover:bg-[#FFE600]/10 transition">
                <Sparkles size={16} />
                Acceder a JClaude
              </button>

              <p className="mt-6 text-center text-white/20 text-xs">
                ¿No tenés acceso a la plataforma? Contactá a tu equipo de JC AIgency
              </p>
            </>
          )}

          {mode === "jclaude-login" && (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-[#FFE600]" />
                  <span className="text-[#FFE600] font-bold text-lg">JClaude</span>
                </div>
                <h2 className="text-2xl font-black text-white mb-1">Ingresar</h2>
                <p className="text-white/40 text-sm">Accedé a tu cuenta de JClaude</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-white/70 text-sm font-medium block mb-1.5">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required
                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#FFE600] focus:ring-1 focus:ring-[#FFE600] transition" />
                </div>
                <div>
                  <label className="text-white/70 text-sm font-medium block mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                      className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-lg px-4 py-3 pr-11 text-sm outline-none focus:border-[#FFE600] focus:ring-1 focus:ring-[#FFE600] transition" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#FFE600] text-[#0A0A0A] font-bold rounded-lg py-3 text-sm hover:bg-[#FFE600]/90 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Ingresando..." : "Ingresar a JClaude"}
                </button>
              </form>
              <p className="mt-5 text-center text-sm text-white/40">
                ¿No tenés cuenta?{" "}
                <button onClick={() => setMode("jclaude-register")} className="text-[#FFE600] hover:underline font-medium">
                  Registrate gratis
                </button>
              </p>
              <button onClick={() => setMode("platform")} className="mt-4 w-full text-center text-xs text-white/20 hover:text-white/40 transition">
                ← Volver al login de la plataforma
              </button>
            </>
          )}

          {mode === "jclaude-register" && (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-[#FFE600]" />
                  <span className="text-[#FFE600] font-bold text-lg">JClaude</span>
                </div>
                <h2 className="text-2xl font-black text-white mb-1">Crear cuenta</h2>
                <p className="text-white/40 text-sm">7 días gratis · Sin tarjeta requerida</p>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-white/70 text-sm font-medium block mb-1.5">Nombre completo</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Juan García" required
                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#FFE600] focus:ring-1 focus:ring-[#FFE600] transition" />
                </div>
                <div>
                  <label className="text-white/70 text-sm font-medium block mb-1.5">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required
                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#FFE600] focus:ring-1 focus:ring-[#FFE600] transition" />
                </div>
                <div>
                  <label className="text-white/70 text-sm font-medium block mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required minLength={8}
                      className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-lg px-4 py-3 pr-11 text-sm outline-none focus:border-[#FFE600] focus:ring-1 focus:ring-[#FFE600] transition" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#FFE600] text-[#0A0A0A] font-bold rounded-lg py-3 text-sm hover:bg-[#FFE600]/90 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Creando cuenta..." : "Empezar prueba gratis"}
                </button>
              </form>
              <p className="mt-4 text-center text-xs text-white/20">
                Al registrarte aceptás los{" "}
                <a href="/terms" className="text-white/40 hover:text-white/60 underline">Términos y Condiciones</a>
                {" "}y la{" "}
                <a href="/privacy" className="text-white/40 hover:text-white/60 underline">Política de Privacidad</a>
              </p>
              <p className="mt-3 text-center text-sm text-white/40">
                ¿Ya tenés cuenta?{" "}
                <button onClick={() => setMode("jclaude-login")} className="text-[#FFE600] hover:underline font-medium">
                  Ingresar
                </button>
              </p>
              <button onClick={() => setMode("platform")} className="mt-4 w-full text-center text-xs text-white/20 hover:text-white/40 transition">
                ← Volver al login de la plataforma
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
