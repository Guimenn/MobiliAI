"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import React from "react"
import Link from "next/link"
import { Rocket } from "lucide-react"
import { ArrowRight } from "lucide-react"
import { usePathname } from "next/navigation"

export default function CTA() {
    const pathname = usePathname()
    const isIAPage = pathname === '/IA' || pathname?.startsWith('/IA')
    const isHomePage = pathname === '/'
    
    return (
        <section className="relative overflow-hidden bg-[#3e2626] py-20 text-white">
          {/* Gradiente superior para transição - aparece apenas na página de IA */}
          {isIAPage && !isHomePage && (
            <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-[#3e2626] via-[#3e2626]/80 to-transparent pointer-events-none z-10" />
          )}
          
          {/* Background Beams */}
          
          <div className="absolute inset-0 opacity-10 z-0">
            <Image src="/hero-bg.png" alt="" fill className="object-cover" />
          </div>
          <div className="relative mx-auto max-w-4xl px-4 text-center z-99">
            <h2 className="text-4xl font-black leading-tight sm:text-5xl">
              Transforme o atendimento em uma experiência memorável.
          </h2>
            <p className="mt-4 text-white/80">
              Faça o upload de um ambiente agora e aplique móveis reais da MobiliAI, sugerir produtos reais e gerar
              imagens que vendem.
          </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
                className="h-14 rounded-full bg-white px-10 text-base font-semibold text-[#3e2626] transition hover:bg-white/90"
              asChild
            >
              <Link href="/IA-demo">
                <Rocket className="mr-2 h-5 w-5" />
                  Entrar no simulador
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
                className="h-14 bg-transparent rounded-full border-white/60 px-10 text-base font-semibold text-white transition hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/products">
                  Conferir catálogo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
            <p className="mt-4 text-xs uppercase tracking-[0.35em] text-white/60">
              a mesma experiência nas lojas físicas e online
            </p>
        </div>
      </section>
    )
}