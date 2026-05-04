"use client"

import * as Icons from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { DotPattern } from '@/components/dot-pattern'
import { useLandingContent } from '../../../contexts/landing-content-context'

export function StatsSection() {
  const { settings, hydrated } = useLandingContent()
  const { stats } = settings

  if (!stats.show) return null

  if (!hydrated) {
    return (
      <section className="py-12 sm:py-16 relative z-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="text-center bg-background/60 backdrop-blur-sm border-border/50 py-0">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                  </div>
                  <Skeleton className="h-8 w-24 mx-auto mb-2" />
                  <Skeleton className="h-4 w-32 mx-auto mb-1" />
                  <Skeleton className="h-3 w-24 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 sm:py-16 relative z-0" style={{ color: stats.sectionTextColor || undefined }}>
      {/* Background Base */}
      <div 
        className="absolute inset-0 -z-10" 
        style={{ backgroundColor: stats.sectionBgColor || undefined }}
      />
      {!stats.sectionBgColor && (
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/8 via-transparent to-secondary/20" />
      )}
      <DotPattern className="opacity-75" size="md" fadeStyle="circle" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        {(stats.badge || stats.title || stats.description) && (
          <div className="mx-auto max-w-2xl text-center mb-12">
            {stats.badge && <Badge variant="outline" className="mb-4">{stats.badge}</Badge>}
            {stats.title && <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-4">{stats.title}</h2>}
            {stats.description && <p className="text-muted-foreground">{stats.description}</p>}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {(stats.items || []).map((stat, index) => {
            const IconName = stat.icon || 'Activity'
            const Icon = (Icons as any)[IconName] || Icons.Activity
            return (
              <Card
                key={index}
                className="text-center bg-background/60 backdrop-blur-sm border-border/50 py-0"
              >
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {stat.value}
                    </h3>
                    <p className="font-semibold text-foreground">{stat.label}</p>
                    {stat.description && <p className="text-sm text-muted-foreground">{stat.description}</p>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
