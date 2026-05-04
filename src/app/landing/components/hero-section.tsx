"use client"

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Play, Star, Users, CalendarCheck2, Settings2 } from 'lucide-react'
import * as Icons from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DotPattern } from '@/components/dot-pattern'
import { useLandingContent, DEFAULT_SETTINGS } from '../../../contexts/landing-content-context'
import { HighlightedText } from '@/components/highlighted-text'
import React from 'react'
import { cn } from '@/lib/utils'

export function HeroSection() {
  const { settings, hydrated } = useLandingContent()
  const { hero } = settings

  if (!hero.show) return null

  if (!hydrated) {
    return (
      <section className="relative z-0 overflow-hidden pt-16 sm:pt-20 pb-16 min-h-[70vh] flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 flex justify-center">
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
            <Skeleton className="mb-6 h-16 w-full max-w-3xl mx-auto" />
            <Skeleton className="mx-auto mb-10 h-6 w-full max-w-xl" />
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Skeleton className="h-12 w-40 rounded-lg" />
              <Skeleton className="h-12 w-40 rounded-lg" />
            </div>
          </div>
        </div>
      </section>
    )
  }
  return (
    <section
      id="hero"
      data-bg-color={hero.sectionBgColor}
      className="relative z-0 overflow-hidden pt-16 sm:pt-20 pb-16"
      style={{ color: hero.sectionTextColor || undefined }}
    >
      {/* Background Base */}
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: hero.sectionBgColor || undefined }}
      />
      {!hero.sectionBgColor && (
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background to-background/80" />
      )}

      {/* Background Pattern */}
      <div className="absolute inset-0">
        {/* Dot pattern overlay using reusable component */}
        <DotPattern className="opacity-100" size="md" fadeStyle="ellipse" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Announcement Badge */}
          <div className="mb-8 flex justify-center">
            {hero.badge && (
              <Badge
                variant="outline"
                className="mb-4 py-1.5"
                style={{
                  backgroundColor: hero.sectionHighlightColor ? `${hero.sectionHighlightColor}15` : undefined,
                  color: hero.sectionHighlightColor || undefined,
                  borderColor: hero.sectionHighlightColor ? `${hero.sectionHighlightColor}40` : undefined
                }}
              >
                {hero.badgeIcon ? (
                  React.createElement((Icons as any)[hero.badgeIcon] || Icons.Star, { 
                    className: cn("mr-2 h-3 w-3", 
                      (hero.badgeIcon === 'Star' || !hero.badgeIcon) ? "text-yellow-500 fill-yellow-500" : "fill-primary"
                    ) 
                  })
                ) : (
                  <Star className="mr-2 h-3 w-3 text-yellow-500 fill-yellow-500" />
                )}
                {hero.badge}
              </Badge>
            )}
          </div>

          {/* Main Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <HighlightedText
              text={hero.title || "Run Your {Clinic Smarter} with KiviCare"}
              highlightColor={hero.sectionHighlightColor}
            />
          </h1>

          {/* Subheading */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl" style={{ color: hero.sectionTextColor ? `${hero.sectionTextColor}cc` : undefined }}>
            <HighlightedText
              text={hero.description || "All-in-one clinic management, EHR, appointments & billing"}
              highlightColor={hero.sectionHighlightColor}
            />
          </p>
          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            {hero.showButton && (
              <Button size="lg" className="text-base cursor-pointer" asChild>
                <Link href={hero.buttonLink || "/sign-up"}>
                  {hero.buttonText || "Get Started Free"}
                  {hero.buttonIcon ? (
                    React.createElement((Icons as any)[hero.buttonIcon] || ArrowRight, { className: "ml-2 h-4 w-4" })
                  ) : (
                    <ArrowRight className="ml-2 h-4 w-4" />
                  )}
                </Link>
              </Button>
            )}

            {hero.showButton2 && (
              <Button variant="outline" size="lg" className="text-base cursor-pointer" asChild>
                <Link href={hero.button2Link || "#"}>
                  {hero.button2Icon ? (
                    React.createElement((Icons as any)[hero.button2Icon] || Play, { className: "mr-2 h-4 w-4" })
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  {hero.button2Text || "Watch Demo"}
                </Link>
              </Button>
            )}
          </div>

          <div className="mt-10 mb-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => {
              const text = (hero as any)[`heroPoint${i}`] || (DEFAULT_SETTINGS.hero as any)[`heroPoint${i}`]
              const iconName = (hero as any)[`heroPoint${i}Icon`] || (DEFAULT_SETTINGS.hero as any)[`heroPoint${i}Icon`]
              if (!text) return null
              return (
                <div key={i} className="inline-flex items-center gap-2 text-sm sm:text-base opacity-90">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary" style={{ backgroundColor: hero.sectionHighlightColor ? `${hero.sectionHighlightColor}20` : undefined, color: hero.sectionHighlightColor || undefined }}>
                    {iconName && (Icons as any)[iconName] ? (
                      React.createElement((Icons as any)[iconName], { className: "h-3.5 w-3.5" })
                    ) : (
                      <Settings2 className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span>{text}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Hero Image/Visual */}
        <div className="mx-auto mt-20 max-w-6xl">
          <div className="relative group">
            {/* Top background glow effect - positioned above the image */}
            <div className="absolute top-2 lg:-top-8 left-1/2 transform -translate-x-1/2 w-[90%] mx-auto h-24 lg:h-80 bg-primary/50 rounded-full blur-3xl"></div>

            <div className="relative rounded-xl border bg-card shadow-2xl">
              {/* Common dashboard image (no dark mode as per user request) */}
              <Image
                src={hero.heroImage || "/dashboard-light.png"}
                alt="Dashboard Preview"
                width={1200}
                height={800}
                className="w-full rounded-xl object-cover"
                priority
              />

              {/* Bottom fade effect - gradient overlay that fades the image to background */}
              <div
                className="absolute bottom-0 left-0 w-full h-32 md:h-40 lg:h-48 bg-gradient-to-b rounded-b-xl"
                style={{ backgroundImage: `linear-gradient(to bottom, transparent, ${hero.sectionBgColor || 'var(--background)'})` }}
              ></div>

              {/* Overlay play button for demo */}
              {(hero.showHeroPlayButton !== false) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="lg"
                    className="rounded-full h-16 w-16 p-0 cursor-pointer hover:scale-105 transition-transform"
                    asChild
                  >
                    <a
                      href={hero.heroVideoLink || (DEFAULT_SETTINGS.hero as any).heroVideoLink || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Watch demo video"
                    >
                      <Play className="h-6 w-6 fill-current" />
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
