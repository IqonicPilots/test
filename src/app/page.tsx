import type { Metadata } from 'next'
import LandingClientWrapper from './landing-client-wrapper'

export const metadata: Metadata = {
  title: 'KiviCare – Clinic Management System | EHR, Appointments & Billing Software',
  description:
    'KiviCare is a complete clinic management system to manage patients, appointments, EHR, billing, and telemedicine. Built for modern clinics and healthcare providers to streamline operations and improve patient care.',
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
    description:
      'Manage patients, appointments, EHR, billing, and telemedicine with KiviCare. A modern healthcare management system for clinics and hospitals.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KiviCare – Clinic Management System',
    description:
      'All-in-one healthcare software for patient management, appointments, EHR, billing, and telemedicine.',
  },
}

export default function HomePage() {
  return <LandingClientWrapper />
}
