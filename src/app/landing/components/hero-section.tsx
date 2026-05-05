"use client"

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Play, Star, Users, CalendarCheck2, Settings2, Sparkles } from 'lucide-react'
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
  const [isVideoPlaying, setIsVideoPlaying] = React.useState(false)
  const videoCardRef = React.useRef<HTMLDivElement | null>(null)
  const defaultVideoSource =
    (DEFAULT_SETTINGS.hero as any).heroVideoLink ||
    (DEFAULT_SETTINGS.hero as any).button2Link ||
    ''

  const normalizeUrl = (url: string) => {
    if (!url || url === '#') return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `https://${url}`
  }

  const toEmbedUrl = (url: string) => {
    if (!url || url === '#') return ''

    try {
      const parsed = new URL(normalizeUrl(url))
      const host = parsed.hostname.replace('www.', '')

      if (host.includes('youtube.com')) {
        const videoId = parsed.searchParams.get('v')
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
        }

        if (parsed.pathname.startsWith('/shorts/')) {
          const shortId = parsed.pathname.split('/shorts/')[1]?.split('/')[0]
          if (shortId) {
            return `https://www.youtube.com/embed/${shortId}?autoplay=1&rel=0&modestbranding=1`
          }
        }
      }

      if (host.includes('youtu.be')) {
        const videoId = parsed.pathname.replace('/', '')
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
        }
      }

      if (host.includes('youtube.com') && parsed.pathname.startsWith('/embed/')) {
        return `${parsed.origin}${parsed.pathname}${parsed.search ? `${parsed.search}&autoplay=1` : '?autoplay=1'}`
      }
    } catch {
      // Fall back to raw URL when parsing fails.
    }

    return ''
  }

  const videoSource =
    hero.heroVideoLink ||
    hero.button2Link ||
    (DEFAULT_SETTINGS.hero as any).heroVideoLink ||
    (DEFAULT_SETTINGS.hero as any).button2Link ||
    defaultVideoSource

  const normalizedVideoSource = normalizeUrl(videoSource) || normalizeUrl(defaultVideoSource)
  const embedVideoUrl = toEmbedUrl(normalizedVideoSource) || toEmbedUrl(defaultVideoSource)
  const normalizedHeroImage =
    hero.heroImage === "/dashboard-light.png" || hero.heroImage === "#"
      ? ""
      : hero.heroImage
  const heroPreviewImage =
    normalizedHeroImage ||
    (DEFAULT_SETTINGS.hero as any).heroImage ||
    "/videobanner.png"

  const playDemoVideo = () => {
    if (embedVideoUrl) {
      setIsVideoPlaying(true)
      videoCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    if (normalizedVideoSource && normalizedVideoSource !== '#') {
      const newTab = window.open(normalizedVideoSource, '_blank', 'noopener,noreferrer')
      if (!newTab) {
        window.location.href = normalizedVideoSource
      }
    }
  }

  React.useEffect(() => {
    setIsVideoPlaying(false)
  }, [normalizedVideoSource])

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
              <Button size="lg" className="text-base cursor-pointer shadow-lg hover:shadow-primary/20 transition-all" asChild>
                <Link href={hero.buttonLink || "/demo"}>
                  {(hero.buttonIconPosition || DEFAULT_SETTINGS.hero.buttonIconPosition || "right") === "left" && (
                    hero.buttonIcon
                      ? React.createElement((Icons as any)[hero.buttonIcon] || ArrowRight, { className: "mr-2 h-4 w-4" })
                      : <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  {hero.buttonText || "Get Started Free"}
                  {(hero.buttonIconPosition || DEFAULT_SETTINGS.hero.buttonIconPosition || "right") !== "left" && (
                    hero.buttonIcon
                      ? React.createElement((Icons as any)[hero.buttonIcon] || ArrowRight, { className: "ml-2 h-4 w-4" })
                      : <ArrowRight className="ml-2 h-4 w-4" />
                  )}
                </Link>
              </Button>
            )}

            {hero.showButton2 && (
              <Button
                variant="outline"
                size="lg"
                type="button"
                className="text-base cursor-pointer"
                onClick={playDemoVideo}
              >
                  {(hero.button2IconPosition || DEFAULT_SETTINGS.hero.button2IconPosition || "right") === "left" && (
                    hero.button2Icon
                      ? React.createElement((Icons as any)[hero.button2Icon] || Sparkles, { className: "mr-2 h-4 w-4" })
                      : <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {hero.button2Text || "Watch Demo"}
                  {(hero.button2IconPosition || DEFAULT_SETTINGS.hero.button2IconPosition || "right") !== "left" && (
                    hero.button2Icon
                      ? React.createElement((Icons as any)[hero.button2Icon] || Sparkles, { className: "ml-2 h-4 w-4" })
                      : <Sparkles className="ml-2 h-4 w-4" />
                  )}
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

            <div ref={videoCardRef} className="relative rounded-xl border bg-card shadow-2xl">
              <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl">
                {isVideoPlaying && embedVideoUrl ? (
                  <iframe
                    src={embedVideoUrl}
                    title="KiviCare demo video"
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <>
                    {/* Common dashboard image (no dark mode as per user request) */}
                    <Image
                      src={heroPreviewImage}
                      alt="Dashboard Preview"
                      fill
                      className="object-cover"
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
                          type="button"
                          size="lg"
                          className="rounded-full h-16 w-16 p-0 cursor-pointer hover:scale-105 transition-transform"
                          onClick={playDemoVideo}
                          aria-label="Play demo video"
                        >
                          <Play className="h-6 w-6 fill-current" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
