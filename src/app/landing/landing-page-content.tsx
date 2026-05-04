"use client"

import React from 'react'
import { LandingNavbar } from './components/navbar'
import { HeroSection } from './components/hero-section'
import { LogoCarousel } from './components/logo-carousel'
import { StatsSection } from './components/stats-section'
import { FeaturesSection } from './components/features-section'
import { TeamSection } from './components/team-section'
import { TestimonialsSection } from './components/testimonials-section'
import { BlogSection } from './components/blog-section'
import { PricingSection } from './components/pricing-section'
import { CTASection } from './components/cta-section'
import { ContactSection } from './components/contact-section'
import { FaqSection } from './components/faq-section'
import { LandingFooter } from './components/footer'
import { LandingThemeCustomizer, LandingThemeCustomizerTrigger } from './components/landing-theme-customizer-new'
import { AboutSection } from './components/about-section'
import { getStoredAuthSession } from '@/lib/auth-session'
import { LandingContentProvider, useLandingContent } from '../../contexts/landing-content-context'
import { customizerApi } from '@/services/customizer.service'

function LandingPageInner() {
  const { settings } = useLandingContent()
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false)
  const [canCustomizeTheme, setCanCustomizeTheme] = React.useState(false)

  React.useEffect(() => {
    const session = getStoredAuthSession()
    const isAdmin = session?.user?.role === "admin"
    setCanCustomizeTheme(isAdmin)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <LandingNavbar />

      {/* Main Content */}
      <main>
        {settings.hero.show && (settings.hero.heroLayout === 'style2' ? <CTASection config={settings.hero} /> : <HeroSection />)}
        {settings.logos.show && <LogoCarousel />}
        {settings.stats.show && <StatsSection />}
        {settings.about.show && <AboutSection />}
        {settings.features.show && <FeaturesSection />}
        {settings.team.show && <TeamSection />}
        {settings.pricing.show && <PricingSection />}
        {settings.testimonials.show && <TestimonialsSection />}
        {settings.blog.show && <BlogSection />}
        {settings.faq.show && <FaqSection />}
        {/* Standalone CTA removed per user request, only available as Hero Layout 2 */}
        {settings.contact.show && <ContactSection />}
      </main>

      {/* Footer */}
      <LandingFooter />

      {/* Theme Customizer (admin only) */}
      {canCustomizeTheme && (
        <>
          <LandingThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
          <LandingThemeCustomizer open={themeCustomizerOpen} onOpenChange={setThemeCustomizerOpen} />
        </>
      )}
    </div>
  )
}

import { colorThemes, tweakcnThemes } from '@/config/theme-data'

export function LandingPageContent({ initialSettings }: { initialSettings?: any }) {
  const [resolvedSettings, setResolvedSettings] = React.useState<any>(initialSettings ?? null)

  React.useEffect(() => {
    let mounted = true
    const hydratePublicCustomizer = async () => {
      try {
        const settings = await customizerApi.getSettingsPublic()
        if (!mounted) return
        if (settings) setResolvedSettings(settings)
      } catch {
        // keep SSR-provided settings if fetch fails
      }
    }
    hydratePublicCustomizer()
    return () => {
      mounted = false
    }
  }, [])

  // Synchronously compute theme variables on server to prevent CSS flash/FOUC completely
  const themeCss = React.useMemo(() => {
    const theme = resolvedSettings?.landing_theme
    if (!theme) return null
    const radius = theme.radius ?? 0.5

    let css = `:root { --radius: ${radius}rem; `

    let styles: Record<string, string> = {}
    const persistedCustomColors = theme.custom_colors || theme.brand_colors
    const shouldApplyCustomColors =
      !theme.tweakcn_preset && !theme.preset

    if (theme.tweakcn_preset) {
      const themeObj = tweakcnThemes.find(t => t.value === theme.tweakcn_preset)
      if (themeObj) {
        styles = themeObj.preset.styles.light
      }
    } else if (theme.preset) {
      const themeObj = colorThemes.find(t => t.value === theme.preset)
      if (themeObj) {
        styles = themeObj.preset.styles.light
      }
    } else if (shouldApplyCustomColors && persistedCustomColors) {
      const defaultTheme = colorThemes.find(t => t.value === "default")
      if (defaultTheme) {
        styles = defaultTheme.preset.styles.light
      }
    }

    Object.entries(styles).forEach(([key, value]) => {
      if (key === "radius") return
      css += `--${key}: ${value}; `
    })

    if (shouldApplyCustomColors && persistedCustomColors) {
      Object.entries(persistedCustomColors).forEach(([key, values]) => {
        const firstColor = (values as any)?.[0]?.code
        if (firstColor) {
          css += `--${key.replace(/_/g, '-')}: ${firstColor}; `
        }
      })
    }

    css += `}`
    return css
  }, [resolvedSettings?.landing_theme])

  return (
    <>
      {themeCss && <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeCss }} />}
      <LandingContentProvider initialSettings={resolvedSettings}>
        <LandingPageInner />
      </LandingContentProvider>
    </>
  )
}
