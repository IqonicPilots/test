"use client"

import * as LucideIcons from 'lucide-react'
import { ArrowRight, Linkedin } from 'lucide-react'
import { buttonVariants, Button } from '@/components/ui/button'
import { Image3D } from '@/components/image-3d'
import { useLandingContent } from '../../../contexts/landing-content-context'
import { HighlightedText } from '@/components/highlighted-text'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import React from 'react'

// Helper to resolve icon from string
const getIcon = (name: string) => {
  const Icon = (LucideIcons as any)[name] || LucideIcons.Zap
  return Icon
}

export function FeaturesSection() {
  const { settings, hydrated } = useLandingContent()
  const { features } = settings

  if (!features.show) return null

  if (!hydrated) {
    return (
      <section className="py-24 sm:py-32 relative z-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Skeleton className="h-6 w-32 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-10 w-full max-w-lg mx-auto mb-6" />
            <Skeleton className="h-5 w-full max-w-md mx-auto" />
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="grid grid-cols-2 gap-4 mt-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-5 w-5 rounded shrink-0" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const mainFeaturesList = features.mainFeatures || []
  const secondaryFeaturesList = features.secondaryFeatures || []

  return (
    <section id="features" className="py-24 sm:py-32 relative z-0" style={{ color: features.sectionTextColor || undefined }}>
      {/* Background Base */}
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: features.sectionBgColor || undefined }}
      />
      {!features.sectionBgColor && (
        <div className="absolute inset-0 -z-10 bg-muted/30" />
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge 
            variant="outline" 
            className="mb-4"
            style={{
              backgroundColor: features.sectionHighlightColor ? `${features.sectionHighlightColor}15` : undefined,
              color: features.sectionHighlightColor || undefined,
              borderColor: features.sectionHighlightColor ? `${features.sectionHighlightColor}40` : undefined
            }}
          >
            {features.badgeIcon && LucideIcons[features.badgeIcon as keyof typeof LucideIcons] && (
              React.createElement(LucideIcons[features.badgeIcon as keyof typeof LucideIcons] as any, { className: "mr-2 h-3.5 w-3.5" })
            )}
            {features.badge || "KiviCare Features"}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            <HighlightedText 
              text={features.title || "Everything you need to {manage} your clinic"} 
              highlightColor={features.sectionHighlightColor}
            />
          </h2>
          <p className="text-lg text-muted-foreground" style={{ color: features.sectionTextColor ? `${features.sectionTextColor}cc` : undefined }}>
            <HighlightedText 
              text={features.description || "Built-in features designed specifically for {modern} healthcare providers and large-scale hospitals."} 
              highlightColor={features.sectionHighlightColor}
            />
          </p>
        </div>

        {/* First Feature Section */}
        {(mainFeaturesList.length > 0 || features.feature1Title) && (
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8 xl:gap-16 mb-24">
            {/* Left Image */}
            <Image3D
              lightSrc={features.feature1LightImage || "/feature-1-light.png"}
              darkSrc={features.feature1LightImage || "/feature-1-light.png"}
              alt="Analytics dashboard"
              direction="left"
            />
            {/* Right Content */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                  {features.feature1Title || "Smart Features Built for Healthcare Operations"}
                </h3>
                <p className="text-muted-foreground text-base text-pretty">
                  {features.feature1Description || "Designed to simplify workflows, reduce manual tasks, and improve patient experience across clinics and healthcare providers."}
                </p>
              </div>

              <ul className="grid gap-4 sm:grid-cols-2">
                {mainFeaturesList.map((feature, index) => {
                  const Icon = getIcon(feature.icon)
                  return (
                    <li key={index} className="group hover:bg-accent/5 flex items-start gap-3 p-2 rounded-lg transition-colors">
                      <div className="mt-0.5 flex shrink-0 items-center justify-center">
                        <Icon className="size-5 text-primary" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-foreground font-medium">{feature.title}</h3>
                        <p className="text-muted-foreground mt-1 text-sm">{feature.description}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>

              {/* Style 1 Buttons */}
              {(features.showButton || features.showButton2) && (
                <div className="flex flex-col sm:flex-row gap-4 pe-4 pt-2">
                  {features.showButton && (
                    <Button size="lg" className="cursor-pointer" asChild>
                      <a href={features.buttonLink || "#"} className='flex items-center'>
                        {features.buttonText || "Book a Demo"}
                        <ArrowRight className="ms-2 size-4" aria-hidden="true" />
                      </a>
                    </Button>
                  )}
                  {features.showButton2 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={features.button2Link || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({
                              size: "lg",
                              variant: "outline",
                              className: "cursor-pointer",
                            })}
                          >
                            <Linkedin className="mr-2 h-4 w-4" /> {features.button2Text || "Contact Us"}
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{features.button2Tooltip || "Response within 24 hours"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Second Feature Section - Flipped Layout */}
        {(secondaryFeaturesList.length > 0 || features.feature2Title) && (
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8 xl:gap-16">
            {/* Left Content */}
            <div className="space-y-6 order-2 lg:order-1">
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                  {features.feature2Title || "Built for Efficient Clinic Operations"}
                </h3>
                <p className="text-muted-foreground text-base text-pretty">
                  {features.feature2Description || "KiviCare is designed to simplify daily clinic operations with a powerful system for managing patients, appointments, billing, and workflows — helping healthcare providers save time and improve patient care."}
                </p>
              </div>

              <ul className="grid gap-4 sm:grid-cols-2">
                {secondaryFeaturesList.map((feature, index) => {
                  const Icon = getIcon(feature.icon)
                  return (
                    <li key={index} className="group hover:bg-accent/5 flex items-start gap-3 p-2 rounded-lg transition-colors">
                      <div className="mt-0.5 flex shrink-0 items-center justify-center">
                        <Icon className="size-5 text-primary" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-foreground font-medium">{feature.title}</h3>
                        <p className="text-muted-foreground mt-1 text-sm">{feature.description}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>

              {/* Style 2 Buttons */}
              {(features.f2ShowButton || features.f2ShowButton2) && (
                <div className="flex flex-col sm:flex-row gap-4 pe-4 pt-2">
                  {features.f2ShowButton && (
                    <Button size="lg" className="cursor-pointer" asChild>
                      <a href={features.f2ButtonLink || "#"} className='flex items-center'>
                        {features.f2ButtonText || "View Documentation"}
                        <ArrowRight className="ms-2 size-4" aria-hidden="true" />
                      </a>
                    </Button>
                  )}
                  {features.f2ShowButton2 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={features.f2Button2Link || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({
                              size: "lg",
                              variant: "outline",
                              className: "cursor-pointer",
                            })}
                          >
                            <Linkedin className="mr-2 h-4 w-4" /> {features.f2Button2Text || "Contact Us"}
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{features.f2Button2Tooltip || "Response within 24 hours"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
            </div>

            {/* Right Image */}
            <Image3D
              lightSrc={features.feature2LightImage || "/feature-2-light.png"}
              darkSrc={features.feature2LightImage || "/feature-2-light.png"}
              alt="Performance dashboard"
              direction="right"
              className="order-1 lg:order-2"
            />
          </div>
        )}
      </div>
    </section>
  )
}
