"use client"

import { useMemo, useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CardDecorator } from '@/components/ui/card-decorator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Layout, Users, CalendarCheck2, ShieldCheck, Linkedin, Hospital, MapPin, ArrowRight } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useLandingContent } from '../../../contexts/landing-content-context'
import { HighlightedText } from '@/components/highlighted-text'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useInfiniteClinics } from '@/hooks/api/use-clinics'
import React from 'react'

function HospitalCard({ clinic }: { clinic: any }) {
  return (
    <Card className='group w-full shadow-xs py-2 hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/30 h-full'>
      <CardContent className='p-8'>
        <div className='flex flex-col items-center text-center'>
          <CardDecorator>
            {clinic.cliniclogo ? (
              <div className="relative h-10 w-10 flex items-center justify-center">
                <img
                  src={clinic.cliniclogo}
                  alt={clinic.name}
                  className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            ) : (
              <Hospital className='h-6 w-6 text-primary' aria-hidden />
            )}
          </CardDecorator>
          <h3 className='mt-6 font-semibold text-lg text-balance group-hover:text-primary transition-colors'>{clinic.name}</h3>
          <div className="flex items-center mt-3 text-muted-foreground text-sm">
            <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
            <span>{[clinic.address?.city, clinic.address?.state].filter(Boolean).join(', ') || 'Global Location'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ClinicSkeleton() {
  return (
    <Card className='group w-full shadow-xs py-2 h-full'>
      <CardContent className='p-8'>
        <div className='flex flex-col items-center text-center'>
          <CardDecorator>
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardDecorator>
          <Skeleton className="h-5 w-32 mt-6" />
          <Skeleton className="h-4 w-24 mt-3" />
        </div>
      </CardContent>
    </Card>
  )
}

export function AboutSection() {
  const { settings, hydrated } = useLandingContent()
  const { about } = settings

  const filters = useMemo(() => ({
    sortBy: about.filter || 'latest',
    isActive: true
  }), [about.filter])

  const {
    data,
    isLoading: isDataLoading,
    hasNextPage: hasMore,
  } = useInfiniteClinics(about.limit || 4, filters)

  const clinics = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || []
  }, [data])

  if (!about.show) return null

  const isLoading = isDataLoading || !hydrated

  if (!hydrated) {
    return (
      <section className="py-24 sm:py-32 relative z-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center mb-16">
            <Skeleton className="h-6 w-24 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-10 w-full max-w-2xl mx-auto mb-6" />
            <Skeleton className="h-5 w-full max-w-xl mx-auto mb-2" />
            <Skeleton className="h-5 w-3/4 max-w-md mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <ClinicSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      id="about"
      className="py-24 sm:py-32 overflow-hidden relative z-0"
      style={{ color: about.sectionTextColor || undefined }}
    >
      {/* Background Base */}
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: about.sectionBgColor || undefined }}
      />
      {!about.sectionBgColor && (
        <div className="absolute inset-0 -z-10 bg-background" />
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <Badge
            variant="outline"
            className="mb-4"
            style={{
              backgroundColor: about.sectionHighlightColor ? `${about.sectionHighlightColor}15` : undefined,
              color: about.sectionHighlightColor || undefined,
              borderColor: about.sectionHighlightColor ? `${about.sectionHighlightColor}40` : undefined
            }}
          >
            {about.badgeIcon && (Icons as any)[about.badgeIcon] && (
              React.createElement((Icons as any)[about.badgeIcon], { className: "mr-2 h-3.5 w-3.5" })
            )}
            {about.badge || "Clinics"}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            <HighlightedText
              text={about.title || "Built for Modern {Healthcare} Clinics & Healthcare Providers"}
              highlightColor={about.sectionHighlightColor}
            />
          </h2>
          <p className="text-lg text-muted-foreground mb-8" style={{ color: about.sectionTextColor ? `${about.sectionTextColor}cc` : undefined }}>
            <HighlightedText
              text={about.description || "KiviCare is a powerful clinic management system designed to simplify {patient management}, appointment scheduling, EHR, and billing."}
              highlightColor={about.sectionHighlightColor}
            />
          </p>
        </div>

        {/* Desktop View - Restored Original Grid structure */}
        <div
          className={cn(
            "hidden md:grid md:grid-cols-1 md:gap-x-8 md:gap-y-12 lg:grid-cols-4 md:pb-0",
            clinics.length === 1 ? "md:max-w-md md:mx-auto lg:grid-cols-1" :
              clinics.length === 2 ? "md:grid-cols-2 md:max-w-4xl md:mx-auto lg:grid-cols-2" :
                clinics.length === 3 ? "md:grid-cols-2 lg:grid-cols-3 md:max-w-6xl md:mx-auto" :
                  ""
          )}
        >
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`skel-desktop-${i}`}>
                <ClinicSkeleton />
              </div>
            ))
          ) : (
            clinics.map((clinic) => (
              <HospitalCard key={clinic._id} clinic={clinic} />
            ))
          )}
        </div>

        {/* Mobile View - Enhanced Carousel Pattern */}
        <div className="relative md:hidden">
          {/* Fades for Mobile Perspective */}
          <div
            className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r z-10 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(to right, ${about.sectionBgColor || 'var(--background)'}, transparent)`
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l z-10 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(to left, ${about.sectionBgColor || 'var(--background)'}, transparent)`
            }}
          />

          <div className="overflow-hidden py-4">
            <div className="flex space-x-8 animate-logo-scroll">
              {isLoading ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`skel-mob-1-${i}`} className="w-[280px] shrink-0">
                      <ClinicSkeleton />
                    </div>
                  ))}
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`skel-mob-2-${i}`} className="w-[280px] shrink-0">
                      <ClinicSkeleton />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {/* First set of clinics */}
                  {clinics.map((clinic) => (
                    <div key={`mob-first-${clinic._id}`} className="w-[280px] shrink-0">
                      <HospitalCard clinic={clinic} />
                    </div>
                  ))}
                  {/* Second set for mobile seamless carousel - duplicated */}
                  {clinics.map((clinic) => (
                    <div key={`mob-dup-${clinic._id}`} className="w-[280px] shrink-0">
                      <HospitalCard clinic={clinic} />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center border-t border-border/50 pt-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-muted-foreground">Helping clinics and healthcare providers digitize and scale their operations</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {about.showButton && (
              <Button size="lg" className="cursor-pointer" asChild>
                <Link href={about.buttonLink || "/clinic-list"}>
                  <CalendarCheck2 className="mr-2 h-4 w-4" />
                  {about.buttonText || "View All Clinics"}
                </Link>
              </Button>
            )}

            {about.showButton2 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="lg" variant="outline" className="cursor-pointer" asChild>
                      <Link href={about.button2Link || "#"}>
                        <Linkedin className="mr-2 h-4 w-4" />
                        {about.button2Text || "Contact Us"}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{about.button2Tooltip || "Response within 24 hours"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
