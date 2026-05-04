"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Star, Quote } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useLandingContent } from '../../../contexts/landing-content-context'
import { cn } from '@/lib/utils'

import { useLandingReviews, ReviewResponse } from '@/hooks/api/use-reviews'
import { HighlightedText } from '@/components/highlighted-text'
import { Skeleton } from '@/components/ui/skeleton'

type Testimonial = {
  name: string
  role: string
  image: string
  quote: string
  rating: number
}

function TestimonialSkeleton() {
  return (
    <Card className="break-inside-avoid shadow-none mb-6">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <div className="flex gap-1 pt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-3 rounded-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </CardContent>
    </Card>
  )
}

function TestimonialCard({ testimonial, className, contentClassName }: { testimonial: Testimonial; className?: string; contentClassName?: string }) {
  return (
    <Card className={cn("break-inside-avoid shadow-none", className)}>
      <CardContent className={cn("p-6", contentClassName)}>
        <div className="flex items-start gap-4">
          <Avatar className="bg-muted size-12 shrink-0 border border-primary/10">
            <AvatarImage
              alt={testimonial.name}
              src={testimonial.image}
              loading="lazy"
            />
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
              {testimonial.name
                .split(' ')
                .map(n => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-[#002B5B] truncate">{testimonial.name}</h4>
            <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">
              {testimonial.role}
            </span>
            <RatingStars rating={testimonial.rating} />
          </div>
        </div>

        <blockquote className="mt-4 relative">
          <Quote className="h-4 w-4 text-primary/10 absolute -top-2 -left-2 rotate-180" />
          <p className="text-sm leading-relaxed text-muted-foreground/90 pl-3 line-clamp-4">{testimonial.quote}</p>
        </blockquote>
      </CardContent>
    </Card>
  )
}

function RatingStars({ rating }: { rating: number }) {
  const safeRating = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0
  const full = Math.floor(safeRating)
  const hasHalf = safeRating - full >= 0.5

  return (
    <div className="mt-1 flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const isFull = i < full
        const isHalf = i === full && hasHalf

        return (
          <span key={i} className="relative inline-flex h-3 w-3">
            <Star className="h-3 w-3 text-muted-foreground/20" />
            {isFull ? (
              <Star className="absolute inset-0 h-3 w-3 fill-yellow-400 text-yellow-400" />
            ) : null}
            {isHalf ? (
              <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </span>
            ) : null}
          </span>
        )
      })}
    </div>
  )
}

export function TestimonialsSection() {
  const { settings, hydrated } = useLandingContent()
  const { testimonials: testimonialSettings } = settings

  const { data, isLoading: isDataLoading } = useLandingReviews({
    limit: testimonialSettings.testimonialLimit || 6,
    filter: testimonialSettings.testimonialFilter || 'highest'
  })

  if (!testimonialSettings.show) return null

  // We handle hydration skeletons first
  if (!hydrated) {
    return (
      <section className="py-24 sm:py-32 relative z-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Skeleton className="h-6 w-24 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-10 w-full max-w-md mx-auto mb-4" />
            <Skeleton className="h-5 w-full max-w-sm mx-auto" />
          </div>
          <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TestimonialSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  const reviews = data?.reviews || []

  // Map API reviews to Testimonial format
  const reviewsMapped = (reviews || []).map(r => ({
    name: `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`,
    role: 'Patient',
    image: r.patient?.profilePicture || "",
    quote: r.reviewText || r.comment || "",
    rating: r.rating || 5
  }))

  const isLoading = isDataLoading // hydrated is guaranteed true here

  return (
    <section id="testimonials" className="py-24 sm:py-32 relative z-0" style={{ color: testimonialSettings.sectionTextColor || undefined }}>
      {/* Background Base */}
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: testimonialSettings.sectionBgColor || undefined }}
      />
      {!testimonialSettings.sectionBgColor && (
        <div className="absolute inset-0 -z-10 bg-muted/30" />
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge
            variant="outline"
            className="mb-4"
            style={{
              backgroundColor: testimonialSettings.sectionHighlightColor ? `${testimonialSettings.sectionHighlightColor}15` : undefined,
              color: testimonialSettings.sectionHighlightColor || undefined,
              borderColor: testimonialSettings.sectionHighlightColor ? `${testimonialSettings.sectionHighlightColor}40` : undefined
            }}
          >
            {testimonialSettings.badge || "Reviews & Ratings"}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4" style={{ color: testimonialSettings.sectionTextColor || '#002B5B' }}>
            <HighlightedText
              text={testimonialSettings.title || "Trusted by Healthcare Professionals"}
              highlightColor={testimonialSettings.sectionHighlightColor}
            />
          </h2>
          <p className="text-lg text-muted-foreground" style={{ color: testimonialSettings.sectionTextColor ? `${testimonialSettings.sectionTextColor}cc` : undefined }}>
            <HighlightedText
              text={testimonialSettings.description || "See why thousands of doctors and clinic managers choose KiviCare for their daily operations."}
              highlightColor={testimonialSettings.sectionHighlightColor}
            />
          </p>
        </div>

        {/* Content State */}
        {isLoading ? (
          <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TestimonialSkeleton key={i} />
            ))}
          </div>
        ) : reviewsMapped.length > 0 ? (
          <>
            {/* Desktop Masonry Grid */}
            <div className="hidden md:block columns-1 gap-6 md:columns-2 lg:columns-3">
              {reviewsMapped.map((testimonial, index) => (
                <TestimonialCard key={index} testimonial={testimonial} className="mb-6" />
              ))}
            </div>

            {/* Mobile Carousel (Auto-scroll) */}
            <div className="relative md:hidden mt-8 overflow-hidden py-4 px-2">
              <div className="flex space-x-6 animate-logo-scroll overflow-x-visible">
                {/* Triple set for seamless loop on mobile */}
                {[...reviewsMapped, ...reviewsMapped, ...reviewsMapped].map((testimonial, index) => (
                  <div key={index} className="w-[85vw] max-w-[320px] shrink-0">
                    <TestimonialCard testimonial={testimonial} />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-card/50">
            <Quote className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium italic">Your patient success stories will appear here.</p>
          </div>
        )}
      </div>
    </section>
  )
}
