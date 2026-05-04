"use client"

import React, { useState, useEffect, useMemo } from 'react'
import Link from "next/link"
import { useClinics } from "@/hooks/api/use-clinics"
import { GenericCard } from "@/components/cards/generic-card"
import type { Clinic } from "@/types/clinic.types"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import {
  Search, ChevronRight, X, Building2,
  MapPin, Navigation, Map as MapIcon, Maximize2, Star,
  ChevronLeft, ChevronsLeft, ChevronsRight
} from "lucide-react"
import { LandingNavbar } from "../landing/components/navbar"
import { LandingFooter } from "../landing/components/footer"
import { Button } from "@/components/ui/button"
import { getStoredAuthSession } from '@/lib/auth-session'
import { LandingThemeCustomizer, LandingThemeCustomizerTrigger } from '../landing/components/landing-theme-customizer'
import { LandingContentProvider } from '@/contexts/landing-content-context'
import dynamic from "next/dynamic"

// Dynamically import map with SSR disabled
const MapComponent = dynamic(() => import("./map-component"), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-50 text-sm text-slate-500 gap-2">
      <div className="size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      Loading map...
    </div>
  )
})

type LatLng = {
  lat: number
  lng: number
}

type ClinicLocation = {
  lat: number
  lng: number
  clinic: Clinic
  address: string
}

// ── Inline ClinicMapPanel ─────────────────────────────────────────────────────
function ClinicMapPanel({
  clinics,
}: {
  clinics: Clinic[]
}) {
  const [locations, setLocations] = useState<ClinicLocation[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // 🔥 Convert all clinic addresses → lat/lng
  useEffect(() => {
    if (!clinics || clinics.length === 0) {
      setLocations([])
      return
    }

    const fetchCoords = async (query: string) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          }
        }
      } catch (err) {
        console.error("Geocoding error for query:", query, err)
      }
      return null
    }

    const runGeocodingAll = async () => {
      setIsSearching(true)
      const results: ClinicLocation[] = []

      for (const clinic of clinics) {
        const addrParts = [
          clinic.address?.street,
          clinic.address?.city,
          clinic.address?.state,
          clinic.address?.country,
        ].map(p => p?.trim()).filter(Boolean)
        const fullAddr = addrParts.join(", ")

        if (!fullAddr) continue

        // Try 1: Full
        let pos = await fetchCoords(fullAddr)
        
        // Try 2: Simpler (City, State, Country)
        if (!pos) {
          const simpler = [clinic.address?.city, clinic.address?.state, clinic.address?.country]
            .map(p => p?.trim()).filter(Boolean).join(", ")
          if (simpler && simpler !== fullAddr) {
            await new Promise(r => setTimeout(r, 200)) // Throttle
            pos = await fetchCoords(simpler)
          }
        }

        if (pos) {
          results.push({
            ...pos,
            clinic,
            address: fullAddr
          })
        }
        
        // Respect rate limits slightly
        await new Promise(r => setTimeout(r, 100))
      }

      setLocations(results)
      setIsSearching(false)
    }

    runGeocodingAll()
  }, [clinics])

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border shadow-sm overflow-hidden border-slate-100">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-white">
        <div>
           <p className="font-bold text-slate-900 leading-none">Clinics Map</p>
           <p className="text-[11px] text-slate-500 mt-1.5 font-medium flex items-center gap-1">
             <MapIcon className="size-3" />
             Showing {locations.length} locations
           </p>
        </div>
      </div>

      {/* Map Content Container */}
      <div className="flex-1 relative bg-slate-50 overflow-hidden">
        {locations.length > 0 ? (
          <MapComponent 
            locations={locations} 
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            {isSearching ? (
              <div className="space-y-4 flex flex-col items-center">
                <div className="size-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">Locating clinics...</p>
                  <p className="text-xs text-slate-500">Mapping {clinics.length} clinical locations</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex flex-col items-center">
                <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                   <Navigation className="size-7 text-slate-300" />
                </div>
                <div className="space-y-1 max-w-[200px]">
                  <p className="text-sm font-bold text-slate-900">No locations found</p>
                  <p className="text-[12px] text-slate-500 leading-relaxed">
                    We couldn't pinpoint any clinic addresses on the map.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ClinicListPage() {
  return (
    <LandingContentProvider>
      <ClinicListPageInner />
    </LandingContentProvider>
  )
}

function ClinicListPageInner() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [onlyActive, setOnlyActive] = useState(true)
  const limit = 10

  const [themeCustomizerOpen, setThemeCustomizerOpen] = useState(false)
  const [canCustomizeTheme, setCanCustomizeTheme] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const session = getStoredAuthSession()
    setCanCustomizeTheme(session?.user?.role === "admin")
  }, [])

  const { data, isLoading } = useClinics(page, limit, true, {
    search: debouncedSearch || undefined,
    isActive: onlyActive || undefined,
  })

  const clinics = data?.data || []
  const pagination = data?.pagination

  return (
    <LandingContentProvider>
      <div className="min-h-screen bg-[#f8fafc]">
        <LandingNavbar />

      {/* ── Hero Banner ── */}
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
              <span className="text-foreground">Clinic List</span>
            </nav>

            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-[#002B5B]">
                Discover Our
                <span className="relative mx-3">
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Top Clinics
                  </span>
                  <div className="absolute start-0 -bottom-1 h-1.5 w-full bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full" />
                </span>
              </h1>

              <p className="text-muted-foreground mx-auto max-w-2xl text-sm sm:text-base lg:text-lg">
                Explore our network of state-of-the-art medical facilities,
                equipped with the latest technology and staffed by professional healthcare experts.
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto mt-10">
              <div className="flex flex-row items-stretch bg-white rounded-2xl md:rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 overflow-hidden p-1.5 sm:p-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 px-3 sm:px-4 py-2 border-r border-slate-100">
                  <Search className="size-4 text-primary/60 shrink-0" />
                  <Input
                    placeholder="Search clinics..."
                    className="border-none focus-visible:ring-0 text-sm h-10 p-0 bg-transparent placeholder:text-slate-400 shadow-none min-w-0"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  />
                </div>
                <button
                  type="button"
                  className="bg-primary text-white px-3.5 sm:px-6 md:px-8 py-3 font-bold text-xs sm:text-sm hover:bg-primary/90 transition-all inline-flex items-center gap-1.5 sm:gap-2 justify-center shrink-0 rounded-xl md:rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] whitespace-nowrap"
                >
                  <Search className="size-4 shrink-0" />
                  Find Clinic
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Results + Map Section ── */}
      <div className="container mx-auto px-4 md:px-6 py-10">

        {/* Results header row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-xl font-bold text-slate-900">
            {isLoading ? (
              "Searching..."
            ) : (
              <>Showing <span className="text-primary">{pagination?.total ?? 0}</span> Clinics</>
            )}
          </h2>

        </div>

        {/* ── Split Layout: Cards left | Map right ── */}
        <div className="flex flex-col xl:flex-row gap-6">

          {/* LEFT – Clinic Cards */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-5">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[240px] w-full bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm"
                  />
                ))
              ) : clinics.length > 0 ? (
                clinics.map((clinic) => (
                  <GenericCard key={clinic._id} clinic={clinic} />
                ))
              ) : (
                <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="size-7 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">No clinics found</h3>
                  <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto">
                    We couldn't find any clinics matching your criteria.
                  </p>
                  <button
                    onClick={() => { setSearch(""); setOnlyActive(true); setPage(1) }}
                    className="mt-5 text-primary font-semibold text-sm hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8 pb-4">
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

          {/* RIGHT – Sticky Map */}
          <div className="xl:w-[600px] shrink-0">
            <div className="sticky top-20 h-[calc(100vh-6rem)]">
              <ClinicMapPanel clinics={clinics} />
            </div>
          </div>

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
