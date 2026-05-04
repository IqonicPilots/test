"use client"

import { useMemo, useRef, useEffect } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CardDecorator } from '@/components/ui/card-decorator'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useInfiniteDoctors } from '@/hooks/api/use-doctors'
import * as Icons from 'lucide-react'
import {
  Stethoscope,
  MapPin,
  ArrowRight,
  User,
  Star,
  Hospital,
  Check,
  HeartPulse,
  Pill,
  Thermometer,
} from "lucide-react"
import { HighlightedText } from '@/components/highlighted-text'
import { useLandingContent } from '@/contexts/landing-content-context'
import React from 'react'

function DoctorSkeleton() {
  return (
    <Card className='group shadow-xs overflow-hidden h-full border-border/50'>
      <div className="h-28 bg-muted animate-pulse" />
      <div className="relative -mt-12 flex justify-center px-4">
        <Skeleton className="h-24 w-24 rounded-full border-4 border-background shadow-sm" />
      </div>
      <CardContent className='p-8 pt-6'>
        <div className='flex flex-col items-center text-center space-y-3'>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-24 rounded-lg mt-4" />
        </div>
      </CardContent>
    </Card>
  )
}

export function TeamSection() {
  const { settings, hydrated } = useLandingContent()
  const { team: teamSettings } = settings
  const scrollRef = useRef<HTMLDivElement>(null)

  // Map customizer sort to API sort
  const sortMapping = {
    latest: '-createdAt',
    oldest: 'createdAt',
    top: '-rating'
  }

  const {
    data,
    isLoading: isDataLoading,
    hasNextPage: hasMore,
  } = useInfiniteDoctors(teamSettings.teamLimit || 8, {
    sort: sortMapping[teamSettings.teamFilter || 'latest'] as any,
    status: "active",
  })

  const doctorsFiltered = useMemo(() => {
    const allDocs = data?.pages.flatMap((page) => page.data) || []
    return allDocs.slice(0, teamSettings.teamLimit || 8)
  }, [data, teamSettings.teamLimit])

  if (!teamSettings.show) return null

  const isLoading = isDataLoading || !hydrated

  if (!hydrated) {
    return (
      <section className="py-24 sm:py-32 relative z-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center mb-16">
            <Skeleton className="h-6 w-24 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-10 w-full max-w-2xl mx-auto mb-4" />
            <Skeleton className="h-5 w-full max-w-xl mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <DoctorSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="team" className="py-24 sm:py-32 overflow-hidden relative z-0" style={{ color: teamSettings.sectionTextColor || undefined }}>
      {/* Background Base */}
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: teamSettings.sectionBgColor || undefined }}
      />
      {!teamSettings.sectionBgColor && (
        <div className="absolute inset-0 -z-10 bg-background" />
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <Badge
            variant="outline"
            className="mb-4"
            style={{
              backgroundColor: teamSettings.sectionHighlightColor ? `${teamSettings.sectionHighlightColor}15` : undefined,
              color: teamSettings.sectionHighlightColor || undefined,
              borderColor: teamSettings.sectionHighlightColor ? `${teamSettings.sectionHighlightColor}40` : undefined
            }}
          >
            {teamSettings.badgeIcon && (Icons as any)[teamSettings.badgeIcon] && (
              React.createElement((Icons as any)[teamSettings.badgeIcon], { className: "mr-2 h-3.5 w-3.5" })
            )}
            {teamSettings.badge || "Our Experts"}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4" style={{ color: teamSettings.sectionTextColor || '#002B5B' }}>
            <HighlightedText
              text={teamSettings.title || "Meet Our Dedicated Doctors"}
              highlightColor={teamSettings.sectionHighlightColor}
            />
          </h2>
          <p className="text-lg text-muted-foreground" style={{ color: teamSettings.sectionTextColor ? `${teamSettings.sectionTextColor}cc` : undefined }}>
            <HighlightedText
              text={teamSettings.description || "Connect with highly qualified professionals dedicated to providing the best healthcare services."}
              highlightColor={teamSettings.sectionHighlightColor}
            />
          </p>
        </div>

        {/* Doctors Grid/Carousel Wrapper */}
        <div
          ref={scrollRef}
          className={cn(
            "flex overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:-mx-0 md:px-0 md:pb-0",
            "md:grid md:grid-cols-1 md:gap-x-8 md:gap-y-12 lg:grid-cols-4",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar]:hidden",
            doctorsFiltered.length === 1 ? "md:max-w-md md:mx-auto lg:grid-cols-1" :
              doctorsFiltered.length === 2 ? "md:grid-cols-2 md:max-w-4xl md:mx-auto lg:grid-cols-2" :
                doctorsFiltered.length === 3 ? "md:grid-cols-2 lg:grid-cols-3 md:max-w-6xl md:mx-auto" :
                  ""
          )}
        >
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[85vw] md:min-w-0 snap-center">
                <DoctorSkeleton />
              </div>
            ))
          ) : (
            doctorsFiltered.map((doctor) => {
              const doctorWithRating = doctor as typeof doctor & {
                rating?: number | string
                avgRating?: number | string
                meta?: typeof doctor.meta & {
                  rating?: number | string
                  avgRating?: number | string
                }
              }
              const parsedRating = Number(
                doctorWithRating.rating ??
                  doctorWithRating.avgRating ??
                  doctorWithRating.meta?.rating ??
                  doctorWithRating.meta?.avgRating
              )
              const doctorRating = Number.isFinite(parsedRating)
                ? Math.max(0, Math.min(5, parsedRating)).toFixed(1)
                : '4.8'

              const specialties = doctor.meta?.specialties
                ?.map(s => (typeof s === 'string' ? s : s.label))
                .filter(Boolean)
                .join(', ') || 'General Physician'

              const address = typeof doctor.meta?.address === 'object'
                ? [doctor.meta.address.city, doctor.meta.address.state].filter(Boolean).join(', ')
                : doctor.meta?.city || 'Global'

              return (
                <div key={doctor._id} className="min-w-[85vw] md:min-w-0 snap-center px-2 md:px-0">
                  <Card className='group relative shadow-sm hover:shadow-md transition-all duration-300 border-border/50 overflow-hidden bg-white rounded-xl h-full flex flex-col py-0'>
                    {/* Experience Badge - Top Left */}
                    {doctor.meta?.experience && (
                      <div className="absolute top-3 left-3 z-20">
                        <Badge variant="outline" className="text-xs h-6 rounded-full px-2.5 bg-secondary/90 border-secondary shadow-sm text-white font-bold backdrop-blur-sm">
                          {doctor.meta.experience} Years Exp
                        </Badge>
                      </div>
                    )}

                    {/* Rating Badge - Top Right */}
                    <div className="absolute top-3 right-3 z-20">
                      <Badge variant="outline" className="flex items-center gap-1 h-7 rounded-full px-2.5 bg-white/90 border-white shadow-sm text-yellow-600 font-bold backdrop-blur-sm">
                        <Star className="w-3 h-3 fill-yellow-600" />
                        <span className="text-[10px]">{doctorRating}</span>
                      </Badge>
                    </div>

                    {/* Header with Pattern - Scaled back to h-28 */}
                    <div className="h-28 bg-blue-600 relative overflow-hidden shrink-0">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                      <Stethoscope className="absolute top-1 left-4 w-12 h-12 text-white/10 -rotate-12" />
                      <HeartPulse className="absolute top-2 right-4 w-10 h-10 text-white/5 rotate-12" />
                      <Hospital className="absolute -bottom-2 right-8 w-16 h-16 text-white/10" />
                    </div>

                    {/* Avatar Overlay - Scaled back to h-24 */}
                    <div className="relative -mt-12 flex justify-center px-4 shrink-0">
                      <div className="relative">
                        <div className="h-24 w-24 rounded-full border-4 border-white overflow-hidden shadow-sm bg-muted ring-1 ring-black/5">
                          {(doctor.meta?.profilePicture || doctor.meta?.avatar) ? (
                            <img
                              src={(doctor.meta.profilePicture || doctor.meta.avatar) as string}
                              alt={`${doctor.firstName} ${doctor.lastName}`}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-black text-primary bg-primary/30">
                              <User className='h-10 w-10' />
                            </div>
                          )}
                        </div>
                        {/* Verified Badge */}
                        <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-white stroke-[4]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <CardContent className='px-6 py-3 flex-grow flex flex-col'>
                      <div className='flex flex-col items-center text-center flex-grow'>
                        <h3 className='text-xl md:text-2xl font-bold text-[#002B5B] tracking-tight group-hover:text-primary transition-colors'>
                          Dr {doctor.firstName} {doctor.lastName}
                        </h3>
                        {/* Category Tags - Strictly 1 line limit with Tooltip */}
                        <div className="mt-4 flex flex-nowrap justify-center gap-1.5 w-full">
                          <TooltipProvider>
                            {doctor.meta?.specialties?.slice(0, 1).map((specialty, idx) => {
                              const label = typeof specialty === 'string' ? specialty : specialty.label
                              return (
                                <Badge key={idx} variant="outline" className="h-auto py-1 px-3 rounded-lg border-slate-200 text-slate-600 font-medium bg-white shadow-xs transition-colors hover:bg-white hover:border-secondary/30">
                                  <span className="text-xs break-words">{label}</span>
                                </Badge>
                              )
                            })}

                            {doctor.meta?.specialties && doctor.meta.specialties.length > 1 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="h-auto py-1 px-3 rounded-lg border-slate-200 text-slate-600 font-medium bg-white shadow-xs transition-colors hover:bg-white hover:border-secondary/30">
                                    <span className="text-xs">+{doctor.meta.specialties.length - 1} more</span>
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="p-3 bg-white border shadow-lg rounded-xl z-50" arrowClassName="fill-secondary">
                                  <div className="flex flex-col gap-1.5 min-w-[140px]">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Additional Specialties</p>
                                    {doctor.meta.specialties.slice(1).map((specialty, idx) => (
                                      <div key={idx} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                        <span className="text-xs font-medium text-slate-600">
                                          {typeof specialty === 'string' ? specialty : specialty.label}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TooltipProvider>
                        </div>
                      </div>

                      {/* RESTORED: Clinics Section - Strictly 1 line limit with Tooltip */}
                      {doctor.meta?.clinics && doctor.meta.clinics.length > 0 && (
                        <div className="mt-5 pt-5 border-t border-dashed flex flex-nowrap justify-center gap-1.5 w-full mb-2">
                          <TooltipProvider>
                            {doctor.meta.clinics.slice(0, 1).map((clinic, idx) => {
                              const clinicName = typeof clinic === 'string' ? clinic : clinic.name
                              return (
                                <Badge key={idx} variant="outline" className="text-xs h-auto py-1 px-2.5 rounded-full border-secondary/10 bg-secondary/5 text-secondary font-medium gap-1.5 shadow-none">
                                  <Hospital className="w-2.5 h-2.5 shrink-0" />
                                  <span className="break-words">{clinicName}</span>
                                </Badge>
                              )
                            })}

                            {doctor.meta.clinics.length > 1 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-xs h-auto py-1 px-2.5 rounded-full border-primary/10 bg-primary/5 text-primary font-medium gap-1.5 shadow-none">
                                    +{doctor.meta.clinics.length - 1} More
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="p-3 bg-white border shadow-lg rounded-xl z-50">
                                  <div className="flex flex-col gap-1.5 min-w-[160px]">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Other Clinics</p>
                                    {doctor.meta.clinics.slice(1).map((clinic, idx) => (
                                      <div key={idx} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Hospital className="w-3 h-3 text-primary/60" />
                                        <span className="text-xs font-medium text-slate-600">
                                          {typeof clinic === 'string' ? clinic : clinic.name}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TooltipProvider>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )
            })
          )}
        </div>

        {/* Dynamic View All Doctors Button */}
        {teamSettings.showButton && (
          <div className="mt-12 flex justify-center">
            <Button size="lg" className="group px-10 transition-all shadow-md hover:shadow-lg font-bold" asChild>
              <Link href={teamSettings.buttonLink || "/doctor-list"}>
                {teamSettings.buttonText || "View All Doctors"}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
