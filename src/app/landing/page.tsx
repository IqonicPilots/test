import type { Metadata } from 'next'
import { LandingPageContent } from './landing-page-content'

import { seoSettingsApi } from '@/services/seo-settings.service'
import { fetchCustomizerSettingsPublicServer } from '@/services/customizer.service'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await seoSettingsApi.getSettingsPublic()
    
    return {
      title: seo.meta_title || 'KiviCare – Clinic Management System | EHR, Appointments & Billing Software',
      description: seo.meta_description || 'KiviCare is a complete clinic management system to manage patients, appointments, EHR, billing, and telemedicine. Built for modern clinics and healthcare providers to streamline operations and improve patient care.',
      keywords: seo.meta_keywords && seo.meta_keywords.length > 0 ? seo.meta_keywords : [
        'clinic management system',
        'hospital management software',
        'patient management system',
        'EHR software',
        'EMR system',
        'appointment scheduling software',
        'healthcare management software',
        'clinic software',
        'telemedicine software',
        'medical practice management software'
      ],
      robots: {
        index: seo.robots_index ?? true,
        follow: seo.robots_follow ?? true,
      },
      icons: {
        icon: seo.favicon || '/favicon.ico',
        apple: seo.apple_touch_icon || '/apple-touch-icon.png',
      },
      openGraph: {
        title: seo.og_title || 'KiviCare – All-in-One Clinic Management Software',
        description: seo.og_description || 'Manage patients, appointments, EHR, billing, and telemedicine with KiviCare. A modern healthcare management system for clinics and hospitals.',
        type: 'website',
        images: seo.og_image ? [{ url: seo.og_image }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: seo.twitter_title || 'KiviCare – Clinic Management System',
        description: seo.twitter_description || 'All-in-one healthcare software for patient management, appointments, EHR, billing, and telemedicine.',
        images: seo.og_image ? [seo.og_image] : [],
      },
    }
  } catch (error) {
    console.error('Failed to fetch SEO settings:', error)
    return {
      title: 'KiviCare – Clinic Management System | EHR, Appointments & Billing Software',
      description: 'KiviCare is a complete clinic management system to manage patients, appointments, EHR, billing, and telemedicine. Built for modern clinics and healthcare providers to streamline operations and improve patient care.',
      keywords: [
        'clinic management system',
        'hospital management software',
        'patient management system',
        'EHR software',
        'EMR system',
        'appointment scheduling software',
        'healthcare management software',
        'clinic software',
        'telemedicine software',
        'medical practice management software'
      ],
      openGraph: {
        title: 'KiviCare – All-in-One Clinic Management Software',
        description: 'Manage patients, appointments, EHR, billing, and telemedicine with KiviCare. A modern healthcare management system for clinics and hospitals.',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'KiviCare – Clinic Management System',
        description: 'All-in-one healthcare software for patient management, appointments, EHR, billing, and telemedicine.',
      },
    }
  }
}

export default async function LandingPage() {
  const initialSettings = await fetchCustomizerSettingsPublicServer()
  return <LandingPageContent initialSettings={initialSettings} />
}
