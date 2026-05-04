"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { LandingContentSettings, LandingSectionConfig, customizerApi } from '@/services/customizer.service'

export const AVAILABLE_LINKS = [
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
  { label: 'Sign Up Page', value: '/sign-up' },
  { label: 'Sign In Page', value: '/sign-in' },
]

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
    heroImage: "/dashboard-light.png",
    showHeroPlayButton: true,
    heroVideoLink: "#",
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
    buttonLink: "/book-appointment",
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
    buttonText: "Book a Demo",
    buttonLink: "https://shadcnstore.com/templates",
    showButton2: true,
    button2Text: "Contact Us on LinkedIn",
    button2Link: "https://discord.com/invite/XEQhPc9a6p",
    button2Tooltip: "Response within 24 hours",
    // Style 2 Buttons
    f2ShowButton: true,
    f2ButtonText: "View Documentation",
    f2ButtonLink: "#",
    f2ShowButton2: true,
    f2Button2Text: "Contact Us on LinkedIn",
    f2Button2Link: "https://discord.com/invite/XEQhPc9a6p",
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
    buttonLink: "/doctor",
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
      { label: "Clinics", link: "#about" },
      { label: "Doctors", link: "#team" },
      { label: "Blog", link: "#blog" },
      { label: "About", link: "#features" },
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

    return merged
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const localStr = localStorage.getItem('kivicare-landing-cache')

    if (localStr) {
      try {
        const cached = JSON.parse(localStr)
        if (cached) {
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
            return merged
          })
        }
      } catch (e) { }
    }

    if (localStr || initialSettings) {
      setHydrated(true)
    }
  }, [initialSettings])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!initialSettings) {
      setHydrated(true)
    }
  }, [initialSettings])

  useEffect(() => {
    const hydrate = async () => {
      try {
        // Fetch fresh content from API in background (Stale-While-Revalidate)
        const res = await customizerApi.getSettingsPublic()
        const apiContent = res?.landing_content

        if (apiContent) {
          setSettings(prev => {
            const merged = { ...prev }
            Object.keys(apiContent).forEach(key => {
              const k = key as keyof LandingContentSettings
              if (apiContent[k] && typeof apiContent[k] === 'object') {
                merged[k] = { ...prev[k], ...apiContent[k] } as any
              } else {
                merged[k] = apiContent[k] as any
              }
            })

            localStorage.setItem('kivicare-landing-cache', JSON.stringify(merged))
            return merged
          })
        }
      } catch (e) {
        console.error("Failed to hydrate landing content:", e)
      } finally {
        setHydrated(true)
      }
    }

    hydrate()
  }, [])

  const updateSettings = (newSettings: LandingContentSettings) => {
    setSettings(newSettings)
    if (typeof window !== 'undefined') {
      localStorage.setItem('kivicare-landing-cache', JSON.stringify(newSettings))
    }
  }

  const updateSection = (section: keyof LandingContentSettings, config: Partial<LandingSectionConfig>) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [section]: { ...prev[section], ...config }
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('kivicare-landing-cache', JSON.stringify(newSettings))
      }
      return newSettings
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