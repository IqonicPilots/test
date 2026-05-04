"use client"

import React from 'react'
import { useState, useEffect } from "react"
import Link from "next/link"
import { useDoctors } from "@/hooks/api/use-doctors"
import { useSpecialties } from "@/hooks/api/use-listings"
import { GenericCard } from "@/components/cards/generic-card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Search, MapPin, CalendarDays, Home, ChevronRight, X, ChevronDown, Stethoscope, HeartPulse, Hospital, TrendingUp, ChevronLeft, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { LandingThemeCustomizer, LandingThemeCustomizerTrigger } from '../landing/components/landing-theme-customizer'
import { LandingNavbar } from "../landing/components/navbar"
import { LandingFooter } from "../landing/components/footer"
import { getStoredAuthSession } from '@/lib/auth-session'
import { LandingContentProvider } from '@/contexts/landing-content-context'

export default function DoctorPublicPage() {
  return (
    <LandingContentProvider>
      <DoctorPublicPageInner />
    </LandingContentProvider>
  )
}

function DoctorPublicPageInner() {
  const [page, setPage] = useState(1)
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [selectedSpecialty, setSelectedSpecialty] = useState("all")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const limit = 10

  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false)
  const [canCustomizeTheme, setCanCustomizeTheme] = React.useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  React.useEffect(() => {
    const session = getStoredAuthSession()
    const isAdmin = session?.user?.role === "admin"
    console.log(isAdmin)
    setCanCustomizeTheme(isAdmin)
  }, [])

  const { data, isLoading } = useDoctors(page, limit, true, {
    status: onlyAvailable ? "active" : undefined,
    specialtyId: selectedSpecialty !== "all" ? selectedSpecialty : undefined,
    search: debouncedSearch || undefined,
  })

  const doctors = data?.data || []
  const pagination = data?.pagination

  return (
    <LandingContentProvider>
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <LandingNavbar />
        <div className="min-h-screen bg-[#f8fafc]">

        {/* ── Hero / Banner Section ── */}
        <section className="py-12 lg:py-20 bg-accent/5 border-b relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px]" />
          
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="mx-auto max-w-4xl text-center space-y-8">
              
              {/* Breadcrumb */}
              <nav className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground mb-2">
                <Link href="/" className="flex items-center gap-1 hover:text-primary transition-colors">
                  Home
                </Link>
                <ChevronRight className="size-3" />
                <span className="text-foreground">Doctor List</span>
              </nav>


              {/* Main Content */}
              <div className="space-y-4">
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-[#002B5B]">
                  Find Your Expert
                  <span className="relative mx-3">
                    <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Doctor Here
                    </span>
                    <div className="absolute start-0 -bottom-1 h-1.5 w-full bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full" />
                  </span>
                </h1>

                <p className="text-muted-foreground mx-auto max-w-2xl text-sm sm:text-base lg:text-lg">
                  Browse through our network of highly qualified medical professionals across various specialties, 
                  committed to providing exceptional healthcare for you and your family.
                </p>
              </div>

              {/* Search Bar Integration */}
              <div className="max-w-4xl mx-auto mt-10">
                <div className="flex flex-row items-stretch bg-white rounded-2xl md:rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 overflow-hidden p-1.5 sm:p-2">
                  {/* Search Field */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 px-3 sm:px-4 py-2 border-r border-slate-100">
                    <Search className="size-4 text-primary/60 shrink-0" />
                    <Input
                      placeholder="Search anything..."
                      className="border-none focus-visible:ring-0 text-sm h-10 p-0 bg-transparent placeholder:text-slate-400 shadow-none min-w-0"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                      }}
                    />
                  </div>

                  {/* Search Button */}
                  <button
                    type="button"
                    className="bg-primary text-white px-3.5 sm:px-6 md:px-8 py-3 font-bold text-xs sm:text-sm hover:bg-primary/90 transition-all inline-flex items-center gap-1.5 sm:gap-2 justify-center shrink-0 rounded-xl md:rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] whitespace-nowrap"
                  >
                    <Search className="size-4 shrink-0" />
                    Find Doctor
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Results Section ── */}
        <div className="container mx-auto px-4 md:px-6 py-10">

          {/* Results Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h2 className="text-xl font-bold text-slate-900">
              {isLoading ? (
                "Searching..."
              ) : (
                <>Showing <span className="text-primary">{pagination?.total ?? 0}</span> Doctors</>
              )}
            </h2>

            {/* Availability Filter */}
            <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 border border-primary/20 bg-gradient-to-r from-primary/[0.07] via-primary/[0.04] to-secondary/[0.08] shadow-[0_1px_2px_rgba(0,43,91,0.06)] text-sm font-semibold text-slate-800 select-none backdrop-blur-sm">
              <span className="tracking-wide">Availability</span>
              {onlyAvailable && (
                <button
                  onClick={() => { setOnlyAvailable(false); setPage(1) }}
                  className="size-5 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors"
                >
                  <X className="size-3 text-slate-600" />
                </button>
              )}
              <div
                onClick={() => { setOnlyAvailable(!onlyAvailable); setPage(1) }}
                className="cursor-pointer ml-1"
              >
                <Switch checked={onlyAvailable} onCheckedChange={(val) => { setOnlyAvailable(val); setPage(1) }} />
              </div>
            </div>
          </div>

          {/* Doctor Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-h-[240px] w-full bg-white rounded-2xl animate-pulse flex flex-col md:flex-row overflow-hidden border border-slate-100 shadow-sm">
                  <div className="w-full h-44 md:w-48 md:h-full shrink-0 bg-slate-100" />
                  <div className="flex-1 p-5 space-y-3">
                    <div className="h-3 w-1/4 bg-slate-100 rounded" />
                    <div className="h-6 w-1/2 bg-slate-100 rounded" />
                    <div className="h-3 w-1/3 bg-slate-100 rounded" />
                    <div className="h-16 w-full bg-slate-100 rounded" />
                  </div>
                </div>
              ))
            ) : doctors.length > 0 ? (
              doctors.map((doctor) => (
                <GenericCard key={doctor._id} doctor={doctor} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="size-7 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No doctors found</h3>
                <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto">
                  We couldn't find any doctors matching your criteria.
                </p>
                <button
                  onClick={() => { setSearch(""); setOnlyAvailable(false); setSelectedSpecialty("all") }}
                  className="mt-5 text-primary font-semibold text-sm hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center pb-8">
              <div className="flex items-center space-x-2 text-foreground/90">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex cursor-pointer disabled:cursor-not-allowed"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                  >
                    <ChevronsLeft />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0 cursor-pointer disabled:cursor-not-allowed"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft />
                  </Button>
                </div>
                <div className="flex min-w-[80px] sm:w-[100px] items-center justify-center text-sm font-medium whitespace-nowrap">
                  Page {page} of {pagination.totalPages || 1}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0 cursor-pointer disabled:cursor-not-allowed"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                  >
                    <ChevronRight />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex cursor-pointer disabled:cursor-not-allowed"
                    onClick={() => setPage(pagination.totalPages)}
                    disabled={page === pagination.totalPages}
                  >
                    <ChevronsRight />
                  </Button>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
        <LandingFooter />
        {canCustomizeTheme && (
          <>
            <LandingThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
            <LandingThemeCustomizer open={themeCustomizerOpen} onOpenChange={setThemeCustomizerOpen} />
          </>
        )}
      </div>
    </LandingContentProvider>
  )
}
