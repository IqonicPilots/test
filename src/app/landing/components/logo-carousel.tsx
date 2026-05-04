"use client"

import { Card } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useLandingContent } from '../../../contexts/landing-content-context'

export function LogoCarousel() {
  const { settings, hydrated } = useLandingContent()
  const { logos } = settings

  if (!logos.show) return null

  const partnerLogos = logos.logos || []

  if (!hydrated) {
    return (
      <section className="pb-12 sm:pb-16 lg:pb-20 pt-12 relative z-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Skeleton className="h-4 w-72 mx-auto mb-8" />
            <div className="flex gap-8 justify-center overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-28 rounded-md flex-shrink-0" />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="pb-12 sm:pb-16 lg:pb-20 pt-12 relative z-0">
      {/* Background Base */}
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: logos.sectionBgColor || undefined }}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground mb-8">
            {logos.title || "Trusted by Leading Clinics & Healthcare Providers Worldwide"}
          </p>

          {/* Logo Carousel with Fade Effect */}
          <div className="relative">
            {/* Left Fade */}
            <div
              className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r z-10 pointer-events-none"
              style={{ backgroundImage: `linear-gradient(to right, ${logos.sectionBgColor || 'var(--background)'}, transparent)` }}
            />

            {/* Right Fade */}
            <div
              className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l z-10 pointer-events-none"
              style={{ backgroundImage: `linear-gradient(to left, ${logos.sectionBgColor || 'var(--background)'}, transparent)` }}
            />

            {/* Logo Container */}
            <div className="overflow-hidden">
              <div className="flex animate-logo-scroll space-x-8 sm:space-x-12">
                {/* First set of logos */}
                {partnerLogos.filter(c => c.url).map((company, index) => (
                  <Card
                    key={`first-${index}`}
                    className="flex h-16 w-44 flex-shrink-0 items-center justify-center border-0 bg-transparent px-2 opacity-80 shadow-none transition-opacity duration-300 hover:opacity-100"
                  >
                    <img
                      src={company.url}
                      alt={company.alt || `Partner ${index}`}
                      className="h-10 w-auto max-w-[160px] object-contain"
                    />
                  </Card>
                ))}
                {/* Second set for seamless loop (only if there are logos) */}
                {partnerLogos.length > 0 && partnerLogos.filter(c => c.url).map((company, index) => (
                  <Card
                    key={`second-${index}`}
                    className="flex h-16 w-44 flex-shrink-0 items-center justify-center border-0 bg-transparent px-2 opacity-80 shadow-none transition-opacity duration-300 hover:opacity-100"
                  >
                    <img
                      src={company.url}
                      alt={company.alt || `Partner ${index}`}
                      className="h-10 w-auto max-w-[160px] object-contain"
                    />
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
