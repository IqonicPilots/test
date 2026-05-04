"use client"

import * as Icons from 'lucide-react'
import { buttonVariants, Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DEFAULT_SETTINGS, useLandingContent } from '../../../contexts/landing-content-context'
import { HighlightedText } from '@/components/highlighted-text'
import Link from 'next/link'

import { type LandingSectionConfig } from '@/services/customizer.service'
import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function CTASection({ config }: { config?: LandingSectionConfig }) {
  const { settings, hydrated } = useLandingContent()
  const cta = config || settings.cta

  if (!cta.show) return null

  if (!hydrated) {
    return (
      <section className="py-16 lg:py-24 relative z-0 min-h-[50vh] flex items-center">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex flex-col items-center gap-4 mb-8">
              <Skeleton className="h-7 w-48 rounded-full" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-12 w-full max-w-2xl mx-auto mb-6" />
            <Skeleton className="h-5 w-full max-w-lg mx-auto mb-10" />
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Skeleton className="h-12 w-40 rounded-lg" />
              <Skeleton className="h-12 w-40 rounded-lg" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Helper to render icon dynamically
  const renderIcon = (iconName: string, className?: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Package
    return <Icon className={className} />
  }

  const getBackgroundClass = () => {
    switch (cta.heroBackgroundType) {
      case 'white': return 'bg-background'
      case 'accent': return 'bg-accent/50 group-hover:bg-accent/60 transition-colors'
      case 'primary-opacity': return 'bg-gradient-to-br from-primary/5 via-background to-secondary/5 backdrop-blur-sm'
      default: return 'bg-muted/80'
    }
  }

  return (
    <section
      id="hero-second"
      className={cn('py-16 lg:py-24 relative z-0')}
      style={{ color: cta.sectionTextColor || undefined }}
    >
      {/* Background Base */}
      <div
        className={cn("absolute inset-0 -z-10", !cta.sectionBgColor && getBackgroundClass())}
        style={{ backgroundColor: cta.sectionBgColor || undefined }}
      />
      <div className='container mx-auto px-4 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          <div className='text-center'>
            <div className='space-y-8'>
              {/* Badge and Stats */}
              <div className='flex flex-col items-center gap-4 text-center'>
                <Badge
                  variant='outline'
                  className='px-4 py-2 text-sm font-medium'
                  style={{
                    backgroundColor: cta.sectionHighlightColor ? `${cta.sectionHighlightColor}15` : undefined,
                    color: cta.sectionHighlightColor || undefined,
                    borderColor: cta.sectionHighlightColor ? `${cta.sectionHighlightColor}40` : undefined
                  }}
                >
                  {((cta.hero2BadgeIcon || cta.badgeIcon) && (Icons as any)[cta.hero2BadgeIcon || cta.badgeIcon || '']) ? (
                    React.createElement((Icons as any)[cta.hero2BadgeIcon || cta.badgeIcon || ''], {
                      className: cn("mr-2 h-3.5 w-3.5",
                        (cta.hero2BadgeIcon === 'Star' || cta.badgeIcon === 'Star') ? "text-yellow-500 fill-yellow-500" : ""
                      )
                    })
                  ) : (
                    <Icons.Star className="mr-2 h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                  )}
                  {cta.hero2Badge || DEFAULT_SETTINGS.hero.hero2Badge || "Trusted Healthcare Platform"}
                </Badge>

                <div className='text-muted-foreground flex flex-wrap justify-center items-center gap-4 text-sm'>
                  {(cta.ctaStat1 || DEFAULT_SETTINGS.hero.ctaStat1) && (
                    <span className='flex items-center gap-1'>
                      <div className='size-2 rounded-full bg-green-500' />
                      {cta.ctaStat1 || DEFAULT_SETTINGS.hero.ctaStat1}
                    </span>
                  )}
                  {(cta.ctaStat2 || DEFAULT_SETTINGS.hero.ctaStat2) && (
                    <>
                      <Separator orientation='vertical' className='!h-4' />
                      <span>{cta.ctaStat2 || DEFAULT_SETTINGS.hero.ctaStat2}</span>
                    </>
                  )}
                  {(cta.ctaStat3 || DEFAULT_SETTINGS.hero.ctaStat3) && (
                    <>
                      <Separator orientation='vertical' className='!h-4' />
                      <span>{cta.ctaStat3 || DEFAULT_SETTINGS.hero.ctaStat3}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Main Content */}
              <div className='space-y-6'>
                <h1 className='text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl'>
                  <HighlightedText
                    text={cta.hero2Title || DEFAULT_SETTINGS.hero.hero2Title || "Ready to Simplify Your {Clinic Operations}?"}
                    highlightColor={cta.sectionHighlightColor}
                  />
                </h1>

                <p className='text-muted-foreground mx-auto max-w-2xl text-balance lg:text-xl' style={{ color: cta.sectionTextColor ? `${cta.sectionTextColor}cc` : undefined }}>
                  <HighlightedText
                    text={cta.hero2Description || DEFAULT_SETTINGS.hero.hero2Description || "Start managing patients, appointments, billing, and daily workflows with {KiviCare}."}
                    highlightColor={cta.sectionHighlightColor}
                  />
                </p>
              </div>

              {/* CTA Buttons */}
              <div className='flex flex-col justify-center gap-4 sm:flex-row sm:gap-6'>
                {cta.showButton && (
                  <Button size='lg' className='cursor-pointer px-8 py-6 text-lg font-medium' asChild>
                    <Link href={cta.buttonLink || "/sign-up"}>
                      {renderIcon(cta.buttonIcon || 'Package', 'me-2 size-5')}
                      {cta.buttonText || "Get Started"}
                    </Link>
                  </Button>
                )}

                {cta.showButton2 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={cta.button2Link || "#"}
                          className={buttonVariants({
                            variant: "outline",
                            size: "lg",
                            className: "cursor-pointer px-8 py-6 text-lg font-medium group",
                          })}
                        >
                          {renderIcon(cta.button2Icon || 'Linkedin', 'me-2 size-5')}
                          {cta.button2Text || "Contact Us"}
                          <Icons.ArrowRight className='ms-2 size-4 transition-transform group-hover:translate-x-1' />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{cta.button2Tooltip || "Response within 24 hours"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Trust Indicators */}
              <div className='text-muted-foreground flex flex-wrap items-center justify-center gap-6 text-sm'>
                {cta.ctaTrust1 && (
                  <div className='flex items-center gap-2'>
                    <div className='size-2 rounded-full bg-green-600 dark:bg-green-400 me-1' />
                    <span>{cta.ctaTrust1}</span>
                  </div>
                )}
                {cta.ctaTrust2 && (
                  <div className='flex items-center gap-2'>
                    <div className='size-2 rounded-full bg-blue-600 dark:bg-blue-400 me-1' />
                    <span>{cta.ctaTrust2}</span>
                  </div>
                )}
                {cta.ctaTrust3 && (
                  <div className='flex items-center gap-2'>
                    <div className='size-2 rounded-full bg-purple-600 dark:bg-purple-400 me-1' />
                    <span>{cta.ctaTrust3}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
