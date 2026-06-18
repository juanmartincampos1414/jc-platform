import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "JC AIgency — Platform",
  description: "Plataforma colaborativa JC AIgency",
  icons: { icon: "/jc-logo.png" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full`}>
      <body className="h-full bg-white text-[#0A0A0A] antialiased">
        {children}
        <Toaster richColors />
      </body>
    </html>
  )
}
