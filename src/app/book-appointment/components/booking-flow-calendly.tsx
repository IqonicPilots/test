"use client"

import React from "react"
import { CalendarDays, Clock3, ShieldCheck } from "lucide-react"
import { BookingFlowModern } from "@/app/book-appointment/components/booking-flow-modern"

export function BookingFlowCalendly() {
  return (
    <section className="mx-auto max-w-[1400px]">
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-background shadow-[0_20px_70px_-25px_rgba(15,23,42,0.28)]">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <aside className="border-b border-border/60 bg-slate-50 p-6 lg:col-span-3 lg:border-b-0 lg:border-r lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">KiviCare</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Book Appointment</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick clinic, doctor, service, slot, and payment in a clear step-by-step scheduler.
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-foreground/90">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span>Book Fast & Easy</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/90">
                <Clock3 className="h-4 w-4 text-primary" />
                <span>Real-time doctor slot availability</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/90">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span>Quick service selection with smart flow</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/90">
                <Clock3 className="h-4 w-4 text-primary" />
                <span>Automated reminders and follow-up ready</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/90">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Secure payment and instant confirmation</span>
              </div>
            </div>
          </aside>

          <div className="bg-white p-2 sm:p-4 lg:col-span-9 lg:p-5">
            <BookingFlowModern isCalendly />
          </div>
        </div>
      </div>
    </section>
  )
}
