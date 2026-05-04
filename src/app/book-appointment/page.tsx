"use client"

import React from 'react'
import { LandingNavbar } from '@/app/landing/components/navbar'
import { LandingFooter } from '@/app/landing/components/footer'
import { BookingFlow } from '@/app/book-appointment/components/booking-flow'
import { BookingFlowModern } from '@/app/book-appointment/components/booking-flow-modern'
import { BookingFlowDefault } from '@/app/book-appointment/components/booking-flow-default'
import { BookingFlowCalendly } from '@/app/book-appointment/components/booking-flow-calendly'
import { useSystemConfig } from '@/hooks/api/use-system-config'
import { LandingContentProvider } from '@/contexts/landing-content-context'
import { Loader2 } from 'lucide-react'

export default function BookAppointmentPage() {
  const { data: config, isLoading } = useSystemConfig()
  const isCalendlyLayout = config?.booking_appointment_layout === "calendly"
  const badgeText = config?.booking_hero_badge_text?.trim() || "Smart Booking Experience"
  const titleText = config?.booking_hero_title_text?.trim() || "Schedule Your {Health} Visit."
  const descriptionText =
    config?.booking_hero_description_text?.trim() ||
    "Experience the next generation of medical appointments with our simplified, secure, and modern booking system."

  const renderBookingTitle = (value: string) => {
    const parts = value.split(/(\{[^}]+\})/g).filter(Boolean)
    return parts.map((part, idx) => {
      const match = part.match(/^\{([^}]+)\}$/)
      if (match) {
        return (
          <span key={`hl-${idx}`} className="text-primary italic">
            {match[1]}
          </span>
        )
      }
      return <React.Fragment key={`tx-${idx}`}>{part}</React.Fragment>
    })
  }
  React.useEffect(() => {
    const forceLight = () => {
      const root = document.documentElement
      root.classList.remove("dark")
      root.classList.add("light")
    }
    forceLight()
  }, [])

  return (
    <LandingContentProvider>
    <div className="min-h-screen bg-[#f8fafc] flex flex-col relative font-inter overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-background to-transparent pointer-events-none -z-10" />
      <div className="absolute top-40 left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-400 opacity-[0.03] blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-80 right-[-10%] w-[500px] h-[500px] rounded-full bg-primary opacity-[0.03] blur-[120px] pointer-events-none -z-10" />

      <LandingNavbar />

      <main className="flex md:pt-32 md:pb-24 pt-15 pb-5">
        <div className={`container mx-auto px-4 ${isCalendlyLayout ? "max-w-[1450px]" : "max-w-6xl"}`}>
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-top-4">
              {badgeText}
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
              {renderBookingTitle(titleText)}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              {descriptionText}
            </p>
          </div>

          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : config?.booking_appointment_layout === 'classic' ? (
              <BookingFlow />
            ) : config?.booking_appointment_layout === 'modern' ? (
              <BookingFlowModern />
            ) : config?.booking_appointment_layout === 'calendly' ? (
              <BookingFlowCalendly />
            ) : (
              <BookingFlowDefault />
            )}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
    </LandingContentProvider>
  )
}
