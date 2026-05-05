"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { LandingContentSettings, LandingSectionConfig, customizerApi } from '@/services/customizer.service'
import { useBlogs } from '@/hooks/api/use-blogs'
import type { BlogPost } from '@/services/blog.service'
import { getStoredAuthSession } from '@/lib/auth-session'

const LANDING_CACHE_STORAGE_KEY = 'kivicare-landing-cache'

type LandingCacheEnvelope = {
  scope: string
  updatedAt: number
  data: LandingContentSettings
}

const LANDING_SCOPE_SEPARATOR = ':'

function getLandingCacheScope() {
  const session = getStoredAuthSession()
  const demoSessionId = String((session as any)?.demoSessionId || '').trim()
  const userId = String(session?.user?.id || 'anonymous').trim() || 'anonymous'

  // For demo mode, scope by demo-session only so role switching inside the same
  // demo session keeps a single shared landing state across roles.
  if (demoSessionId) {
    return `demo${LANDING_SCOPE_SEPARATOR}${demoSessionId}`
  }

  // For normal mode, keep user-scoped isolation.
  return `user${LANDING_SCOPE_SEPARATOR}${userId}${LANDING_SCOPE_SEPARATOR}global`
}

function isDemoScope(scope: string) {
  return scope.startsWith(`demo${LANDING_SCOPE_SEPARATOR}`)
}

function readLandingCacheEnvelope() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(LANDING_CACHE_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as LandingCacheEnvelope | LandingContentSettings
    if (parsed && typeof parsed === 'object' && 'scope' in parsed) {
      return parsed as LandingCacheEnvelope
    }
    return null
  } catch {
    return null
  }
}

function readLandingCache() {
  if (typeof window === 'undefined') return null

  const envelope = readLandingCacheEnvelope()
  if (envelope?.scope === getLandingCacheScope() && envelope.data && typeof envelope.data === 'object') {
    return envelope.data
  }

  // Backward compatibility fallback for old landing-cache payloads.
  const legacyRaw = window.localStorage.getItem(LANDING_CACHE_STORAGE_KEY)
  if (!legacyRaw) return null
  try {
    const legacy = JSON.parse(legacyRaw)
    if (legacy && typeof legacy === 'object' && 'scope' in legacy && 'data' in legacy) {
      return null
    }
    return legacy && typeof legacy === 'object' ? legacy as LandingContentSettings : null
  } catch {
    return null
  }
}

function writeLandingCache(settings: LandingContentSettings) {
  if (typeof window === 'undefined') return

  // Keep cache lightweight: dynamic blog payload can become very large and
  // trigger localStorage quota errors on some browsers/environments.
  const cacheSafeSettings: LandingContentSettings = {
    ...settings,
    blog: {
      ...(settings.blog || DEFAULT_SETTINGS.blog),
      posts: [],
    },
  }

  const envelope: LandingCacheEnvelope = {
    scope: getLandingCacheScope(),
    updatedAt: Date.now(),
    data: cacheSafeSettings,
  }

  try {
    window.localStorage.setItem(LANDING_CACHE_STORAGE_KEY, JSON.stringify(envelope))
  } catch (error) {
    // Never let cache write failures break rendering/hydration.
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearLandingCache()
      return
    }
    throw error
  }
}

function clearLandingCache() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(LANDING_CACHE_STORAGE_KEY)
}

export const AVAILABLE_LINKS = [
  { label: 'None', value: '#' },
  { label: 'Doctor List', value: '/doctor-list' },
  { label: 'Dashboard', value: '/dashboard' },
  { label: 'Clinic List', value: '/clinic-list' },
  { label: 'Book Appointment', value: '/book-appointment' },
  { label: 'Blog', value: '/blogs' },
  { label: 'Hero Section', value: '#hero' },
  { label: 'Trusted Partners', value: '#logos' },
  { label: 'Clinics', value: '#about' },
  { label: 'About', value: '#features' },
  { label: 'Doctors', value: '#team' },
  { label: 'Reviews & Ratings', value: '#testimonials' },
  { label: 'Latest Blog', value: '#blog' },
  { label: 'F.A.Q', value: '#faq' },
  { label: 'Contact Form', value: '#contact' },
  { label: 'Request Demo', value: '/demo' },
  { label: 'Sign Up Page', value: '/sign-up' },
  { label: 'Sign In Page', value: '/sign-in' },
  { label: 'Dashboard', value: '/dashboard' },
  { label: 'Doctors (Legacy Route)', value: '/doctor' },
  { label: 'Doctor List', value: '/doctor-list' },
  { label: 'Clinic List', value: '/clinic-list' },
  { label: 'Book Appointment', value: '/book-appointment' },
  { label: 'Features Page', value: '/features' },
  { label: 'Contact Us on LinkedIn', value: 'https://www.linkedin.com/company/kivicare/' },
]

const toComparableLink = (value?: string) => {
  const normalized = String(value || '').trim()
  if (!normalized || normalized === '#') return '#'
  if (/^https?:\/\//i.test(normalized)) {
    try {
      const url = new URL(normalized)
      const path = `${url.pathname || ''}${url.search || ''}${url.hash || ''}` || normalized
      return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path
    } catch {
      // Fallback to raw normalization below.
    }
  }
  return normalized.endsWith('/') && normalized.length > 1 ? normalized.slice(0, -1) : normalized
}

const resolveLinkFromAvailable = (value: unknown, fallbackValue: unknown = '#') => {
  const current = String(value ?? '').trim()
  const fallback = String(fallbackValue ?? '#').trim() || '#'

  const matchedCurrent = AVAILABLE_LINKS.find((link) => toComparableLink(link.value) === toComparableLink(current))
  if (matchedCurrent) return matchedCurrent.value

  const matchedFallback = AVAILABLE_LINKS.find((link) => toComparableLink(link.value) === toComparableLink(fallback))
  if (matchedFallback) return matchedFallback.value

  return '#'
}

const normalizeLandingLinks = (settings: LandingContentSettings): LandingContentSettings => {
  const normalized: LandingContentSettings = { ...settings }
  const fieldsBySection: Record<string, string[]> = {
    hero: ['buttonLink', 'button2Link'],
    about: ['buttonLink', 'button2Link'],
    cta: ['buttonLink', 'button2Link'],
    team: ['buttonLink'],
    faq: ['buttonLink'],
    header: ['buttonLink', 'button2Link'],
    features: ['buttonLink', 'button2Link', 'f2ButtonLink', 'f2Button2Link']
  }

  Object.entries(fieldsBySection).forEach(([sectionKey, fields]) => {
    const section = (normalized as any)[sectionKey] || {}
    const defaults = (DEFAULT_SETTINGS as any)[sectionKey] || {}
    const nextSection = { ...section }

    fields.forEach((field) => {
      nextSection[field] = resolveLinkFromAvailable(section[field], defaults[field])
    })

    ; (normalized as any)[sectionKey] = nextSection
  })

  const headerLogo = String(normalized?.header?.siteLogo || DEFAULT_SETTINGS.header.siteLogo || "").trim()
  const fallbackLogo = String(DEFAULT_SETTINGS.header.siteLogo || "/logo.png").trim()
  const syncedLogo = headerLogo || fallbackLogo

  normalized.footer = {
    ...(normalized.footer || DEFAULT_SETTINGS.footer),
    siteLogo: syncedLogo,
  } as any

  return normalized
}


export const DEFAULT_SETTINGS: LandingContentSettings = {
  hero: {
    show: true,
    heroLayout: 'style1',
    badge: "Trusted by 5000+ Clinics & Healthcare Providers",
    title: "Run Your {Clinic Smarter} with KiviCare",
    description: "All-in-one clinic management, EHR, appointments & billing",
    showButton: true,
    buttonText: "Get Started Free",
    buttonLink: "/sign-up",
    buttonIcon: "Package",
    showButton2: true,
    button2Text: "Watch Demo",
    button2Link: "#",
    button2Icon: "PlayCircle",
    ctaStat1: "5000+ Clinics",
    ctaStat2: "Global Clients",
    ctaStat3: "4.5 Rating",
    ctaTrust1: "Used by clinics worldwide",
    ctaTrust2: "Built for real healthcare workflows",
    ctaTrust3: "Continuous support & product updates",
    hero2Badge: "Trusted Healthcare Platform",
    hero2Title: "Ready to Simplify Your {Clinic Operations}?",
    hero2Description: "Start managing patients, appointments, billing, and daily workflows with {KiviCare}.",
    heroPoint1: "Patient Management System",
    heroPoint1Icon: "Users",
    heroPoint2: "Online Appointment Scheduling",
    heroPoint2Icon: "CalendarCheck2",
    heroPoint3: "Clinic Operations Billing",
    heroPoint3Icon: "Settings2",
    heroImage: "/videobanner.png",
    showHeroPlayButton: true,
    heroVideoLink: "https://www.youtube.com/watch?v=_VcHl-lNIbQ",
    heroBackgroundType: 'accent'
  },
  logos: {
    show: true,
    title: "Trusted Partners",
    logos: [
      { url: "/appointmed.webp", alt: "AppointMed" },
      { url: "/cedes.webp", alt: "Cedes" },
      { url: "/Chekei.webp", alt: "Chekei" },
      { url: "/conmed_azul.webp", alt: "Conmed Azul" },
      { url: "/global.clinic.webp", alt: "Global Clinic" },
      { url: "/HY.webp", alt: "HY" },
      { url: "/LOGO_WEB.webp", alt: "LOGO WEB" },
      { url: "/ort_logo.webp", alt: "ORT" },
      { url: "/trans.webp", alt: "Trans" },
      { url: "/web_logo.webp", alt: "Web Logo" },
      { url: "/Zapmed.webp", alt: "Zapmed" },
    ]
  },
  stats: {
    show: true,
    items: [
      { icon: "Users", value: "5000+", label: "Clinics & Providers", description: "Trusted worldwide" },
      { icon: "CalendarCheck", value: "50K+", label: "Appointments", description: "Seamless scheduling" },
      { icon: "History", value: "100K+", label: "Patient Records", description: "Securely managed" },
      { icon: "Star", value: "4.5", label: "Top Rated", description: "Highly rated platform" },
    ]
  },
  about: {
    show: true,
    badge: "Clinics",
    title: "Explore Our Global {Clinics}",
    description: "Connect with the best clinics and hospitals in our ever-growing network. Managed by KiviCare.",
    showButton: true,
    buttonText: "View All Clinics",
    buttonLink: "/clinic-list",
    filter: 'latest',
    limit: 4,
    showButton2: true,
    button2Text: "Contact Us",
    button2Link: "#",
    button2Tooltip: "Response within 24 hours"
  },
  features: {
    show: true,
    title: "Everything you need to {manage} your clinic",
    description: "Built-in features designed specifically for {modern} healthcare providers and large-scale hospitals.",
    feature1Title: "Smart Features Built for Healthcare Operations",
    feature1Description: "Designed to simplify workflows, reduce manual tasks, and improve patient experience across clinics and healthcare providers.",
    feature1LightImage: "/feature-1-light.png",
    mainFeatures: [
      { icon: 'Users', title: 'Patient Management System', description: 'Manage patient records, medical history, and documents in one centralized and secure platform' },
      { icon: 'CalendarCheck2', title: 'Online Appointment Scheduling', description: 'Enable online booking with automated reminders to reduce no-shows and improve clinic efficiency' },
      { icon: 'CreditCard', title: 'Billing & Payment Management', description: 'Manage invoices, track payments, and accept secure online payments with Stripe, Razorpay, and PayPal integrations' },
      { icon: 'FileText', title: 'EHR & Digital Records', description: 'Secure electronic health records system to store and access patient data anytime, anywhere' },
      { icon: 'Video', title: 'Telemedicine & Video Consultation', description: 'Enable online doctor consultations with secure video calls, remote patient care, and virtual appointments' },
      { icon: 'MessageSquare', title: 'SMS & WhatsApp Notifications', description: 'Send automated appointment reminders, alerts, and updates via SMS and WhatsApp using Twilio integration' },
    ],
    feature2Title: "Built for Efficient Clinic Operations",
    feature2Description: "KiviCare is designed to simplify daily clinic operations with a powerful system for managing patients, appointments, billing, and workflows — helping healthcare providers save time and improve patient care.",
    feature2LightImage: "/feature-2-light.png",
    secondaryFeatures: [
      { icon: 'Layout', title: 'Clinic Operations Dashboard', description: 'Monitor appointments, revenue, and daily clinic activities with real-time insights and analytics' },
      { icon: 'ShieldCheck', title: 'Secure & Compliant System', description: 'Built with modern architecture ensuring data security, privacy, and reliable performance' },
      { icon: 'Users', title: 'Multi-User Role Management', description: 'Control access for doctors, staff, and admins with flexible role-based permissions' },
      { icon: 'Zap', title: 'Automated Workflows', description: 'Streamline daily operations with smart automation for scheduling, notifications, and tasks' },
      { icon: 'Globe', title: 'Multi-Language Support', description: 'Support multiple languages to serve patients globally and improve accessibility across regions' }
    ],
    // Style 1 Buttons
    showButton: true,
    buttonText: "Try Demo",
    buttonLink: "/demo",
    showButton2: true,
    button2Text: "Contact Us on LinkedIn",
    button2Link: "https://www.linkedin.com/company/kivicare/",
    button2Tooltip: "Response within 24 hours",
    // Style 2 Buttons
    f2ShowButton: true,
    f2ButtonText: "View Documentation",
    f2ButtonLink: "#",
    f2ShowButton2: true,
    f2Button2Text: "Contact Us on LinkedIn",
    f2Button2Link: "#",
    f2Button2Tooltip: "Response within 24 hours"
  },
  team: {
    show: true,
    badge: "Doctors",
    title: "Meet Our Dedicated Doctors",
    description: "Connect with highly qualified professionals dedicated to providing the best healthcare services.",
    teamFilter: 'latest',
    teamLimit: 8,
    showButton: true,
    buttonText: "View All Doctors",
    buttonLink: "/doctor-list",
  },
  pricing: { show: false, badge: "Flexible Plans" },
  testimonials: {
    show: true,
    badge: "Reviews & Ratings",
    title: "Trusted by Healthcare Professionals",
    description: "See why thousands of doctors and clinic managers choose KiviCare for their daily operations.",
    testimonialFilter: 'highest',
    testimonialLimit: 6
  },
  blog: {
    show: true,
    badge: "Latest Insights",
    title: "Latest Healthcare {Insights}",
    description: "Stay updated with the latest trends, research, and tips in the healthcare industry.",
    blogLimit: 6,
    posts: []
  },
  faq: {
    show: true,
    badge: "FAQ",
    title: "Frequently Asked Questions",
    description: "Find answers to help you get started with KiviCare.",
    subDescription: "Still have questions? We're here to help.",
    showButton: true,
    buttonText: "Contact Support",
    buttonLink: "#contact",
    faqItems: [
      {
        question: 'What is KiviCare?',
        answer: 'KiviCare is an all-in-one clinic management system that helps healthcare providers manage patients, appointments, billing, and electronic health records (EHR) from a single platform.',
      },
      {
        question: 'Does KiviCare support online appointment booking?',
        answer: 'Yes, KiviCare includes an online appointment scheduling system that allows patients to book appointments and clinics to manage schedules with automated reminders.',
      },
      {
        question: 'Can I manage multiple clinics with KiviCare?',
        answer: 'Yes, KiviCare supports multi-clinic management, allowing you to manage multiple locations, doctors, and operations from one centralized system.',
      },
      {
        question: 'Does KiviCare support telemedicine?',
        answer: 'Yes, KiviCare supports telemedicine features including video consultations and remote patient care.',
      },
      {
        question: 'Can I accept online payments?',
        answer: 'Yes, KiviCare supports secure online payments with integrations like Stripe, Razorpay, and PayPal.',
      },
      {
        question: 'Is KiviCare customizable?',
        answer: 'Yes, KiviCare is highly customizable and can be tailored to match your clinic’s workflow and operational needs.',
      }
    ]
  },
  cta: {
    show: true,
    badge: "Get Started",
    title: "Ready to Simplify Your {Clinic Operations}?",
    description: "Start managing patients, appointments, billing, and daily workflows with {KiviCare}.",
    showButton: true,
    buttonText: "Get Started",
    buttonLink: "/sign-up",
    buttonIcon: "Package",
    showButton2: true,
    button2Text: "Contact Us",
    button2Link: "#",
    button2Icon: "Linkedin",
    button2Tooltip: "Response within 24 hours",
    ctaStat1: "5000+ Clinics",
    ctaStat2: "Global Clients",
    ctaStat3: "4.5 Rating",
    ctaTrust1: "Used by clinics worldwide",
    ctaTrust2: "Built for real healthcare workflows",
    ctaTrust3: "Continuous support & product updates"
  },
  header: {
    show: true,
    siteLogo: "/logo.png",
    siteName: "KiviCare",
    menuLinks: [
      { label: "Home", link: "#hero" },
      { label: "About", link: "#features" },
      { label: "Clinics", link: "#about" },
      { label: "Doctors", link: "#team" },
      { label: "Blog", link: "#blog" },
      { label: "Contact", link: "#contact" }
    ],
    showButton: true,
    buttonText: "Book Appointment",
    buttonLink: "/book-appointment",
    showButton2: true,
    button2Text: "Sign In",
    button2Link: "/sign-in",
    loginText: "Sign In",
    logoutText: "Sign Out",
    dashboardText: "Dashboard",
    profileText: "Profile",
    passwordText: "Change Password"
  },
  footer: {
    show: true,
    siteLogo: "/logo.png",
    siteName: "KiviCare",
    description: "Modern healthcare management platform for clinics and hospitals. Simplify your operations and improve patient care with KiviCare.",
    menuLinks: [
      { label: "Doctors", link: "#team" },
      { label: "Clinics", link: "#about" },
      { label: "Blog", link: "/blogs" },
      { label: "Support", link: "#" },
      { label: "About", link: "#features" },
      { label: "Contact", link: "#contact" }
    ],
    socialLinks: [
      { icon: "Facebook", link: "#" },
      { icon: "Twitter", link: "#" },
      { icon: "Instagram", link: "#" },
      { icon: "Linkedin", link: "#" }
    ],
    copyright: "© 2026 KiviCare. All rights reserved.",
    footerMadeByText: "Made with",
    footerMadeByAuthor: "Kivicare",
    footerMadeByLink: "https://kivicare.com",
    footerContactMode: 'manual',
    footerManualAddress: "No. 12, Main Street, New York, USA",
    footerManualEmail: "hello@kivicare.com",
    footerManualPhone: "+1 (555) 000-0000",
    showNewsletter: true,
    newsletterTitle: "Stay updated",
    newsletterDescription: "Get the latest updates, articles, and resources sent to your inbox weekly.",
    bottomMenuLinks: [
      { label: "Privacy Policy", link: "#privacy" },
      { label: "Terms of Service", link: "#terms" }
    ]
  },
  contact: {
    show: true,
    badge: "Get In Touch",
    title: "Need help or have questions?",
    description: "Our team is here to help you get started with KiviCare. Choose the best way to connect with us.",
    formIcon: "Mail",
    formTitle: "Send us a message",
    submitButtonText: "Send Message",
    contactOptions: [
      {
        icon: "MessageCircle",
        title: "Talk to Our Team",
        description: "Connect with our team to discuss your clinic requirements and get the best solution.",
        buttonText: "Contact on LinkedIn",
        buttonLink: "https://discord.com/invite/XEQhPc9a6p",
        tooltip: "Response within 24 hours"
      },
      {
        icon: "Headphones",
        title: "Contact Support",
        description: "Get help with setup, customization, or any queries related to your clinic management system.",
        buttonText: "Contact Support",
        buttonLink: "https://github.com/silicondeck/shadcn-dashboard-landing-template/issues"
      },
      {
        icon: "BookOpen",
        title: "Documentation",
        description: "Browse our comprehensive guides, tutorials, and component documentation.",
        buttonText: "View Docs",
        buttonLink: "#"
      }
    ]
  }
}

type LandingContentContextType = {
  settings: LandingContentSettings
  hydrated: boolean
  updateSettings: (newSettings: LandingContentSettings) => void
  updateSection: (section: keyof LandingContentSettings, config: Partial<LandingSectionConfig>) => void
}

const LandingContentContext = createContext<LandingContentContextType | undefined>(undefined)

export function LandingContentProvider({ children, initialSettings }: { children: React.ReactNode, initialSettings?: any }) {
  const [hydrated, setHydrated] = useState(false)
  const landingScopeRef = useRef<string>(getLandingCacheScope())
  const [settings, setSettings] = useState<LandingContentSettings>(() => {
    // 1. Start with hardcoded defaults
    const merged = { ...DEFAULT_SETTINGS }

    // 2. Merge initialSettings if provided (SSR)
    if (initialSettings) {
      Object.keys(initialSettings).forEach(key => {
        const k = key as keyof LandingContentSettings
        if (initialSettings[k] && typeof initialSettings[k] === 'object') {
          merged[k] = { ...merged[k], ...initialSettings[k] } as any
        } else {
          merged[k] = initialSettings[k] as any
        }
      })
    }

    return normalizeLandingLinks(merged as LandingContentSettings)
  })

  // Fetch latest blogs dynamically using blogLimit
  const blogLimit = (settings?.blog?.blogLimit) || 6

  const { data: blogsResponse } = useBlogs(
    1,
    blogLimit,
    {
      status: "published",
      sort: "newest"
    }
  )

  const latestBlogs = blogsResponse?.data || []

  useEffect(() => {
    if (typeof window === 'undefined') return

    const cached = readLandingCache()

    if (cached) {
      try {
        if (cached && typeof cached === 'object') {
          setSettings(prev => {
            const merged = { ...prev }
            Object.keys(cached).forEach(key => {
              const k = key as keyof LandingContentSettings
              if (cached[k] && typeof cached[k] === 'object') {
                merged[k] = { ...merged[k], ...cached[k] } as any
              } else {
                merged[k] = cached[k] as any
              }
            })
            return normalizeLandingLinks(merged as LandingContentSettings)
          })
        }
      } catch (e) { }
    }

    if (cached || initialSettings) {
      setHydrated(true)
    }
  }, [initialSettings])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!initialSettings) {
      setHydrated(true)
    }
  }, [initialSettings])

  // Auto-update blog posts when latest blogs are fetched
  useEffect(() => {
    if (latestBlogs.length > 0) {
      setSettings(prev => {
        const newSettings = {
          ...prev,
          blog: {
            ...prev.blog,
            posts: latestBlogs.map((blog: BlogPost) => ({
              ...blog,
              image: blog.image
            }))
          }
        }

        // Save to localStorage
        const normalizedSettings = normalizeLandingLinks(newSettings as LandingContentSettings)
        if (typeof window !== 'undefined') {
          writeLandingCache(normalizedSettings)
        }

        return normalizedSettings
      })
    }
  }, [latestBlogs])

  useEffect(() => {
    let isMounted = true
    const hydrate = async () => {
      try {
        // Use authenticated customizer settings when logged in (includes demo session-scoped logos).
        // Fallback to public settings for guests.
        const session = getStoredAuthSession()
        const res = session?.accessToken
          ? await customizerApi.getSettings()
          : await customizerApi.getSettingsPublic()
        const apiContent = res?.landing_content

        if (!isMounted) return

        if (apiContent) {
          setSettings(prev => {
            const merged = { ...prev }
            Object.keys(apiContent).forEach(key => {
              const k = key as keyof LandingContentSettings
              if (apiContent[k] && typeof apiContent[k] === 'object') {
                merged[k] = { ...(prev[k] || DEFAULT_SETTINGS[k]), ...apiContent[k] } as any
              } else {
                merged[k] = apiContent[k] as any
              }
            })

            const normalized = normalizeLandingLinks(merged as LandingContentSettings)
            writeLandingCache(normalized)
            return normalized
          })
        }
      } catch (e) {
        console.error("Failed to hydrate landing content:", e)
      } finally {
        if (isMounted) {
          setHydrated(true)
        }
      }
    }

    const handleThemeUpdated = () => {
      void hydrate()
    }
    const handleLandingCustomizerUpdated = () => {
      void hydrate()
    }
    const handleCustomizerUpdated = () => {
      void hydrate()
    }
    const handleAuthSessionChange = () => {
      const previousScope = landingScopeRef.current
      const nextScope = getLandingCacheScope()
      // Ensure demo-local landing edits (hero thumbnail/video URL, etc.) are purged
      // when the demo session changes or ends.
      if (isDemoScope(previousScope) && previousScope !== nextScope) {
        clearLandingCache()
      }
      landingScopeRef.current = nextScope
      void hydrate()
    }
    const handleFocus = () => {
      void hydrate()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void hydrate()
      }
    }
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LANDING_CACHE_STORAGE_KEY) {
        void hydrate()
      }
    }

    void hydrate()
    window.addEventListener('kivicare-theme-updated', handleThemeUpdated)
    window.addEventListener('kivicare-landing-customizer-updated', handleLandingCustomizerUpdated)
    window.addEventListener('kivicare-customizer-updated', handleCustomizerUpdated)
    window.addEventListener('kivicare-auth-session-changed', handleAuthSessionChange)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      isMounted = false
      window.removeEventListener('kivicare-theme-updated', handleThemeUpdated)
      window.removeEventListener('kivicare-landing-customizer-updated', handleLandingCustomizerUpdated)
      window.removeEventListener('kivicare-customizer-updated', handleCustomizerUpdated)
      window.removeEventListener('kivicare-auth-session-changed', handleAuthSessionChange)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const updateSettings = (newSettings: LandingContentSettings) => {
    const normalizedSettings = normalizeLandingLinks(newSettings)
    setSettings(normalizedSettings)
    if (typeof window !== 'undefined') {
      writeLandingCache(normalizedSettings)
    }
  }

  const updateSection = (section: keyof LandingContentSettings, config: Partial<LandingSectionConfig>) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [section]: { ...prev[section], ...config }
      }
      const normalizedSettings = normalizeLandingLinks(newSettings as LandingContentSettings)
      if (typeof window !== 'undefined') {
        writeLandingCache(normalizedSettings)
      }
      return normalizedSettings
    })
  }

  return (
    <LandingContentContext.Provider value={{ settings, hydrated, updateSettings, updateSection }}>
      {children}
    </LandingContentContext.Provider>
  )
}

export function useLandingContent() {
  const context = useContext(LandingContentContext)
  if (context === undefined) {
    throw new Error('useLandingContent must be used within a LandingContentProvider')
  }
  return context
}